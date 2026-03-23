USE eafc_platform;

-- Add start/end dates to tournaments (UTC)
ALTER TABLE tournaments ADD COLUMN start_date DATE NULL AFTER description;
ALTER TABLE tournaments ADD COLUMN end_date DATE NULL AFTER start_date;

-- Add 'full' status when team slots are filled
ALTER TABLE tournaments MODIFY COLUMN status ENUM('draft','full','active','completed') DEFAULT 'draft';

-- Time slots table (times in UTC, e.g. 10:00 = 10:00 UTC)
CREATE TABLE IF NOT EXISTS time_slots (
  id VARCHAR(36) PRIMARY KEY,
  start_time TIME NOT NULL,
  label VARCHAR(50) NULL,
  sort_order INT DEFAULT 0,
  UNIQUE KEY uq_start_time (start_time)
);

-- Insert default time slots (10:00, 12:00, 14:00, 16:00, 18:00, 20:00 UTC) - fixed IDs for stability
INSERT IGNORE INTO time_slots (id, start_time, label, sort_order) VALUES
  ('slot-1000', '10:00:00', '10:00', 1),
  ('slot-1200', '12:00:00', '12:00', 2),
  ('slot-1400', '14:00:00', '14:00', 3),
  ('slot-1600', '16:00:00', '16:00', 4),
  ('slot-1800', '18:00:00', '18:00', 5),
  ('slot-2000', '20:00:00', '20:00', 6);

-- Add scheduling columns to matches (scheduled_at = UTC datetime)
ALTER TABLE matches ADD COLUMN scheduled_at DATETIME NULL COMMENT 'UTC' AFTER played_at;
ALTER TABLE matches ADD COLUMN time_slot_id VARCHAR(36) NULL AFTER scheduled_at;
ALTER TABLE matches ADD CONSTRAINT fk_match_time_slot FOREIGN KEY (time_slot_id) REFERENCES time_slots(id) ON DELETE SET NULL;
