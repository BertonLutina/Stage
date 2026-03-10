USE eafc_platform;

CREATE TABLE IF NOT EXISTS tournaments (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  owner_id VARCHAR(36) NOT NULL,
  format ENUM('group_knockout','single_elim','double_elim','league_playoffs','classic_league') NOT NULL,
  max_teams INT NOT NULL,
  status ENUM('draft','active','completed') DEFAULT 'draft',
  current_round INT DEFAULT 0,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS tournament_teams (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tournament_id VARCHAR(36) NOT NULL,
  team_id VARCHAR(36) NOT NULL,
  seed INT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tourn_team (tournament_id, team_id),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS groups (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tournament_id VARCHAR(36) NOT NULL,
  name VARCHAR(50) NOT NULL COMMENT 'Group A, Group B...',
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS group_teams (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  group_id VARCHAR(36) NOT NULL,
  team_id VARCHAR(36) NOT NULL,
  played INT DEFAULT 0,
  wins INT DEFAULT 0,
  draws INT DEFAULT 0,
  losses INT DEFAULT 0,
  points INT DEFAULT 0,
  goals_for INT DEFAULT 0,
  goals_against INT DEFAULT 0,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bracket_rounds (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tournament_id VARCHAR(36) NOT NULL,
  round_name VARCHAR(100) NOT NULL COMMENT 'Quarterfinals, Semifinals, Final...',
  round_number INT NOT NULL,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matches (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tournament_id VARCHAR(36) NOT NULL,
  round_id VARCHAR(36) NULL,
  group_id VARCHAR(36) NULL,
  home_team_id VARCHAR(36) NOT NULL,
  away_team_id VARCHAR(36) NOT NULL,
  home_score INT NULL,
  away_score INT NULL,
  leg TINYINT DEFAULT 1 COMMENT '1 or 2 for home+away',
  status ENUM('scheduled','completed') DEFAULT 'scheduled',
  played_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (round_id) REFERENCES bracket_rounds(id) ON DELETE SET NULL,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL,
  FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS match_videos (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  match_id VARCHAR(36) NOT NULL,
  uploaded_by VARCHAR(36) NOT NULL,
  video_url VARCHAR(1000) NOT NULL,
  video_source ENUM('youtube','twitch','tiktok','kick','other') DEFAULT 'youtube',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS league_standings (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tournament_id VARCHAR(36) NOT NULL,
  team_id VARCHAR(36) NOT NULL,
  played INT DEFAULT 0,
  wins INT DEFAULT 0,
  draws INT DEFAULT 0,
  losses INT DEFAULT 0,
  points INT DEFAULT 0,
  goals_for INT DEFAULT 0,
  goals_against INT DEFAULT 0,
  position INT NULL,
  UNIQUE KEY uq_league_team (tournament_id, team_id),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS de_brackets (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tournament_id VARCHAR(36) NOT NULL,
  team_id VARCHAR(36) NOT NULL,
  bracket ENUM('winners','losers') DEFAULT 'winners',
  losses_count TINYINT DEFAULT 0,
  eliminated TINYINT(1) DEFAULT 0,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);
