USE eafc_platform;

CREATE TABLE IF NOT EXISTS match_live_chat (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  match_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  gamer_tag VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_match_created (match_id, created_at)
);
