USE eafc_platform;

-- Add Twitch, Discord, Kick OAuth columns
ALTER TABLE users ADD COLUMN twitch_id VARCHAR(255) NULL AFTER apple_id;

ALTER TABLE users ADD COLUMN position VARCHAR(255) NULL AFTER discord_id;


ALTER TABLE users ADD COLUMN discord_id VARCHAR(255) NULL AFTER twitch_id;
ALTER TABLE users ADD COLUMN kick_id VARCHAR(255) NULL AFTER discord_id;

-- Extend auth_provider enum (MySQL requires full ALTER for enum changes)
ALTER TABLE users MODIFY COLUMN auth_provider VARCHAR(20) DEFAULT 'local';
