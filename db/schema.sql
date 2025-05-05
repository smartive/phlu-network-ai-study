-------------------------------------------------------------------------------
-- USERS TABLE
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    assigned_group TEXT NOT NULL,
    -- e.g. 'chatbot', 'human', 'test'
    finished_interview BOOLEAN DEFAULT FALSE,
    -- Questionnaire fields:
    questionnaire_1 JSONB,
    questionnaire_2 JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-------------------------------------------------------------------------------
-- NETWORK_MAPS TABLE
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS network_maps (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    map_data JSONB NOT NULL,
    -- Entire network map as JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-------------------------------------------------------------------------------
-- CHAT_LOGS TABLE
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_logs (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role TEXT NOT NULL CHECK (role IN ('system', 'assistant', 'user')),
    message TEXT NOT NULL,
);