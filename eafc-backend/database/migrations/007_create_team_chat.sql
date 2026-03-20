USE eafc_platform;

CREATE TABLE IF NOT EXISTS team_chat_messages (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  team_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  gamer_tag VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_team_created (team_id, created_at)
);
