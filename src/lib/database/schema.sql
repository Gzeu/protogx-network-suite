-- 🗄️ PROTOGX NETWORK - Supabase Database Schema
-- Optimized for free tier with efficient indexing and minimal storage

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =============================================================================
-- 👤 Users & Authentication
-- =============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(255) UNIQUE,
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  experience_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  total_games_played INTEGER DEFAULT 0,
  total_games_won INTEGER DEFAULT 0,
  preferred_ai_provider VARCHAR(20) DEFAULT 'auto',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_level ON users(level DESC);
CREATE INDEX idx_users_xp ON users(experience_points DESC);

-- =============================================================================
-- 🎮 Games & Game Sessions
-- =============================================================================

CREATE TYPE game_type AS ENUM (
  'quantum_dao',
  'crypto_arbitrage', 
  'syndicate_wars',
  'cyber_headhunters',
  'insider_challenge',
  'regulatory_chess',
  'nft_tycoon',
  'social_broker',
  'escape_room',
  'proprietary_league'
);

CREATE TYPE game_status AS ENUM ('waiting', 'active', 'finished', 'cancelled');

CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type game_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  max_players INTEGER DEFAULT 10,
  min_players INTEGER DEFAULT 1,
  entry_fee DECIMAL(10,4) DEFAULT 0,
  prize_pool DECIMAL(10,4) DEFAULT 0,
  duration_minutes INTEGER DEFAULT 30,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  ai_enabled BOOLEAN DEFAULT true,
  nft_reward_enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status game_status DEFAULT 'waiting',
  current_players INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  winner_id UUID REFERENCES users(id),
  game_data JSONB DEFAULT '{}',
  ai_interactions_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game performance indexes
CREATE INDEX idx_games_type ON games(type);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_game_sessions_creator ON game_sessions(creator_id);
CREATE INDEX idx_game_sessions_started ON game_sessions(started_at DESC);

-- =============================================================================
-- 🏆 Player Participation & Results
-- =============================================================================

CREATE TYPE participation_status AS ENUM ('joined', 'playing', 'finished', 'abandoned');

CREATE TABLE game_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status participation_status DEFAULT 'joined',
  score INTEGER DEFAULT 0,
  rank INTEGER,
  moves_count INTEGER DEFAULT 0,
  ai_hints_used INTEGER DEFAULT 0,
  time_played_seconds INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  performance_data JSONB DEFAULT '{}',
  
  UNIQUE(session_id, user_id)
);

CREATE INDEX idx_participants_session ON game_participants(session_id);
CREATE INDEX idx_participants_user ON game_participants(user_id);
CREATE INDEX idx_participants_score ON game_participants(score DESC);

-- =============================================================================
-- 🤖 AI Interactions & Analytics
-- =============================================================================

CREATE TYPE ai_provider AS ENUM ('openai', 'anthropic', 'google', 'ibm', 'ollama');

CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  provider ai_provider NOT NULL,
  model VARCHAR(100),
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(8,6) DEFAULT 0,
  response_time_ms INTEGER,
  cached BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Monthly partition key for cost management
  month_year VARCHAR(7) GENERATED ALWAYS AS (to_char(created_at, 'YYYY-MM')) STORED
);

-- AI usage tracking indexes
CREATE INDEX idx_ai_interactions_user ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_month ON ai_interactions(month_year);
CREATE INDEX idx_ai_interactions_provider ON ai_interactions(provider);
CREATE INDEX idx_ai_interactions_cost ON ai_interactions(cost_usd DESC);

-- =============================================================================
-- 🏅 NFT Rewards & Achievements
-- =============================================================================

CREATE TYPE nft_status AS ENUM ('pending', 'minted', 'failed', 'transferred');

CREATE TABLE nft_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES game_sessions(id),
  game_type game_type NOT NULL,
  nft_name VARCHAR(200) NOT NULL,
  nft_description TEXT,
  rarity VARCHAR(50) DEFAULT 'common',
  metadata_uri TEXT,
  ipfs_hash TEXT,
  contract_address TEXT,
  token_id BIGINT,
  status nft_status DEFAULT 'pending',
  minting_tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  minted_at TIMESTAMPTZ
);

CREATE INDEX idx_nft_rewards_user ON nft_rewards(user_id);
CREATE INDEX idx_nft_rewards_status ON nft_rewards(status);
CREATE INDEX idx_nft_rewards_game_type ON nft_rewards(game_type);

-- =============================================================================
-- 📊 Leaderboards & Statistics
-- =============================================================================

CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_type game_type,
  period VARCHAR(20) DEFAULT 'all_time', -- daily, weekly, monthly, all_time
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  games_played INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  avg_score DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(game_type, period, user_id)
);

CREATE INDEX idx_leaderboards_game_period ON leaderboards(game_type, period);
CREATE INDEX idx_leaderboards_rank ON leaderboards(rank);

-- =============================================================================
-- 💰 Usage & Billing Tracking (Free Tier Management)
-- =============================================================================

CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month_year VARCHAR(7) NOT NULL,
  ai_requests INTEGER DEFAULT 0,
  ai_cost_usd DECIMAL(8,4) DEFAULT 0,
  storage_mb INTEGER DEFAULT 0,
  bandwidth_mb INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  nfts_minted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, month_year)
);

CREATE INDEX idx_usage_tracking_month ON usage_tracking(month_year);
CREATE INDEX idx_usage_tracking_user_month ON usage_tracking(user_id, month_year);

-- =============================================================================
-- 🔧 System Configuration & Health
-- =============================================================================

CREATE TABLE system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default configurations
INSERT INTO system_config (key, value, description) VALUES
('free_tier_limits', '{
  "ai_requests_per_month": 1000,
  "storage_mb": 1024,
  "bandwidth_gb": 100,
  "max_games_per_day": 50,
  "max_nfts_per_month": 10
}', 'Free tier usage limits'),
('ai_providers', '{
  "enabled": ["openai", "anthropic", "ollama"],
  "fallback_order": ["ollama", "openai", "anthropic"],
  "rate_limits": {
    "openai": 50,
    "anthropic": 30,
    "ollama": 1000
  }
}', 'AI provider configuration'),
('game_settings', '{
  "default_duration": 30,
  "max_players_per_game": 10,
  "auto_start_delay_seconds": 60,
  "ai_hint_cooldown_seconds": 30
}', 'Default game settings');

-- =============================================================================
-- 🔄 Auto-update triggers
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply auto-update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON usage_tracking 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 📈 Analytics Views for Performance
-- =============================================================================

-- Top players view
CREATE VIEW top_players AS
SELECT 
  u.id,
  u.username,
  u.display_name,
  u.experience_points,
  u.level,
  u.total_games_played,
  u.total_games_won,
  CASE 
    WHEN u.total_games_played > 0 THEN 
      ROUND((u.total_games_won::decimal / u.total_games_played * 100), 2)
    ELSE 0
  END as win_rate
FROM users u
WHERE u.total_games_played > 0
ORDER BY u.experience_points DESC;

-- Game statistics view
CREATE VIEW game_stats AS
SELECT 
  g.type,
  g.title,
  COUNT(gs.id) as total_sessions,
  COUNT(CASE WHEN gs.status = 'finished' THEN 1 END) as completed_sessions,
  AVG(gs.current_players) as avg_players,
  AVG(EXTRACT(EPOCH FROM (gs.ended_at - gs.started_at))/60) as avg_duration_minutes
FROM games g
LEFT JOIN game_sessions gs ON g.id = gs.game_id
GROUP BY g.type, g.title;

-- =============================================================================
-- 🚀 Performance Optimizations
-- =============================================================================

-- Vacuum and analyze for initial optimization
VACUUM ANALYZE;

-- Set up automatic statistics collection
ALTER SYSTEM SET track_activities = on;
ALTER SYSTEM SET track_counts = on;
ALTER SYSTEM SET track_io_timing = on;

COMMENT ON DATABASE postgres IS 'PROTOGX NETWORK - Ultra-modern gaming suite database optimized for free tier usage';