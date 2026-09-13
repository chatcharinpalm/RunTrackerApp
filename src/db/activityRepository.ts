import { getDb } from './database';
import type { Activity, ActivityType, LocationPoint } from '../types';

const ACTIVE_ACTIVITY_KEY = 'active_activity_id';

export async function createActivity(
  id: string,
  type: ActivityType,
  startTime: number
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO activities (id, type, start_time) VALUES (?, ?, ?)',
    id,
    type,
    startTime
  );
  await db.runAsync(
    'INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)',
    ACTIVE_ACTIVITY_KEY,
    id
  );
}

export interface FinishActivityData {
  end_time: number;
  total_distance: number;
  avg_speed: number;
  max_speed: number;
  calories_burned: number;
}

export async function finishActivity(
  id: string,
  data: FinishActivityData
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE activities
     SET end_time = ?, total_distance = ?, avg_speed = ?, max_speed = ?, calories_burned = ?
     WHERE id = ?`,
    data.end_time,
    data.total_distance,
    data.avg_speed,
    data.max_speed,
    data.calories_burned,
    id
  );
  await db.runAsync('DELETE FROM app_state WHERE key = ?', ACTIVE_ACTIVITY_KEY);
}

export async function insertLocationPoint(point: LocationPoint): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO location_points (activity_id, latitude, longitude, timestamp, accuracy)
     VALUES (?, ?, ?, ?, ?)`,
    point.activity_id,
    point.latitude,
    point.longitude,
    point.timestamp,
    point.accuracy
  );
}

/** Lets the background task (a separate lifecycle from the tracking screen) find which activity to log to. */
export async function getActiveActivityId(): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_state WHERE key = ?',
    ACTIVE_ACTIVITY_KEY
  );
  return row?.value ?? null;
}

export async function getActivityById(id: string): Promise<Activity | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Activity>(
    'SELECT * FROM activities WHERE id = ?',
    id
  );
  return row ?? null;
}

export async function getAllActivities(): Promise<Activity[]> {
  const db = await getDb();
  return db.getAllAsync<Activity>(
    'SELECT * FROM activities ORDER BY start_time DESC'
  );
}

export async function getLocationPointsByActivity(
  activityId: string
): Promise<LocationPoint[]> {
  const db = await getDb();
  return db.getAllAsync<LocationPoint>(
    'SELECT * FROM location_points WHERE activity_id = ? ORDER BY timestamp ASC',
    activityId
  );
}

/** Finished-but-not-yet-uploaded activities, oldest first so history syncs in order. */
export async function getUnsyncedActivities(): Promise<Activity[]> {
  const db = await getDb();
  return db.getAllAsync<Activity>(
    'SELECT * FROM activities WHERE synced = 0 AND end_time IS NOT NULL ORDER BY start_time ASC'
  );
}

export async function markActivitySynced(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE activities SET synced = 1 WHERE id = ?', id);
}

export async function deleteActivity(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM location_points WHERE activity_id = ?', id);
  await db.runAsync('DELETE FROM activities WHERE id = ?', id);
}

/** All recorded points across every activity, for the route heatmap. Capped to bound memory/render cost. */
export async function getAllLocationPoints(limit = 20000): Promise<LocationPoint[]> {
  const db = await getDb();
  return db.getAllAsync<LocationPoint>(
    'SELECT * FROM location_points ORDER BY timestamp DESC LIMIT ?',
    limit
  );
}
