export const CREATE_TABLES_SQL = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  total_distance REAL NOT NULL DEFAULT 0,
  avg_speed REAL NOT NULL DEFAULT 0,
  max_speed REAL NOT NULL DEFAULT 0,
  calories_burned REAL NOT NULL DEFAULT 0,
  synced INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS location_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  timestamp INTEGER NOT NULL,
  accuracy REAL,
  FOREIGN KEY (activity_id) REFERENCES activities (id)
);

CREATE INDEX IF NOT EXISTS idx_location_points_activity
  ON location_points (activity_id);

-- Single-row-per-key store used to hand the active activity id to the
-- background location task, which runs independently of the React tree.
CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT
);

-- Single-row table (id is always 1): local device profile used for calorie
-- calculation and mirrored to the backend "profiles" table once signed in.
CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  weight_kg REAL NOT NULL DEFAULT 65,
  display_name TEXT,
  user_id TEXT,
  updated_at INTEGER
);
`;
