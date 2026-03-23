USE eafc_platform;

-- Add media support to team_chat_messages (run once; skip if columns exist)
ALTER TABLE team_chat_messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'text' AFTER content;
ALTER TABLE team_chat_messages ADD COLUMN media_url VARCHAR(1000) NULL AFTER message_type;
ALTER TABLE team_chat_messages ADD COLUMN media_metadata JSON NULL AFTER media_url;

-- Add media support to match_live_chat
ALTER TABLE match_live_chat ADD COLUMN message_type VARCHAR(20) DEFAULT 'text' AFTER content;
ALTER TABLE match_live_chat ADD COLUMN media_url VARCHAR(1000) NULL AFTER message_type;
ALTER TABLE match_live_chat ADD COLUMN media_metadata JSON NULL AFTER media_url;

-- Add media support to direct_messages
ALTER TABLE direct_messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'text' AFTER content;
ALTER TABLE direct_messages ADD COLUMN media_url VARCHAR(1000) NULL AFTER message_type;
ALTER TABLE direct_messages ADD COLUMN media_metadata JSON NULL AFTER media_url;
