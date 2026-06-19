/**
 * Seed script — Apex Freight LLC demo company
 * IDEMPOTENT: deletes and recreates the demo company on every run.
 * Run: pnpm --filter @aitms/api db:seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fixed UUIDs — stable across seed runs, generated once
const ID = {
  company:      'c7f3a2b1-4e8d-4a1f-9c6e-2d5f8b3a7e9c',
  brokerEcho:   'b2e4f1a8-7c3d-4b2e-8f5a-1c9d6e2b4f7a',
  brokerCoyote: '958904ba-14ee-46ec-a783-ad6832913bc3',
  trk101:       '0ed81dd8-68b0-47a5-9e1b-d62700f167cb',
  trk102:       'dc338a64-d172-4e44-af02-501bb59d3ce9',
  trk103:       '93b51179-5c9a-4732-b945-4571c46a0181',
  marcus:       '1b4e7a2d-5c9f-4b1e-8a3d-6f2c5e8b1a4d',
  rosa:         '2c5f8b3e-6d1a-4c2f-9b4e-7a3d6f9c2b5e',
  dale:         '3e1972d8-e2f3-45c6-b095-cf255ac7ae47',
  tanya:        'd93b881b-e9a7-4bc7-8806-cec2d60037b7',
  ray:          '7d3947f1-312a-4ec5-b5ae-299748ba7229',
  load1:        'd794cbef-c736-4537-a0bf-297c67d0d2f7',
  load2:        '38148416-b621-4061-bdf1-36f65ab16cd9',
  load3:        '3e5a0617-e5fc-4d2f-80f2-4b3f7a27b81a',
  load4:        'ccdb15ec-69b4-47bd-9894-ceedcbe3d431',
  load5:        'ae4b7d2a-5f9c-4e1b-8d3a-6c2f5b8e1a4d',
  load6:        'bf5c8e3b-6a1d-4f2c-9e4b-7d3a6c9f2b5e',
  load7:        '9237c9b3-a942-4e79-8bb9-4befd50206b8',
  load8:        '88643620-a2c7-4334-a963-7345d78471cb',
  load9:        'eb74d21a-359e-441a-9caa-cf369fe3fc02',
  load10:       '438fd4b1-02dc-4333-b978-7a44d75da425',
} as const;

// all-in cost: 1.45 + 0.58 + 0.42 = 2.45
const ALL_IN = 2.45;

async function main() {
  // ── Cleanup (idempotency) ──────────────────────────────────────────────────
  // Delete ALL companies and their associated data before reseeding.
  console.log('Removing all existing companies and their data…');
  const allCompanies = await prisma.company.findMany({ select: { id: true } });
  for (const c of allCompanies) {
    await prisma.message.deleteMany({ where: { company_id: c.id } });
    await prisma.aiTask.deleteMany({ where: { company_id: c.id } });
    await prisma.loadEvent.deleteMany({ where: { load: { company_id: c.id } } });
    await prisma.load.deleteMany({ where: { company_id: c.id } });
    // Null out driver→truck FK before deleting trucks
    await prisma.driver.updateMany({ where: { company_id: c.id }, data: { assigned_truck_id: null } });
    await prisma.driver.deleteMany({ where: { company_id: c.id } });
    await prisma.truck.deleteMany({ where: { company_id: c.id } });
    await prisma.broker.deleteMany({ where: { company_id: c.id } });
    await prisma.user.deleteMany({ where: { company_id: c.id } });
    await prisma.company.delete({ where: { id: c.id } });
  }

  // ── Company ───────────────────────────────────────────────────────────────
  const company = await prisma.company.create({
    data: {
      id: ID.company,
      name: 'Apex Freight LLC',
      mc_number: 'MC-847291',
      dot_number: '4729104',
      inbound_email: 'demo@devsphinx.dev',
      address: { city: 'Chicago', state: 'IL' },
      settings: {
        onboarding_complete: true,
        costs: {
          cost_per_mile: 1.45,
          fuel_cost_per_mile: 0.58,
          driver_pay_per_mile: 0.42,
          minimum_rpm: 2.80,
          home_state: 'IL',
          show_rate_to_driver: false,
        },
      },
    },
  });

  // ── Brokers ───────────────────────────────────────────────────────────────
  const echo = await prisma.broker.create({
    data: {
      id: ID.brokerEcho,
      company_id: company.id,
      name: 'Echo Global Logistics',
      email_domains: ['echogloballogistics.com'],
      payment_terms: 30,
      blacklisted: false,
    },
  });

  const coyote = await prisma.broker.create({
    data: {
      id: ID.brokerCoyote,
      company_id: company.id,
      name: 'Coyote Logistics',
      email_domains: ['coyote.com'],
      payment_terms: 21,
      blacklisted: false,
    },
  });

  // ── Trucks ────────────────────────────────────────────────────────────────
  const trk101 = await prisma.truck.create({
    data: {
      id: ID.trk101, company_id: company.id,
      unit_number: 'APX-101', type: 'DRY_VAN',
      year: 2021, make: 'Freightliner', model: 'Cascadia',
      status: 'AVAILABLE',
    },
  });

  const trk102 = await prisma.truck.create({
    data: {
      id: ID.trk102, company_id: company.id,
      unit_number: 'APX-102', type: 'REEFER',
      year: 2022, make: 'Kenworth', model: 'T680',
      status: 'IN_USE',
    },
  });

  const trk103 = await prisma.truck.create({
    data: {
      id: ID.trk103, company_id: company.id,
      unit_number: 'APX-103', type: 'FLATBED',
      year: 2020, make: 'Peterbilt', model: '579',
      status: 'AVAILABLE',
    },
  });

  // ── Drivers ───────────────────────────────────────────────────────────────
  const marcus = await prisma.driver.create({
    data: {
      id: ID.marcus, company_id: company.id,
      full_name: 'Marcus Johnson', phone: '+13125550101', whatsapp_phone: '+13125550101',
      cdl_class: 'A', endorsements: [],
      home_city: 'Chicago', home_state: 'IL',
      hos_remaining_hours: 65, status: 'AVAILABLE',
      assigned_truck_id: trk101.id,
    },
  });

  const rosa = await prisma.driver.create({
    data: {
      id: ID.rosa, company_id: company.id,
      full_name: 'Rosa Martinez', phone: '+12145550202', whatsapp_phone: '+12145550202',
      cdl_class: 'A', endorsements: ['N'],
      home_city: 'Dallas', home_state: 'TX',
      hos_remaining_hours: 48, status: 'ON_LOAD',
      assigned_truck_id: trk102.id,
    },
  });

  const dale = await prisma.driver.create({
    data: {
      id: ID.dale, company_id: company.id,
      full_name: 'Dale Cooper', phone: '+14045550303', whatsapp_phone: '+14045550303',
      cdl_class: 'A', endorsements: [],
      home_city: 'Atlanta', home_state: 'GA',
      hos_remaining_hours: 55, status: 'AVAILABLE',
      assigned_truck_id: trk103.id,
    },
  });

  await prisma.driver.create({
    data: {
      id: ID.tanya, company_id: company.id,
      full_name: 'Tanya Williams', phone: '+13175550404', whatsapp_phone: null,
      cdl_class: 'B', endorsements: [],
      home_city: 'Indianapolis', home_state: 'IN',
      hos_remaining_hours: 12, status: 'ON_LOAD',
      assigned_truck_id: null,
    },
  });

  await prisma.driver.create({
    data: {
      id: ID.ray, company_id: company.id,
      full_name: 'Ray Kowalski', phone: '+16155550505', whatsapp_phone: '+16155550505',
      cdl_class: 'A', endorsements: [],
      home_city: 'Nashville', home_state: 'TN',
      hos_remaining_hours: 68, status: 'OFF_DUTY',
      assigned_truck_id: null,
    },
  });

  // ── Time helpers ──────────────────────────────────────────────────────────
  const now = new Date();
  const ha  = (h: number) => new Date(now.getTime() - h * 3_600_000);   // hours ago
  const da  = (d: number) => new Date(now.getTime() - d * 86_400_000);  // days ago
  const hf  = (h: number) => new Date(now.getTime() + h * 3_600_000);   // hours from now

  // Shared helper: build the ai_score_details blob the AiAnalysisPanel expects
  function scoredDetails(
    score: 'GOOD' | 'MARGINAL' | 'AVOID',
    rpm: number,
    estimatedMiles: number,
    rate: number,
    reason: string,
    suggestedMin: number,
    counteroffer: number | null,
    extra: Record<string, unknown> = {},
  ) {
    return {
      score,
      reason,
      suggested_minimum_rate: suggestedMin,
      counteroffer_rate: counteroffer,
      computed: {
        allInCostPerMile: ALL_IN,
        breakEvenRpm: ALL_IN,
        rpm,
        estimatedProfit: Math.round(rate - ALL_IN * estimatedMiles),
      },
      laneHistory: { count: 4, avgRpm: 2.95, minRpm: 2.65, maxRpm: 3.18 },
      dieselPricePerGallon: 3.85,
      scored_at: ha(12).toISOString(),
      ...extra,
    };
  }

  // ── Loads 1–3: PENDING ────────────────────────────────────────────────────
  await prisma.load.create({
    data: {
      id: ID.load1, company_id: company.id, broker_id: echo.id,
      origin_city: 'Chicago', origin_state: 'IL',
      dest_city: 'Houston', dest_state: 'TX',
      pickup_date: hf(24), load_type: 'DRY_VAN',
      weight: 42000, rate: 2450, rpm: parseFloat((2450 / 920).toFixed(4)),
      estimated_miles: 920, status: 'PENDING', source: 'EMAIL',
    },
  });

  await prisma.load.create({
    data: {
      id: ID.load2, company_id: company.id, broker_id: coyote.id,
      origin_city: 'Memphis', origin_state: 'TN',
      dest_city: 'Atlanta', dest_state: 'GA',
      pickup_date: hf(36), load_type: 'REEFER',
      weight: 38000, rate: 1850, rpm: parseFloat((1850 / 480).toFixed(4)),
      estimated_miles: 480, status: 'PENDING', source: 'EMAIL',
    },
  });

  await prisma.load.create({
    data: {
      id: ID.load3, company_id: company.id, broker_id: echo.id,
      origin_city: 'St. Louis', origin_state: 'MO',
      dest_city: 'Nashville', dest_state: 'TN',
      pickup_date: hf(48), load_type: 'DRY_VAN',
      weight: 44000, rate: 1200, rpm: parseFloat((1200 / 300).toFixed(4)),
      estimated_miles: 300, status: 'PENDING', source: 'EMAIL',
    },
  });

  // ── Loads 4–6: SCORED ────────────────────────────────────────────────────
  // Load 4 — GOOD
  await prisma.load.create({
    data: {
      id: ID.load4, company_id: company.id, broker_id: echo.id,
      origin_city: 'Dallas', origin_state: 'TX',
      dest_city: 'Chicago', dest_state: 'IL',
      pickup_date: hf(48), load_type: 'DRY_VAN',
      weight: 40000, rate: 2800, rpm: 3.12,
      estimated_miles: 897, status: 'SCORED', ai_score: 'GOOD',
      source: 'EMAIL',
      ai_score_details: scoredDetails('GOOD', 3.12, 897, 2800,
        'Strong RPM 3.12, well above minimum 2.80', 2250, null),
    },
  });
  await prisma.aiTask.create({
    data: {
      company_id: company.id, agent: 'rate_analysis', task_type: 'score_load',
      entity_type: 'load', entity_id: ID.load4,
      input: { lane: 'TX→IL', rate: 2800, rpm: 3.12, allInCostPerMile: ALL_IN },
      output: { score: 'GOOD', reason: 'Strong RPM 3.12, well above minimum 2.80' },
      model: 'claude-haiku-4-5', input_tokens: 318, output_tokens: 52, latency_ms: 1190,
      status: 'COMPLETED',
    },
  });

  // Load 5 — MARGINAL
  await prisma.load.create({
    data: {
      id: ID.load5, company_id: company.id, broker_id: coyote.id,
      origin_city: 'Atlanta', origin_state: 'GA',
      dest_city: 'Memphis', dest_state: 'TN',
      pickup_date: hf(36), load_type: 'DRY_VAN',
      weight: 36000, rate: 1600, rpm: 2.91,
      estimated_miles: 550, status: 'SCORED', ai_score: 'MARGINAL',
      source: 'EMAIL',
      ai_score_details: scoredDetails('MARGINAL', 2.91, 550, 1600,
        'RPM 2.91 acceptable, tight margin above 2.80', 1540, 1728),
    },
  });
  await prisma.aiTask.create({
    data: {
      company_id: company.id, agent: 'rate_analysis', task_type: 'score_load',
      entity_type: 'load', entity_id: ID.load5,
      input: { lane: 'GA→TN', rate: 1600, rpm: 2.91, allInCostPerMile: ALL_IN },
      output: { score: 'MARGINAL', reason: 'RPM 2.91 acceptable, tight margin above 2.80' },
      model: 'claude-haiku-4-5', input_tokens: 305, output_tokens: 48, latency_ms: 1140,
      status: 'COMPLETED',
    },
  });

  // Load 6 — AVOID
  await prisma.load.create({
    data: {
      id: ID.load6, company_id: company.id, broker_id: echo.id,
      origin_city: 'Kansas City', origin_state: 'MO',
      dest_city: 'Miami', dest_state: 'FL',
      pickup_date: hf(24), load_type: 'DRY_VAN',
      weight: 45000, rate: 2100, rpm: 1.89,
      estimated_miles: 1110, status: 'SCORED', ai_score: 'AVOID',
      source: 'EMAIL',
      ai_score_details: scoredDetails('AVOID', 1.89, 1110, 2100,
        'RPM 1.89 below minimum 2.80, losing money', 3108, null),
    },
  });
  await prisma.aiTask.create({
    data: {
      company_id: company.id, agent: 'rate_analysis', task_type: 'score_load',
      entity_type: 'load', entity_id: ID.load6,
      input: { lane: 'MO→FL', rate: 2100, rpm: 1.89, allInCostPerMile: ALL_IN },
      output: { score: 'AVOID', reason: 'RPM 1.89 below minimum 2.80, losing money' },
      model: 'claude-haiku-4-5', input_tokens: 299, output_tokens: 44, latency_ms: 1080,
      status: 'COMPLETED',
    },
  });

  // ── Load 7: ASSIGNED — Chicago IL → Dallas TX ─────────────────────────────
  const assignedAt7 = ha(2);
  const driverRankings7 = {
    ranked_drivers: [
      {
        driver_id: marcus.id, driver_name: 'Marcus Johnson',
        rank: 1, score: 94, reason: 'Home base Chicago, minimal deadhead',
        deadhead_miles: 12, eta_hours: 0.2,
      },
      {
        driver_id: dale.id, driver_name: 'Dale Cooper',
        rank: 2, score: 61, reason: 'Available but high deadhead from GA',
        deadhead_miles: 580, eta_hours: 10.5,
      },
    ],
    recommendation_summary: 'Marcus is the clear top pick — home base in Chicago with near-zero deadhead.',
  };

  await prisma.load.create({
    data: {
      id: ID.load7, company_id: company.id, broker_id: echo.id,
      origin_city: 'Chicago', origin_state: 'IL',
      dest_city: 'Dallas', dest_state: 'TX',
      pickup_date: hf(20), load_type: 'DRY_VAN',
      weight: 41000, rate: 2800, rpm: 3.05,
      estimated_miles: 920, status: 'ASSIGNED', ai_score: 'GOOD',
      assigned_driver_id: marcus.id, assigned_truck_id: trk101.id,
      assigned_at: assignedAt7, source: 'EMAIL',
      ai_score_details: scoredDetails('GOOD', 3.05, 920, 2800,
        'Strong RPM 3.05, above minimum 2.80', 2254, null,
        { driver_rankings: driverRankings7, driver_rankings_at: ha(8).toISOString() }),
    },
  });

  // Load 7 events (4h apart)
  for (const [i, ev] of [
    { event_type: 'CREATED',       from_status: null,       to_status: 'PENDING',  actor_type: 'system', metadata: {} },
    { event_type: 'STATUS_CHANGE', from_status: 'PENDING',  to_status: 'SCORED',   actor_type: 'system', metadata: {} },
    { event_type: 'STATUS_CHANGE', from_status: 'SCORED',   to_status: 'ACCEPTED', actor_type: 'user',   metadata: {} },
    { event_type: 'ASSIGNED',      from_status: 'ACCEPTED', to_status: 'ASSIGNED', actor_type: 'user',   metadata: { driver_name: 'Marcus Johnson' } },
  ].entries()) {
    await prisma.loadEvent.create({
      data: { load_id: ID.load7, ...ev, created_at: ha(16 - i * 4) },
    });
  }

  // Load 7 messages (WhatsApp flow)
  await prisma.message.create({
    data: {
      company_id: company.id, load_id: ID.load7, driver_id: marcus.id,
      direction: 'OUTBOUND', channel: 'WHATSAPP',
      body: `Hi Marcus! You've got a new load assignment.\n\n📍 Chicago, IL → Dallas, TX\n📅 Pick up in ~20 hours\n🚛 Dry Van | 41,000 lbs\n\nReply YES to confirm or NO to decline.`,
      status: 'delivered',
      created_at: assignedAt7,
    },
  });
  await prisma.message.create({
    data: {
      company_id: company.id, load_id: ID.load7, driver_id: marcus.id,
      direction: 'INBOUND', channel: 'WHATSAPP',
      body: 'YES',
      status: 'received',
      created_at: new Date(assignedAt7.getTime() + 9 * 60_000),
    },
  });

  // Load 7 AiTasks
  await prisma.aiTask.create({
    data: {
      company_id: company.id, agent: 'rate_analysis', task_type: 'score_load',
      entity_type: 'load', entity_id: ID.load7,
      input: { lane: 'IL→TX', rate: 2800, rpm: 3.05, allInCostPerMile: ALL_IN },
      output: { score: 'GOOD', reason: 'Strong RPM 3.05, above minimum 2.80' },
      model: 'claude-haiku-4-5', input_tokens: 312, output_tokens: 48, latency_ms: 1240,
      status: 'COMPLETED', created_at: ha(12),
    },
  });
  await prisma.aiTask.create({
    data: {
      company_id: company.id, agent: 'dispatch', task_type: 'rank_drivers',
      entity_type: 'load', entity_id: ID.load7,
      input: { loadId: ID.load7, driverCount: 2, origin: 'IL', dest: 'TX' },
      output: driverRankings7,
      model: 'claude-haiku-4-5', input_tokens: 428, output_tokens: 112, latency_ms: 1680,
      status: 'COMPLETED', created_at: ha(8),
    },
  });

  // ── Load 8: ASSIGNED — Nashville TN → Charlotte NC, REEFER, Rosa ──────────
  const assignedAt8 = ha(3);
  const driverRankings8 = {
    ranked_drivers: [
      {
        driver_id: rosa.id, driver_name: 'Rosa Martinez',
        rank: 1, score: 88, reason: 'Reefer truck, good HOS, moderate deadhead',
        deadhead_miles: 145, eta_hours: 2.6,
      },
    ],
    recommendation_summary: 'Rosa is the only reefer-equipped driver with sufficient HOS.',
  };

  await prisma.load.create({
    data: {
      id: ID.load8, company_id: company.id, broker_id: coyote.id,
      origin_city: 'Nashville', origin_state: 'TN',
      dest_city: 'Charlotte', dest_state: 'NC',
      pickup_date: hf(18), load_type: 'REEFER',
      weight: 34000, rate: 1950, rpm: 2.98,
      estimated_miles: 654, status: 'ASSIGNED', ai_score: 'GOOD',
      assigned_driver_id: rosa.id, assigned_truck_id: trk102.id,
      assigned_at: assignedAt8, source: 'EMAIL',
      ai_score_details: scoredDetails('GOOD', 2.98, 654, 1950,
        'RPM 2.98 above minimum, solid reefer rate', 1602, null,
        { driver_rankings: driverRankings8, driver_rankings_at: ha(9).toISOString() }),
    },
  });

  for (const [i, ev] of [
    { event_type: 'CREATED',       from_status: null,       to_status: 'PENDING',  actor_type: 'system', metadata: {} },
    { event_type: 'STATUS_CHANGE', from_status: 'PENDING',  to_status: 'SCORED',   actor_type: 'system', metadata: {} },
    { event_type: 'STATUS_CHANGE', from_status: 'SCORED',   to_status: 'ACCEPTED', actor_type: 'user',   metadata: {} },
    { event_type: 'ASSIGNED',      from_status: 'ACCEPTED', to_status: 'ASSIGNED', actor_type: 'user',   metadata: { driver_name: 'Rosa Martinez' } },
  ].entries()) {
    await prisma.loadEvent.create({
      data: { load_id: ID.load8, ...ev, created_at: ha(15 - i * 4) },
    });
  }

  await prisma.aiTask.create({
    data: {
      company_id: company.id, agent: 'rate_analysis', task_type: 'score_load',
      entity_type: 'load', entity_id: ID.load8,
      input: { lane: 'TN→NC', rate: 1950, rpm: 2.98, allInCostPerMile: ALL_IN },
      output: { score: 'GOOD', reason: 'RPM 2.98 above minimum, solid reefer rate' },
      model: 'claude-haiku-4-5', input_tokens: 308, output_tokens: 46, latency_ms: 1160,
      status: 'COMPLETED', created_at: ha(13),
    },
  });
  await prisma.aiTask.create({
    data: {
      company_id: company.id, agent: 'dispatch', task_type: 'rank_drivers',
      entity_type: 'load', entity_id: ID.load8,
      input: { loadId: ID.load8, driverCount: 1, origin: 'TN', dest: 'NC' },
      output: driverRankings8,
      model: 'claude-haiku-4-5', input_tokens: 380, output_tokens: 88, latency_ms: 1520,
      status: 'COMPLETED', created_at: ha(9),
    },
  });

  // ── Load 9: EN_ROUTE — Memphis TN → Chicago IL, Marcus ───────────────────
  await prisma.load.create({
    data: {
      id: ID.load9, company_id: company.id, broker_id: echo.id,
      origin_city: 'Memphis', origin_state: 'TN',
      dest_city: 'Chicago', dest_state: 'IL',
      pickup_date: da(1), load_type: 'DRY_VAN',
      weight: 39000, rate: 2200, rpm: 2.93,
      estimated_miles: 531, status: 'EN_ROUTE', ai_score: 'GOOD',
      assigned_driver_id: marcus.id, assigned_truck_id: trk101.id,
      assigned_at: da(2), source: 'EMAIL',
      ai_score_details: scoredDetails('GOOD', 2.93, 531, 2200,
        'RPM 2.93 acceptable, above break-even', 1301, null),
    },
  });

  await prisma.aiTask.create({
    data: {
      company_id: company.id, agent: 'rate_analysis', task_type: 'score_load',
      entity_type: 'load', entity_id: ID.load9,
      input: { lane: 'TN→IL', rate: 2200, rpm: 2.93, allInCostPerMile: ALL_IN },
      output: { score: 'GOOD', reason: 'RPM 2.93 acceptable, above break-even' },
      model: 'claude-haiku-4-5', input_tokens: 301, output_tokens: 44, latency_ms: 1110,
      status: 'COMPLETED', created_at: da(3),
    },
  });

  // ── Load 10: DELIVERED — Dallas TX → Atlanta GA, Dale, full event timeline ─
  const deliveredAt = da(1);
  const confirmedAt = da(3);

  await prisma.load.create({
    data: {
      id: ID.load10, company_id: company.id, broker_id: coyote.id,
      origin_city: 'Dallas', origin_state: 'TX',
      dest_city: 'Atlanta', dest_state: 'GA',
      pickup_date: da(5), delivery_date: da(3), load_type: 'FLATBED',
      weight: 37500, rate: 2650, rpm: 3.27,
      estimated_miles: 810, status: 'DELIVERED', ai_score: 'GOOD',
      assigned_driver_id: dale.id, assigned_truck_id: trk103.id,
      assigned_at: da(6), driver_confirmed_at: confirmedAt,
      source: 'EMAIL',
      ai_score_details: scoredDetails('GOOD', 3.27, 810, 2650,
        'RPM 3.27 strong, excellent flatbed rate for this lane', 1985, null),
    },
  });

  // Load 10 — 8 events (full lifecycle)
  const load10Events = [
    { event_type: 'CREATED',       from_status: null,        to_status: 'PENDING',   actor_type: 'system', metadata: {},                                    at: da(8) },
    { event_type: 'STATUS_CHANGE', from_status: 'PENDING',   to_status: 'SCORED',    actor_type: 'system', metadata: {},                                    at: da(7.9) },
    { event_type: 'STATUS_CHANGE', from_status: 'SCORED',    to_status: 'ACCEPTED',  actor_type: 'user',   metadata: {},                                    at: da(7) },
    { event_type: 'ASSIGNED',      from_status: 'ACCEPTED',  to_status: 'ASSIGNED',  actor_type: 'user',   metadata: { driver_name: 'Dale Cooper' },        at: da(6) },
    { event_type: 'STATUS_CHANGE', from_status: 'ASSIGNED',  to_status: 'AT_PICKUP', actor_type: 'system', metadata: {},                                    at: da(5) },
    { event_type: 'STATUS_CHANGE', from_status: 'AT_PICKUP', to_status: 'LOADED',    actor_type: 'system', metadata: { weight_confirmed: '37500 lbs' },     at: da(4.5) },
    { event_type: 'STATUS_CHANGE', from_status: 'LOADED',    to_status: 'EN_ROUTE',  actor_type: 'system', metadata: {},                                    at: da(4) },
    { event_type: 'STATUS_CHANGE', from_status: 'EN_ROUTE',  to_status: 'DELIVERED', actor_type: 'system', metadata: { pod_received: false },               at: deliveredAt },
  ];

  for (const ev of load10Events) {
    await prisma.loadEvent.create({
      data: {
        load_id: ID.load10,
        event_type: ev.event_type,
        from_status: ev.from_status,
        to_status: ev.to_status,
        actor_type: ev.actor_type,
        metadata: ev.metadata,
        created_at: ev.at,
      },
    });
  }

  await prisma.aiTask.create({
    data: {
      company_id: company.id, agent: 'rate_analysis', task_type: 'score_load',
      entity_type: 'load', entity_id: ID.load10,
      input: { lane: 'TX→GA', rate: 2650, rpm: 3.27, allInCostPerMile: ALL_IN },
      output: { score: 'GOOD', reason: 'RPM 3.27 strong, excellent flatbed rate for this lane' },
      model: 'claude-haiku-4-5', input_tokens: 310, output_tokens: 50, latency_ms: 1200,
      status: 'COMPLETED', created_at: da(7.9),
    },
  });

  console.log('\n✓ Apex Freight LLC demo seed complete.');
  console.log('  Company:  Apex Freight LLC  (inbound_email: demo@devsphinx.dev)');
  console.log('  Brokers:  Echo Global Logistics, Coyote Logistics');
  console.log('  Trucks:   APX-101 (DRY_VAN), APX-102 (REEFER), APX-103 (FLATBED)');
  console.log('  Drivers:  Marcus (65h IL), Rosa (48h TX), Dale (55h GA), Tanya (12h IN), Ray (68h TN)');
  console.log('  Loads:    3 PENDING · 3 SCORED · 2 ASSIGNED · 1 EN_ROUTE · 1 DELIVERED');
  console.log('\nDemo company created. Auth user must be created manually in Supabase dashboard.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
