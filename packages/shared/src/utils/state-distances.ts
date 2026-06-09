// All keys are stored alphabetically (e.g. IL-TX not TX-IL) so the sort() lookup works correctly.
const DISTANCES: Record<string, number> = {
  'AZ-CA': 590,
  'CA-IL': 2020, 'CA-NV': 420,  'CA-NY': 2820, 'CA-OR': 680,  'CA-TX': 1440,
  'CA-WA': 1030, 'CA-FL': 2750,
  'FL-GA': 450,  'FL-IL': 1180, 'FL-NC': 760,  'FL-NY': 1285, 'FL-OH': 1060,
  'FL-PA': 1100, 'FL-TN': 720,  'FL-TX': 1230,
  'GA-IL': 780,  'GA-NC': 430,  'GA-NY': 1000, 'GA-OH': 720,  'GA-PA': 920,
  'GA-TN': 280,  'GA-TX': 1100,
  'IL-MO': 300,  'IL-NY': 790,  'IL-OH': 350,  'IL-PA': 740,  'IL-TN': 480,
  'IL-TX': 920,
  'NC-NY': 580,  'NC-OH': 620,  'NC-PA': 620,  'NC-TX': 1400,
  'NY-OH': 460,  'NY-PA': 200,
  'OH-PA': 240,  'OH-TN': 550,  'OH-TX': 1200,
  'PA-TX': 1570,
  'TN-TX': 770,
};

export function getEstimatedMiles(originState: string, destState: string): number {
  const o = originState.toUpperCase();
  const d = destState.toUpperCase();
  if (o === d) return 150;
  const key = [o, d].sort().join('-');
  return DISTANCES[key] ?? 800;
}
