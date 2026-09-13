// Reject GPS deltas smaller than this as sensor jitter rather than real movement.
export const GPS_NOISE_THRESHOLD_M = 2;

/** Great-circle distance between two WGS84 coordinates, in meters. */
export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth mean radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Fixed-size rolling average, used to smooth instantaneous GPS speed readings. */
export class MovingAverage {
  private samples: number[] = [];

  constructor(private readonly windowSize: number) {}

  add(value: number): number {
    this.samples.push(value);
    if (this.samples.length > this.windowSize) {
      this.samples.shift();
    }
    return this.average();
  }

  average(): number {
    if (this.samples.length === 0) return 0;
    return this.samples.reduce((sum, v) => sum + v, 0) / this.samples.length;
  }

  reset(): void {
    this.samples = [];
  }
}
