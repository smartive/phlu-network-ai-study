export type ChatRole = 'system' | 'assistant' | 'user';

/**
 * Represents a record in the "users" table.
 */
export interface DBUser {
  id: string; // Primary key - Unique user identifier
  access_key: string; // Access key used for this user's group
  assigned_group: 'chatbot' | 'human' | 'test';
  consent: boolean; // Whether the user has given consent
  finished_interview: boolean; // Whether the user has finished the interview
  questionnaire_1?: {
    personal_info: {
      email: string;
      gender: string;
      age: number;
      study_level: string;
      study_program: string;
      teaching_experience: boolean;
      teaching_experience_years: number;
      currently_teaching: boolean;
      coop_experience: boolean;
      coop_experience_details: string | null;
    };
    personality_assessment: {
      extro1: number;
      Prase_1: number;
      extro2: number;
      selko_1: number;
      extro3: number;
      selko_2: number;
      extro4: number;
      Prase_2: number;
      extro5: number;
      selko_3: number;
      Prase_3: number;
      extro6: number;
      Prase_4: number;
    };
    future_teaching_assessment: {
      taet_01: number;
      taet_02: number;
      taet_03: number;
      taet_06: number;
      taet_09: number;
      taet_10: number;
      taet_08: number;
    };
  };
  questionnaire_2?: {
    adaption_assessment: {
      Wirk_01: number;
      Wirk_02: number;
      Wirk_03: number;
      Wirk_04: number;
      Wirk_05: number;
      Wirk_06: number;
    };
    feedback: {
      liked: string;
      disliked: string;
    };
  };
  created_at: Date;

  // Index signature to satisfy DbRecord
  [key: string]: unknown;
}

/**
 * Represents a record in the "network_maps" table.
 */
export interface DBNetworkMap {
  id: number; // Primary key (SERIAL)
  user_id: string; // References users(id)
  map_data: Record<string, unknown>; // Entire network map as JSONB
  created_at: Date; // Timestamp of record creation
  [key: string]: unknown; // Index signature to satisfy DbRecord
}

/**
 * Represents a record in the "chat_logs" table.
 */
export interface DBChatLog {
  id: number; // Primary key (SERIAL)
  user_id: string; // References users(id)
  timestamp: Date; // Message creation timestamp
  role: ChatRole; // 'system' | 'assistant' | 'user'
  message: string; // The text of the chat message
  // Index signature to satisfy DbRecord
  [key: string]: unknown;
}
