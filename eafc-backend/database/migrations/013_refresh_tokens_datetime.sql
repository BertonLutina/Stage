USE eafc_platform;

-- TIMESTAMP causes "Incorrect datetime value" during DST transitions (e.g. 2026-03-29 02:46).
-- DATETIME stores values as-is without timezone conversion, avoiding DST gaps.
ALTER TABLE refresh_tokens
  MODIFY expires_at DATETIME NOT NULL,
  MODIFY created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
