import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { GPS_NOISE_THRESHOLD_M, MovingAverage, haversineMeters } from '../utils/geo';
import { generateId } from '../utils/id';
import { caloriesForSlice, getMetValue } from '../constants/met';
import { getProfile } from '../db/profileRepository';
import {
  createActivity,
  finishActivity,
  insertLocationPoint,
} from '../db/activityRepository';
import {
  startBackgroundLocationUpdates,
  stopBackgroundLocationUpdates,
} from '../services/backgroundLocationTask';
import { ensureLocationPermissions } from '../services/locationPermissions';
import type { ActivityType, TrackerStatus } from '../types';

const SPEED_SMOOTHING_WINDOW = 5; // samples averaged to damp GPS jitter
const TIMER_TICK_MS = 500;

interface TrackerState {
  status: TrackerStatus;
  distanceMeters: number;
  currentSpeedMs: number;
  maxSpeedMs: number;
  elapsedMs: number;
  caloriesKcal: number;
  accuracyMeters: number | null;
  permissionDenied: boolean;
}

const initialState: TrackerState = {
  status: 'idle',
  distanceMeters: 0,
  currentSpeedMs: 0,
  maxSpeedMs: 0,
  elapsedMs: 0,
  caloriesKcal: 0,
  accuracyMeters: null,
  permissionDenied: false,
};

export function useActivityTracker(activityType: ActivityType) {
  const [state, setState] = useState<TrackerState>(initialState);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const lastPointRef = useRef<{ lat: number; lon: number; t: number } | null>(null);
  const speedAverageRef = useRef(new MovingAverage(SPEED_SMOOTHING_WINDOW));
  const distanceRef = useRef(0);
  const maxSpeedRef = useRef(0);
  const caloriesRef = useRef(0);
  const weightKgRef = useRef(65);
  const activityTypeRef = useRef<ActivityType>(activityType);
  const activityIdRef = useRef<string | null>(null);
  const startedAtRef = useRef(0);
  const pausedAccumRef = useRef(0);
  const pausedAtRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const tickElapsed = useCallback(() => {
    const elapsed = Date.now() - startedAtRef.current - pausedAccumRef.current;
    setState((s) => ({ ...s, elapsedMs: Math.max(0, elapsed) }));
  }, []);

  const handleLocationUpdate = useCallback((location: Location.LocationObject) => {
    const { latitude, longitude, accuracy } = location.coords;
    const timestamp = location.timestamp;

    setState((s) => ({ ...s, accuracyMeters: accuracy ?? s.accuracyMeters }));

    if (activityIdRef.current) {
      insertLocationPoint({
        activity_id: activityIdRef.current,
        latitude,
        longitude,
        timestamp,
        accuracy: accuracy ?? null,
      }).catch((e) => console.warn('[useActivityTracker] insertLocationPoint failed', e));
    }

    const last = lastPointRef.current;
    if (last) {
      const deltaMeters = haversineMeters(last.lat, last.lon, latitude, longitude);

      // Only count movement clearly above GPS noise; ignore the sample otherwise
      // (still recorded to SQLite above for later route review).
      if (deltaMeters > GPS_NOISE_THRESHOLD_M) {
        const deltaSeconds = Math.max((timestamp - last.t) / 1000, 0.001);
        const instantaneousSpeed = deltaMeters / deltaSeconds;
        const smoothedSpeed = speedAverageRef.current.add(instantaneousSpeed);

        distanceRef.current += deltaMeters;
        maxSpeedRef.current = Math.max(maxSpeedRef.current, smoothedSpeed);

        // MET varies with pace, so calories accrue per-slice rather than from one avg-speed lookup.
        const speedKmh = smoothedSpeed * 3.6;
        const met = getMetValue(activityTypeRef.current, speedKmh);
        caloriesRef.current += caloriesForSlice(met, weightKgRef.current, deltaSeconds / 3600);

        setState((s) => ({
          ...s,
          distanceMeters: distanceRef.current,
          currentSpeedMs: smoothedSpeed,
          maxSpeedMs: maxSpeedRef.current,
          caloriesKcal: caloriesRef.current,
        }));

        lastPointRef.current = { lat: latitude, lon: longitude, t: timestamp };
      }
    } else {
      lastPointRef.current = { lat: latitude, lon: longitude, t: timestamp };
    }
  }, []);

  const startWatching = useCallback(async () => {
    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      handleLocationUpdate
    );

    // Best-effort: keeps logging while backgrounded on a development/production build.
    // Not available in Expo Go, so a failure here must not block foreground tracking.
    try {
      await startBackgroundLocationUpdates();
    } catch (e) {
      console.warn('[useActivityTracker] background updates unavailable:', e);
    }
  }, [handleLocationUpdate]);

  const stopWatching = useCallback(async () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    await stopBackgroundLocationUpdates().catch(() => {});
  }, []);

  const start = useCallback(async () => {
    const permission = await ensureLocationPermissions();
    if (!permission.granted) {
      setState((s) => ({ ...s, permissionDenied: true }));
      return;
    }

    const profile = await getProfile();
    weightKgRef.current = profile.weight_kg;
    activityTypeRef.current = activityType;

    const id = generateId();
    const now = Date.now();

    activityIdRef.current = id;
    distanceRef.current = 0;
    maxSpeedRef.current = 0;
    caloriesRef.current = 0;
    lastPointRef.current = null;
    speedAverageRef.current.reset();
    startedAtRef.current = now;
    pausedAccumRef.current = 0;
    pausedAtRef.current = null;

    await createActivity(id, activityType, now);

    setState({ ...initialState, status: 'tracking' });

    timerRef.current = setInterval(tickElapsed, TIMER_TICK_MS);
    await startWatching();
  }, [activityType, startWatching, tickElapsed]);

  const pause = useCallback(async () => {
    await stopWatching();
    clearTimer();
    pausedAtRef.current = Date.now();
    setState((s) => ({ ...s, status: 'paused' }));
  }, [stopWatching]);

  const resume = useCallback(async () => {
    if (pausedAtRef.current !== null) {
      pausedAccumRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }
    setState((s) => ({ ...s, status: 'tracking' }));
    timerRef.current = setInterval(tickElapsed, TIMER_TICK_MS);
    await startWatching();
  }, [startWatching, tickElapsed]);

  const finish = useCallback(async () => {
    await stopWatching();
    clearTimer();

    const id = activityIdRef.current;
    if (!id) return;

    const endTime = Date.now();
    const movingSeconds = Math.max(
      (endTime - startedAtRef.current - pausedAccumRef.current) / 1000,
      0.001
    );
    const avgSpeed = distanceRef.current / movingSeconds;

    await finishActivity(id, {
      end_time: endTime,
      total_distance: distanceRef.current,
      avg_speed: avgSpeed,
      max_speed: maxSpeedRef.current,
      calories_burned: caloriesRef.current,
    });

    activityIdRef.current = null;
    setState((s) => ({ ...s, status: 'finished' }));
  }, [stopWatching]);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      subscriptionRef.current?.remove();
    };
  }, []);

  return { ...state, start, pause, resume, finish, reset };
}
