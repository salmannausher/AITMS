const DISTANCES: Record<string, number> = {
  'CA-OR': 680,  'CA-WA': 1030, 'CA-NV': 420,  'CA-AZ': 590,  'CA-TX': 1440,
  'CA-IL': 2020, 'CA-FL': 2750, 'CA-NY': 2820,
  'TX-IL': 920,  'TX-FL': 1230, 'TX-NY': 1770, 'TX-GA': 1100, 'TX-OH': 1200,
  'TX-PA': 1570, 'TX-TN': 770,  'TX-NC': 1400,
  'IL-NY': 790,  'IL-FL': 1180, 'IL-OH': 350,  'IL-GA': 780,  'IL-PA': 740,
  'IL-TN': 480,  'IL-MO': 300,
  'FL-NY': 1285, 'FL-GA': 450,  'FL-OH': 1060, 'FL-PA': 1100, 'FL-TN': 720,
  'FL-NC': 760,  'FL-TX': 1230,
  'NY-PA': 200,  'NY-OH': 460,  'NY-GA': 1000, 'NY-NC': 580,
  'OH-PA': 240,  'OH-GA': 720,  'OH-TN': 550,  'OH-NC': 620,
  'GA-PA': 920,  'GA-NC': 430,  'GA-TN': 280,  'GA-TX': 1100,
  'TN-TX': 770,  'TN-FL': 720,  'TN-NC': 430,  'TN-OH': 550,
  'NC-TX': 1400, 'NC-FL': 760,  'NC-PA': 620,
  'PA-FL': 1100, 'PA-TX': 1570,
};

export function getEstimatedMiles(originState: string, destState: string): number {
  const o = originState.toUpperCase();
  const d = destState.toUpperCase();
  if (o === d) return 150;
  const key = [o, d].sort().join('-');
  return DISTANCES[key] ?? 800;
}
