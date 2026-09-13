/** ms -> "HH:MM:SS" */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** meters -> "5.42" (km, 2 decimals) */
export function formatDistanceKm(meters: number): string {
  return (meters / 1000).toFixed(2);
}

/** m/s -> pace string like 4'12" (min:sec per km). Returns --'--" when stationary. */
export function formatPaceMinPerKm(speedMs: number): string {
  if (speedMs <= 0.1) return `--'--"`;
  const secondsPerKm = 1000 / speedMs;
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
}

/** m/s -> "28.4" (km/h, 1 decimal) */
export function formatSpeedKmh(speedMs: number): string {
  return (speedMs * 3.6).toFixed(1);
}
