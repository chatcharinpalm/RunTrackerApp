import {
  getLocationPointsByActivity,
  getUnsyncedActivities,
  markActivitySynced,
} from '../db/activityRepository';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import type { Activity, LocationPoint } from '../types';

const POINTS_UPLOAD_CHUNK_SIZE = 500;

export type SyncStatus =
  | { state: 'skipped'; reason: 'offline' | 'not-configured' | 'signed-out' }
  | { state: 'idle'; uploaded: number }
  | { state: 'error'; message: string };

function toRemoteActivity(activity: Activity, userId: string) {
  return {
    id: activity.id,
    user_id: userId,
    type: activity.type,
    start_time: activity.start_time,
    end_time: activity.end_time,
    total_distance: activity.total_distance,
    avg_speed: activity.avg_speed,
    max_speed: activity.max_speed,
    calories_burned: activity.calories_burned,
  };
}

function toRemotePoint(point: LocationPoint, userId: string) {
  return {
    activity_id: point.activity_id,
    user_id: userId,
    latitude: point.latitude,
    longitude: point.longitude,
    timestamp: point.timestamp,
    accuracy: point.accuracy,
  };
}

async function uploadActivity(activity: Activity, userId: string): Promise<void> {
  const { error: activityError } = await supabase
    .from('activities')
    .upsert(toRemoteActivity(activity, userId));
  if (activityError) throw activityError;

  const points = await getLocationPointsByActivity(activity.id);
  for (let i = 0; i < points.length; i += POINTS_UPLOAD_CHUNK_SIZE) {
    const chunk = points.slice(i, i + POINTS_UPLOAD_CHUNK_SIZE).map((p) => toRemotePoint(p, userId));
    const { error: pointsError } = await supabase.from('location_points').upsert(chunk);
    if (pointsError) throw pointsError;
  }

  await markActivitySynced(activity.id);
}

/** Pushes every finished, unsynced activity (and its points) to Supabase. Safe to call repeatedly. */
export async function syncPendingActivities(userId: string | null, isOnline: boolean): Promise<SyncStatus> {
  if (!isSupabaseConfigured) return { state: 'skipped', reason: 'not-configured' };
  if (!isOnline) return { state: 'skipped', reason: 'offline' };
  if (!userId) return { state: 'skipped', reason: 'signed-out' };

  try {
    const pending = await getUnsyncedActivities();
    for (const activity of pending) {
      await uploadActivity(activity, userId);
    }
    return { state: 'idle', uploaded: pending.length };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Sync failed for an unknown reason';
    return { state: 'error', message };
  }
}
