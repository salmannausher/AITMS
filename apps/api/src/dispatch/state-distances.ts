// Approximate road miles between state centroids. Used for deadhead estimation.
// Not exhaustive — returns null for unlisted pairs; caller treats null as "unknown".
const DISTANCES: Record<string, Record<string, number>> = {
  AL: { GA: 160, FL: 320, MS: 180, TN: 190, SC: 340 },
  AK: {},
  AZ: { CA: 370, NV: 280, NM: 325, UT: 490, CO: 590 },
  AR: { MO: 260, TN: 300, MS: 200, LA: 310, TX: 380, OK: 260 },
  CA: { AZ: 370, NV: 420, OR: 640, NM: 790 },
  CO: { NM: 350, UT: 470, WY: 300, KS: 470, NE: 480, AZ: 590 },
  CT: { NY: 110, MA: 100, RI: 65 },
  DE: { MD: 75, PA: 70, NJ: 95 },
  FL: { GA: 340, AL: 320 },
  GA: { AL: 160, FL: 340, SC: 245, TN: 280, NC: 430 },
  HI: {},
  ID: { OR: 410, WA: 300, MT: 470, WY: 600, NV: 560, UT: 380 },
  IL: { IN: 170, WI: 210, MO: 290, IA: 310, KY: 390 },
  IN: { IL: 170, OH: 170, KY: 110, MI: 280 },
  IA: { MN: 250, WI: 330, IL: 310, MO: 290, NE: 390, SD: 330 },
  KS: { MO: 260, OK: 280, CO: 470, NE: 290 },
  KY: { IN: 110, OH: 160, TN: 180, VA: 310, WV: 240, IL: 390 },
  LA: { MS: 190, TX: 510, AR: 310 },
  ME: { NH: 140, MA: 290 },
  MD: { VA: 170, DC: 40, DE: 75, PA: 100 },
  MA: { CT: 100, NY: 200, RI: 60, NH: 70, VT: 220 },
  MI: { IN: 280, OH: 210, WI: 330 },
  MN: { WI: 290, IA: 250, ND: 390, SD: 310 },
  MS: { AL: 180, LA: 190, TN: 280, AR: 200 },
  MO: { IL: 290, AR: 260, KS: 260, IA: 290, KY: 420, TN: 380 },
  MT: { ID: 470, WY: 490, ND: 560, SD: 740 },
  NE: { IA: 390, KS: 290, CO: 480, SD: 380, MO: 400 },
  NV: { CA: 420, AZ: 280, UT: 420, ID: 560 },
  NH: { ME: 140, MA: 70, VT: 120 },
  NJ: { NY: 95, PA: 85, DE: 95 },
  NM: { TX: 430, CO: 350, AZ: 325, OK: 540 },
  NY: { NJ: 95, CT: 110, PA: 170, MA: 200, VT: 300 },
  NC: { VA: 220, SC: 180, TN: 370, GA: 430 },
  ND: { MN: 390, SD: 320, MT: 560 },
  OH: { IN: 170, KY: 160, PA: 130, WV: 200, MI: 210 },
  OK: { TX: 380, KS: 280, AR: 260, MO: 430, NM: 540 },
  OR: { WA: 200, CA: 640, ID: 410, NV: 600 },
  PA: { OH: 130, NY: 170, NJ: 85, MD: 100, WV: 200, DE: 70 },
  RI: { MA: 60, CT: 65 },
  SC: { GA: 245, NC: 180 },
  SD: { ND: 320, MN: 310, NE: 380, IA: 330, WY: 540, MT: 740 },
  TN: { KY: 180, AL: 190, GA: 280, NC: 370, VA: 420, AR: 300, MS: 280, MO: 380 },
  TX: { OK: 380, AR: 380, LA: 510, NM: 430 },
  UT: { NV: 420, AZ: 490, CO: 470, ID: 380, WY: 430 },
  VT: { NY: 300, NH: 120, MA: 220 },
  VA: { NC: 220, MD: 170, WV: 200, KY: 310, TN: 420, DC: 120 },
  WA: { OR: 200, ID: 300 },
  WV: { VA: 200, KY: 240, OH: 200, PA: 200 },
  WI: { MN: 290, IL: 210, MI: 330, IA: 330 },
  WY: { CO: 300, UT: 430, ID: 600, MT: 490, SD: 540, NE: 500 },
  DC: { MD: 40, VA: 120 },
};

/**
 * Returns approximate road miles between two state centroids.
 * Symmetric — checks both directions. Returns null if unknown.
 */
export function getDeadheadMiles(fromState: string, toState: string): number | null {
  if (fromState === toState) return 0;
  const a = fromState.toUpperCase();
  const b = toState.toUpperCase();
  return DISTANCES[a]?.[b] ?? DISTANCES[b]?.[a] ?? null;
}
