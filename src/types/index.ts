export type ActivityType = 'running' | 'cycling';

export interface Activity {
  id: string;
  type: ActivityType;
  start_time: number;
  end_time: number | null;
  total_distance: number; // meters
  avg_speed: number; // meters/second
  max_speed: number; // meters/second
  calories_burned: number; // kcal
  synced: number; // 0 = not synced, 1 = synced (SQLite has no boolean type)
}

export interface LocationPoint {
  id?: number;
  activity_id: string;
  latitude: number;
  longitude: number;
  timestamp: number; // ms epoch
  accuracy: number | null; // meters
}

export type TrackerStatus = 'idle' | 'tracking' | 'paused' | 'finished';

export interface Profile {
  id: 1;
  weight_kg: number;
  display_name: string | null;
  user_id: string | null;
  updated_at: number | null;
}

