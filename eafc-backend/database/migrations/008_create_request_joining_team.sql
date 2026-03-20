USE eafc_platform;

CREATE TABLE IF NOT EXISTS request_joining_team (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  team_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  status ENUM('pending','accepted','declined') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_team_status (team_id, status),
  INDEX idx_user_status (user_id, status)
);
