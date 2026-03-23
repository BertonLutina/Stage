USE eafc_platform;

-- Track last read position per user per chat (for unread filter)
CREATE TABLE IF NOT EXISTS chat_read_receipts (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  chat_type ENUM('team','match') NOT NULL,
  chat_id VARCHAR(36) NOT NULL,
  last_read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_chat (user_id, chat_type, chat_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_chat (chat_type, chat_id)
);
