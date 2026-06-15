-- Migration: add driver reply tracking fields to loads

ALTER TABLE loads
  ADD COLUMN IF NOT EXISTS driver_confirmed_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS driver_declined_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS estimated_arrival_at TIMESTAMPTZ;
