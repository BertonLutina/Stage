ALTER TABLE users
ADD COLUMN signin_preference ENUM('face_id', 'touch_id', 'biometric', 'normal') NOT NULL DEFAULT 'normal'
AFTER bio;
