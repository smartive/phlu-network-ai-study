import { Connector, IpAddressTypes } from '@google-cloud/cloud-sql-connector';
import { GoogleAuth } from 'google-auth-library';
import { Pool, PoolClient } from 'pg';

const auth = new GoogleAuth({
  credentials: JSON.parse(process.env.GCP_CREDENTIALS || '{}'),
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});
const authClient = await auth.getClient();

const connector = new Connector({
  auth: authClient,
});

let pool: Pool;

async function initializePool() {
  if (pool) return;

  const clientOpts = await connector.getOptions({
    instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME!,
    ipType: IpAddressTypes.PUBLIC,
  });

  pool = new Pool({
    ...clientOpts,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    max: 20,
    idleTimeoutMillis: 30000,
  });
}

// Helper to get a client from the pool with error handling
async function getClient(): Promise<PoolClient> {
  await initializePool();
  const client = await pool.connect();
  return client;
}

// Generic query executor with error handling
async function executeQuery<T>(
  query: string,
  params?: unknown[]
): Promise<T[]> {
  const client = await getClient();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Generic single record query executor
async function executeQuerySingle<T>(
  query: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await executeQuery<T>(query, params);
  return rows.length > 0 ? rows[0] : null;
}

// Type for database record
export type DbRecord = {
  id?: string | number;
  created_at?: Date;
  updated_at?: Date;
  [key: string]: unknown;
};

// CRUD Operations

// Create
export async function insert<T extends DbRecord>(
  table: string,
  data: Omit<T, 'created_at' | 'updated_at'>
): Promise<T> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
  const columns = keys.join(', ');

  const query = `
    INSERT INTO ${table} (${columns})
    VALUES (${placeholders})
    RETURNING *
  `;

  const result = await executeQuerySingle<T>(query, values);
  if (!result) {
    throw new Error('Insert failed');
  }
  return result;
}

export async function insertMany<T extends DbRecord>(
  table: string,
  data: Omit<T, 'created_at' | 'updated_at'>[]
): Promise<T[]> {
  if (!data || data.length === 0) {
    return [];
  }

  // Convert array of objects into array of array-of-values
  const values = data.map((item) => Object.values(item));

  // Generate placeholder patterns for each row (e.g. "($1, $2, $3), ($4, $5, $6)")
  // We multiply the row index (i) by the number of columns to track parameter numbering
  const placeholders = values
    .map(
      (rowVals, i) =>
        `(${rowVals
          .map((_, j) => `$${i * rowVals.length + j + 1}`)
          .join(', ')})`
    )
    .join(', ');

  // Flatten the array of arrays into a single array for Postgres parameters
  const flattenedValues = values.flat();

  // Build the column list from the first object's keys
  const columns = Object.keys(data[0]).join(', ');

  const query = `
    INSERT INTO ${table} (${columns})
    VALUES ${placeholders}
    RETURNING *
  `;

  const result = await executeQuery<T>(query, flattenedValues);
  return result;
}

// Read
export async function findById<T extends DbRecord>(
  table: string,
  id: string | number
): Promise<T | null> {
  return executeQuerySingle<T>(`SELECT * FROM ${table} WHERE id = $1`, [id]);
}

export async function findOneByUserId<T extends DbRecord>(
  table: string,
  userId: string,
  conditions: Partial<T> = {},
  orderBy?: string
): Promise<T | null> {
  const keys = Object.keys(conditions);
  const values = Object.values(conditions);
  const whereClause = keys
    .map((key, index) => `${key} = $${index + 2}`)
    .join(' AND ');

  return executeQuerySingle<T>(
    `SELECT * FROM ${table} WHERE user_id = $1 ${
      whereClause ? `AND ${whereClause}` : ''
    } ${orderBy ? `ORDER BY ${orderBy}` : ''}`,
    [userId, ...values]
  );
}

export async function findMany<T extends DbRecord>(
  table: string,
  conditions?: Partial<T>,
  orderBy?: string
): Promise<T[]> {
  if (!conditions || Object.keys(conditions).length === 0) {
    return executeQuery<T>(`SELECT * FROM ${table}`);
  }

  const keys = Object.keys(conditions);
  const values = Object.values(conditions);
  const whereClause = keys
    .map((key, index) => `${key} = $${index + 1}`)
    .join(' AND ');

  return executeQuery<T>(
    `SELECT * FROM ${table} WHERE ${whereClause} ${
      orderBy ? `ORDER BY ${orderBy}` : ''
    }`,
    values
  );
}

// Update
export async function update<T extends DbRecord>(
  table: string,
  id: string | number,
  data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>
): Promise<T | null> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys
    .map((key, index) => `${key} = $${index + 1}`)
    .join(', ');

  const query = `
    UPDATE ${table}
    SET ${setClause}
    WHERE id = $${keys.length + 1}
    RETURNING *
  `;

  return executeQuerySingle<T>(query, [...values, id]);
}

// Delete
export async function remove(
  table: string,
  id: string | number
): Promise<boolean> {
  const result = await executeQuery(
    `DELETE FROM ${table} WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.length > 0;
}

// Transaction helper
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Health check
export async function checkConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT NOW()');
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

// Cleanup function
export async function cleanup(): Promise<void> {
  if (pool) {
    await pool.end();
  }
  await connector.close();
}

// Register cleanup handlers
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    void cleanup();
  });

  // Handle other termination signals
  ['SIGINT', 'SIGTERM', 'SIGUSR2'].forEach((signal) => {
    process.once(signal, () => {
      void cleanup().then(() => process.exit());
    });
  });
}
