import * as Location from 'expo-location';

export interface PermissionResult {
  granted: boolean; // foreground granted (required to track at all)
  backgroundGranted: boolean; // background granted (required to keep tracking while app is minimized/locked)
}

/** Foreground permission must be requested (and granted) before background permission. */
export async function ensureLocationPermissions(): Promise<PermissionResult> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') {
    return { granted: false, backgroundGranted: false };
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  return { granted: true, backgroundGranted: background.status === 'granted' };
}
