/**
 * Seed script — creates 4 demo drivers + 4 trucks for Acme Trucking LLC.
 * Run: pnpm --filter @aitms/api db:seed
 *
 * Drivers are designed to exercise the Week 5 gate checks:
 *   - Marcus (dry van, 65h HOS)  → eligible for any dry van load
 *   - Rosa   (reefer, 48h HOS)   → eligible for reefer loads
 *   - Dale   (flatbed, 55h HOS)  → eligible for flatbed loads only
 *   - Tanya  (dry van, 4h HOS)   → filtered out by HOS pre-filter
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Acme Trucking LLC — the demo company (set via inbound_email in CLAUDE.md)
const COMPANY_ID = '5fd3428b-775a-4eb8-9c6d-517cf72b5b16';

async function main() {
  console.log('Seeding drivers and trucks for Acme Trucking LLC...');

  // ── Trucks ────────────────────────────────────────────────────────────────
  const truck1 = await prisma.truck.upsert({
    where: { company_id_unit_number: { company_id: COMPANY_ID, unit_number: 'T-101' } },
    update: {},
    create: {
      company_id: COMPANY_ID,
      unit_number: 'T-101',
      type: 'DRY_VAN',
      status: 'AVAILABLE',
      year: 2021,
      make: 'Freightliner',
      model: 'Cascadia',
    },
  });

  const truck2 = await prisma.truck.upsert({
    where: { company_id_unit_number: { company_id: COMPANY_ID, unit_number: 'T-102' } },
    update: {},
    create: {
      company_id: COMPANY_ID,
      unit_number: 'T-102',
      type: 'REEFER',
      status: 'AVAILABLE',
      year: 2022,
      make: 'Kenworth',
      model: 'T680',
    },
  });

  const truck3 = await prisma.truck.upsert({
    where: { company_id_unit_number: { company_id: COMPANY_ID, unit_number: 'T-103' } },
    update: {},
    create: {
      company_id: COMPANY_ID,
      unit_number: 'T-103',
      type: 'FLATBED',
      status: 'AVAILABLE',
      year: 2020,
      make: 'Peterbilt',
      model: '389',
    },
  });

  const truck4 = await prisma.truck.upsert({
    where: { company_id_unit_number: { company_id: COMPANY_ID, unit_number: 'T-104' } },
    update: {},
    create: {
      company_id: COMPANY_ID,
      unit_number: 'T-104',
      type: 'DRY_VAN',
      status: 'AVAILABLE',
      year: 2019,
      make: 'International',
      model: 'LT',
    },
  });

  // ── Drivers ───────────────────────────────────────────────────────────────
  // Driver 1: Marcus — dry van, full HOS, close to Chicago (IL hub)
  await prisma.driver.upsert({
    where: { id: 'seed-driver-marcus-001' },
    update: {
      hos_remaining_hours: 65,
      status: 'AVAILABLE',
    },
    create: {
      id: 'seed-driver-marcus-001',
      company_id: COMPANY_ID,
      full_name: 'Marcus Johnson',
      phone: '+13125550101',
      whatsapp_phone: '+13125550101',
      cdl_class: 'A',
      endorsements: [],
      home_city: 'Chicago',
      home_state: 'IL',
      hos_remaining_hours: 65,
      status: 'AVAILABLE',
      assigned_truck_id: truck1.id,
    },
  });

  // Driver 2: Rosa — reefer truck, good HOS, based in Dallas (TX hub)
  await prisma.driver.upsert({
    where: { id: 'seed-driver-rosa-002' },
    update: {
      hos_remaining_hours: 48,
      status: 'AVAILABLE',
    },
    create: {
      id: 'seed-driver-rosa-002',
      company_id: COMPANY_ID,
      full_name: 'Rosa Martinez',
      phone: '+12145550202',
      whatsapp_phone: '+12145550202',
      cdl_class: 'A',
      endorsements: ['N'],
      home_city: 'Dallas',
      home_state: 'TX',
      hos_remaining_hours: 48,
      status: 'AVAILABLE',
      assigned_truck_id: truck2.id,
    },
  });

  // Driver 3: Dale — flatbed, good HOS, based in Atlanta (GA)
  // Will be EXCLUDED from dry van loads by the equipment pre-filter
  await prisma.driver.upsert({
    where: { id: 'seed-driver-dale-003' },
    update: {
      hos_remaining_hours: 55,
      status: 'AVAILABLE',
    },
    create: {
      id: 'seed-driver-dale-003',
      company_id: COMPANY_ID,
      full_name: 'Dale Cooper',
      phone: '+14045550303',
      whatsapp_phone: '+14045550303',
      cdl_class: 'A',
      endorsements: [],
      home_city: 'Atlanta',
      home_state: 'GA',
      hos_remaining_hours: 55,
      status: 'AVAILABLE',
      assigned_truck_id: truck3.id,
    },
  });

  // Driver 4: Tanya — dry van but only 4h HOS remaining
  // Will be EXCLUDED by the HOS pre-filter (needs >= 8h minimum)
  await prisma.driver.upsert({
    where: { id: 'seed-driver-tanya-004' },
    update: {
      hos_remaining_hours: 4,
      status: 'AVAILABLE',
    },
    create: {
      id: 'seed-driver-tanya-004',
      company_id: COMPANY_ID,
      full_name: 'Tanya Williams',
      phone: '+13125550404',
      whatsapp_phone: null,
      cdl_class: 'A',
      endorsements: [],
      home_city: 'Indianapolis',
      home_state: 'IN',
      hos_remaining_hours: 4,
      status: 'AVAILABLE',
      assigned_truck_id: truck4.id,
    },
  });

  // Sync truck statuses to IN_USE for assigned trucks
  await prisma.truck.updateMany({
    where: { id: { in: [truck1.id, truck2.id, truck3.id, truck4.id] } },
    data: { status: 'IN_USE' },
  });

  console.log('Done. Seeded:');
  console.log('  T-101 DRY_VAN  → Marcus Johnson  (65h HOS, IL) — eligible');
  console.log('  T-102 REEFER   → Rosa Martinez   (48h HOS, TX) — eligible for reefer');
  console.log('  T-103 FLATBED  → Dale Cooper     (55h HOS, GA) — excluded from dry van loads');
  console.log('  T-104 DRY_VAN  → Tanya Williams  (4h HOS,  IN) — excluded by HOS filter');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
