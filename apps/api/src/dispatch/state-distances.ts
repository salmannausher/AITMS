// State centroid coordinates (lat, lng) for all 50 US states + DC.
// Used to estimate deadhead miles between any two states via Haversine × road factor.
const STATE_CENTROIDS: Record<string, [number, number]> = {
  AL: [32.7794, -86.8287],
  AK: [64.4459, -153.3694],
  AZ: [34.2744, -111.6602],
  AR: [34.8938, -92.4426],
  CA: [37.1841, -119.4696],
  CO: [38.9972, -105.5478],
  CT: [41.6219, -72.7273],
  DE: [38.9896, -75.5050],
  DC: [38.9101, -77.0147],
  FL: [28.6305, -82.4497],
  GA: [32.6415, -83.4426],
  HI: [20.2927, -156.3737],
  ID: [44.3509, -114.6130],
  IL: [40.0417, -89.1965],
  IN: [39.8942, -86.2816],
  IA: [42.0751, -93.4960],
  KS: [38.4937, -98.3804],
  KY: [37.5347, -85.3021],
  LA: [31.0689, -91.9968],
  ME: [45.3695, -69.2428],
  MD: [39.0550, -76.7909],
  MA: [42.2596, -71.8083],
  MI: [44.3467, -85.4102],
  MN: [46.2807, -94.3053],
  MS: [32.7364, -89.6678],
  MO: [38.3566, -92.4580],
  MT: [46.8797, -110.3626],
  NE: [41.5378, -99.7951],
  NV: [39.3289, -116.6312],
  NH: [43.6805, -71.5811],
  NJ: [40.1907, -74.6728],
  NM: [34.4071, -106.1126],
  NY: [42.9538, -75.5268],
  NC: [35.5557, -79.3877],
  ND: [47.4501, -100.4659],
  OH: [40.2862, -82.7937],
  OK: [35.5889, -97.4943],
  OR: [43.9336, -120.5583],
  PA: [40.8781, -77.7996],
  RI: [41.6762, -71.5562],
  SC: [33.9169, -80.8964],
  SD: [44.4443, -100.2263],
  TN: [35.8580, -86.3505],
  TX: [31.4757, -99.3312],
  UT: [39.3210, -111.0937],
  VT: [44.0687, -72.6658],
  VA: [37.5215, -78.8537],
  WA: [47.3826, -120.4472],
  WV: [38.6409, -80.6227],
  WI: [44.6243, -89.9941],
  WY: [42.9957, -107.5512],
};

// Road distance ≈ straight-line × 1.3 (accounts for road routing vs crow-flies).
const ROAD_FACTOR = 1.3;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const KM_TO_MILES = 0.621371;

/**
 * Returns estimated road miles between two state centroids.
 * Works for any US state pair — never returns null.
 * Returns 0 for same-state. Returns null only for unknown state codes.
 */
export function getDeadheadMiles(fromState: string, toState: string): number | null {
  const a = fromState.toUpperCase();
  const b = toState.toUpperCase();

  if (a === b) return 0;

  const c1 = STATE_CENTROIDS[a];
  const c2 = STATE_CENTROIDS[b];

  if (!c1 || !c2) return null;

  const straightLineMiles = haversineKm(c1[0], c1[1], c2[0], c2[1]) * KM_TO_MILES;
  return Math.round(straightLineMiles * ROAD_FACTOR);
}
