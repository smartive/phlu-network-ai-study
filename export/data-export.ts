import { Pool, PoolClient } from 'pg';
import { Storage } from '@google-cloud/storage';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Connector, IpAddressTypes } from '@google-cloud/cloud-sql-connector';
import { GoogleAuth } from 'google-auth-library';
import * as ExcelJS from 'exceljs';

// Load environment variables from .env file
dotenv.config();

// --- Configuration ---
// Read Cloud SQL and GCS config from environment variables
const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME;
const dbUser = process.env.POSTGRES_USER;
const dbPassword = process.env.POSTGRES_PASSWORD;
const dbName = process.env.POSTGRES_DATABASE;

const gcsProjectId = process.env.GCP_PROJECT_ID;
const gcsCredentialsJson = process.env.GCP_CREDENTIALS || '{}';
const gcsBucketName = process.env.GCP_BUCKET_NAME || '';

// Validate required environment variables
if (
  !instanceConnectionName ||
  !dbUser ||
  !dbPassword ||
  !dbName ||
  !gcsProjectId ||
  !gcsCredentialsJson ||
  !gcsBucketName
) {
  console.error(
    'Missing required environment variables. Check your .env file.'
  );
  console.error('Required:', [
    'INSTANCE_CONNECTION_NAME',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DATABASE',
    'GCP_PROJECT_ID',
    'GCP_CREDENTIALS',
    'GCP_BUCKET_NAME',
  ]);
  process.exit(1); // Exit if config is missing
}

let gcsCredentials;
try {
  gcsCredentials = JSON.parse(gcsCredentialsJson);
} catch (error) {
  console.error('Failed to parse GCP_CREDENTIALS JSON:', error);
  process.exit(1);
}

const exportBaseDir = path.join(process.cwd(), 'exports'); // Create 'exports' folder in project root

// --- Initialize Clients ---

// Initialize Google Auth and Cloud SQL Connector
const auth = new GoogleAuth({
  credentials: gcsCredentials,
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

let pool: Pool;
const connector = new Connector({
  auth, // Pass the auth instance here
});

// Initialize GCS Storage client
const storage = new Storage({
  projectId: gcsProjectId,
  credentials: gcsCredentials,
});
const bucket = storage.bucket(gcsBucketName);

// --- Database Interaction ---

// Interfaces based on provided examples and schema
interface PersonData {
  id: string;
  name: string;
  setting?: string; // Optional based on example variance
  function?: string;
  significance?: number;
  learningOutcome?: string;
  [key: string]: string | number | undefined; // Allow other potential string/number keys
}

interface NetworkMapData {
  people?: PersonData[];
}

// More flexible type for questionnaire section values
type QuestionnaireSectionValue =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | null;

interface QuestionnaireData {
  [sectionKey: string]:
    | QuestionnaireSectionValue
    | Record<string, QuestionnaireSectionValue>;
}

interface User {
  id: string;
  assigned_group: 'chatbot' | 'human' | 'test';
  questionnaire_1: Record<string, unknown> | null;
  questionnaire_2: Record<string, unknown> | null;
  created_at: Date;
}

interface NetworkMap {
  map_data: Record<string, unknown>;
}

interface ChatLog {
  role: string;
  message: string;
  timestamp: Date;
}

// Function to get a database client from the pool
async function getClient(): Promise<PoolClient> {
  if (!pool) {
    // Initialize the pool if it doesn't exist
    console.log('Initializing database connection pool...');

    const clientOpts = await connector.getOptions({
      instanceConnectionName: instanceConnectionName!,
      ipType: IpAddressTypes.PUBLIC, // Or PRIVATE if needed
    });

    pool = new Pool({
      ...clientOpts,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      max: 5, // Smaller pool for a script might be sufficient
      idleTimeoutMillis: 30000,
    });
    console.log('Database connection pool initialized.');
  }
  return pool.connect();
}

async function getAllUsers(client: PoolClient): Promise<User[]> {
  const result = await client.query<User>(
    'SELECT id, assigned_group, questionnaire_1, questionnaire_2, created_at FROM users'
  );
  return result.rows;
}

async function getNetworkMap(
  client: PoolClient,
  userId: string
): Promise<NetworkMap | null> {
  const result = await client.query<NetworkMap>(
    'SELECT map_data FROM network_maps WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [userId]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function getChatLogs(
  client: PoolClient,
  userId: string
): Promise<ChatLog[]> {
  const result = await client.query<ChatLog>(
    'SELECT role, message, timestamp FROM chat_logs WHERE user_id = $1 ORDER BY timestamp ASC',
    [userId]
  );
  return result.rows;
}

// --- Google Cloud Storage Interaction ---
async function downloadAudioFile(
  userId: string,
  destinationPath: string
): Promise<boolean> {
  const fileName = `interviews/${userId}.webm`;
  const file = bucket.file(fileName);

  try {
    const [exists] = await file.exists();
    if (!exists) {
      console.warn(`Audio file not found for user ${userId}: ${fileName}`);
      return false;
    }
    await file.download({ destination: destinationPath });
    console.log(`Downloaded audio for ${userId} to ${destinationPath}`);
    return true;
  } catch (error) {
    console.error(`Error downloading audio for user ${userId}:`, error);
    return false;
  }
}

// --- File System Operations ---

// Helper function to add Network Map data to an Excel worksheet
function addNetworkMapSheet(
  worksheet: ExcelJS.Worksheet,
  mapData: NetworkMapData | null | undefined
): void {
  if (
    !mapData ||
    !Array.isArray(mapData.people) ||
    mapData.people.length === 0
  ) {
    worksheet.addRow(['No network map data available or no people found.']);
    return;
  }

  const people = mapData.people;
  // Dynamically determine columns from the keys of the first person object
  // Assumes all person objects have similar structures
  const columns = Object.keys(people[0] || {}).map((key) => ({
    header: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize header
    key: key,
    width: key === 'learningOutcome' || key === 'setting' ? 50 : 20, // Wider for text fields
  }));

  worksheet.columns = columns;

  // Add data rows
  people.forEach((person) => {
    worksheet.addRow(person);
  });

  // Apply wrap text to relevant columns
  worksheet.columns.forEach((column) => {
    if (column.key === 'learningOutcome' || column.key === 'setting') {
      worksheet.getColumn(column.key).alignment = {
        wrapText: true,
        vertical: 'top',
      };
    }
  });

  worksheet.getRow(1).font = { bold: true }; // Bold header row
}

// Helper function to add Questionnaire data (structured) to an Excel worksheet
function addQuestionnaireSheet(
  worksheet: ExcelJS.Worksheet,
  qData: QuestionnaireData | null | undefined
): void {
  if (!qData) {
    worksheet.addRow(['No questionnaire data available.']);
    return;
  }

  worksheet.columns = [
    { header: 'Question/Key', key: 'key', width: 40 },
    { header: 'Answer/Value', key: 'value', width: 70 },
  ];

  let currentRow = 1; // Keep track of the current row to add spacing

  for (const [sectionKey, sectionValue] of Object.entries(qData)) {
    // Add section header
    const sectionHeaderCell = worksheet.getCell(`A${currentRow}`);
    sectionHeaderCell.value = sectionKey.replace(/_/g, ' ').toUpperCase(); // Format section name
    sectionHeaderCell.font = { bold: true, size: 14 };
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`); // Merge cells for header
    currentRow++;

    if (typeof sectionValue === 'object' && sectionValue !== null) {
      // Add sub-headers for this section
      worksheet.getCell(`A${currentRow}`).value = 'Question/Key';
      worksheet.getCell(`B${currentRow}`).value = 'Answer/Value';
      worksheet.getRow(currentRow).font = { bold: true };
      currentRow++;

      // Add data rows for the section
      for (const [key, value] of Object.entries(sectionValue)) {
        let displayValue: string;
        if (typeof value === 'object' && value !== null) {
          displayValue = JSON.stringify(value); // Simple stringify for nested objects within sections
        } else {
          displayValue = String(value ?? ''); // Handle null/undefined
        }
        worksheet.addRow({ key: key, value: displayValue });
        worksheet.getRow(currentRow).getCell('value').alignment = {
          wrapText: true,
          vertical: 'top',
        };
        currentRow++;
      }
    } else {
      // Handle cases where sectionValue is not an object (e.g., simple key-value at top level)
      worksheet.getCell(`A${currentRow}`).value = sectionKey;
      worksheet.getCell(`B${currentRow}`).value = String(sectionValue ?? '');
      currentRow++;
    }

    // Add a blank row for spacing between sections
    currentRow++;
  }

  // Adjust row heights potentially - might need manual adjustment in Excel for best results
}

// Function to write data to an Excel file with multiple sheets
async function writeExcelFile(
  filePath: string,
  networkMapData: NetworkMapData | null | undefined,
  questionnaire1Data: Record<string, unknown> | null | undefined,
  questionnaire2Data: Record<string, unknown> | null | undefined
): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  // Add Network Map Sheet
  const networkSheet = workbook.addWorksheet('Network Map');
  addNetworkMapSheet(networkSheet, networkMapData);

  // Add Questionnaire 1 Sheet
  const q1Sheet = workbook.addWorksheet('Questionnaire 1');
  addQuestionnaireSheet(
    q1Sheet,
    questionnaire1Data as QuestionnaireData | null
  );

  // Add Questionnaire 2 Sheet
  const q2Sheet = workbook.addWorksheet('Questionnaire 2');
  addQuestionnaireSheet(
    q2Sheet,
    questionnaire2Data as QuestionnaireData | null
  );

  try {
    await workbook.xlsx.writeFile(filePath);
    console.log(`Written Excel file: ${filePath}`);
  } catch (error) {
    console.error(`Error writing Excel file ${filePath}:`, error);
  }
}

async function writeTextFile(filePath: string, content: string): Promise<void> {
  if (!content) return; // Don't write empty files
  try {
    await fs.writeFile(filePath, content);
    console.log(`Written: ${filePath}`);
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
  }
}

// --- Main Export Logic ---
async function exportUserData() {
  console.log('Starting data export...');

  let client: PoolClient | null = null;

  try {
    // Ensure base export directory exists
    await fs.mkdir(exportBaseDir, { recursive: true });

    client = await getClient(); // Get a client from the pool
    console.log('Database client acquired.');

    const users = await getAllUsers(client);
    console.log(`Found ${users.length} users to export.`);

    for (const user of users) {
      if (user.assigned_group === 'test') {
        console.log(`Skipping test user ${user.id} (test group).`);
        continue;
      }

      // 1. Fetch potential data first to decide if user should be processed
      const networkMap = await getNetworkMap(client, user.id);
      const questionnaire1Data = user.questionnaire_1;
      const questionnaire2Data = user.questionnaire_2;

      // Check if the user has submitted any relevant data
      const hasNetworkMapData =
        networkMap &&
        networkMap.map_data &&
        Object.keys(networkMap.map_data).length > 0;
      const hasQuestionnaire1Data =
        questionnaire1Data && Object.keys(questionnaire1Data).length > 0;
      const hasQuestionnaire2Data =
        questionnaire2Data && Object.keys(questionnaire2Data).length > 0;

      if (
        !hasNetworkMapData &&
        !hasQuestionnaire1Data &&
        !hasQuestionnaire2Data
      ) {
        console.log(`Skipping user ${user.id} (no relevant data found).`);
        continue; // Skip users with no relevant data
      }

      // User has relevant data, proceed with export
      const userDir = path.join(
        exportBaseDir,
        `${user.created_at.toISOString()}_${user.id}`
      );
      await fs.mkdir(userDir, { recursive: true });
      console.log(
        `\nProcessing user: ${user.id} (Group: ${user.assigned_group})`
      );

      // 2. Write Excel File (Network Map + Questionnaires) using fetched data
      await writeExcelFile(
        path.join(userDir, 'network_map_and_questionnaires.xlsx'), // Consistent naming convention
        networkMap?.map_data, // Pass the actual map_data object (already fetched)
        questionnaire1Data, // Pass the Q1 data (already fetched)
        questionnaire2Data // Pass the Q2 data (already fetched)
      );

      // 3. Chat Transcript or Audio
      if (user.assigned_group === 'chatbot') {
        const chatLogs = await getChatLogs(client, user.id);
        if (chatLogs.length > 0) {
          const transcript = chatLogs
            .map(
              (log) =>
                `[${log.timestamp.toISOString()}] ${log.role.toUpperCase()}: ${
                  log.message
                }`
            )
            .join('\n\n');
          await writeTextFile(
            path.join(userDir, 'chat_transcript.txt'),
            transcript
          );
        } else {
          console.warn(`No chat logs found for chatbot user ${user.id}`);
        }
      } else if (user.assigned_group === 'human') {
        const audioFilePath = path.join(userDir, 'interview_audio.webm');
        await downloadAudioFile(user.id, audioFilePath);
      }
    }

    console.log('\nData export finished successfully.');
  } catch (error) {
    console.error('\n--- Data export failed ---');
    console.error(error);
  } finally {
    if (client) {
      client.release(); // Release the client back to the pool
      console.log('Database client released.');
    }
    if (pool) {
      await pool.end(); // Close the pool connections
      console.log('Database connection pool closed.');
    }
    if (connector) {
      await connector.close(); // Close the connector resources
      console.log('Cloud SQL Connector closed.');
    }
  }
}

// --- Run the script ---
exportUserData();
