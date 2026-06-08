'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createLoadSchema, type CreateLoadInput, getEstimatedMiles, US_STATES } from '@aitms/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Broker = { id: string; name: string; mc_number: string | null };

const LOAD_TYPE_OPTIONS = [
  { value: 'DRY_VAN', label: 'Dry Van' },
  { value: 'REEFER', label: 'Reefer' },
  { value: 'FLATBED', label: 'Flatbed' },
  { value: 'STEP_DECK', label: 'Step Deck' },
] as const;

export function LoadForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [brokerMode, setBrokerMode] = useState<'select' | 'new'>('select');

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateLoadInput>({
    resolver: zodResolver(createLoadSchema),
  });

  // Fetch existing brokers on mount
  useEffect(() => {
    fetch('/api/brokers')
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setBrokers(data as Broker[]);
      })
      .catch(() => {
        // Non-fatal — broker field degrades to text input
      });
  }, []);

  // Watch states + rate for live calculations
  const originState = useWatch({ control, name: 'origin_state' }) ?? '';
  const destState = useWatch({ control, name: 'dest_state' }) ?? '';
  const rate = useWatch({ control, name: 'rate' });

  const estimatedMiles = useMemo(() => {
    if (originState.length === 2 && destState.length === 2) {
      return getEstimatedMiles(originState, destState);
    }
    return null;
  }, [originState, destState]);

  // Keep estimated_miles field in sync so it's included in the payload
  useEffect(() => {
    if (estimatedMiles !== null) {
      setValue('estimated_miles', estimatedMiles);
    }
  }, [estimatedMiles, setValue]);

  const rpm = useMemo(() => {
    if (rate && estimatedMiles && estimatedMiles > 0) {
      return (Number(rate) / estimatedMiles).toFixed(2);
    }
    return null;
  }, [rate, estimatedMiles]);

  async function onSubmit(data: CreateLoadInput) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/loads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const load = await response.json() as { id: string };
        router.push(`/loads/${load.id}`);
      } else {
        const err = await response.json() as { message?: string; error?: string };
        setSubmitError(err.message ?? err.error ?? 'Failed to create load. Please try again.');
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Origin */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Origin
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="origin_city">City *</Label>
            <Input
              id="origin_city"
              placeholder="Chicago"
              disabled={isSubmitting}
              {...register('origin_city')}
            />
            {errors.origin_city && (
              <p className="text-sm font-medium text-destructive">{errors.origin_city.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="origin_state">State *</Label>
            <Select
              onValueChange={(v) => setValue('origin_state', v, { shouldValidate: true })}
              disabled={isSubmitting}
            >
              <SelectTrigger id="origin_state">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {s.code} — {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.origin_state && (
              <p className="text-sm font-medium text-destructive">{errors.origin_state.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Destination */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Destination
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="dest_city">City *</Label>
            <Input
              id="dest_city"
              placeholder="Dallas"
              disabled={isSubmitting}
              {...register('dest_city')}
            />
            {errors.dest_city && (
              <p className="text-sm font-medium text-destructive">{errors.dest_city.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="dest_state">State *</Label>
            <Select
              onValueChange={(v) => setValue('dest_state', v, { shouldValidate: true })}
              disabled={isSubmitting}
            >
              <SelectTrigger id="dest_state">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {s.code} — {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.dest_state && (
              <p className="text-sm font-medium text-destructive">{errors.dest_state.message}</p>
            )}
          </div>
        </div>

        {/* Estimated miles display */}
        {estimatedMiles !== null && (
          <p className="mt-2 text-sm text-muted-foreground">
            Estimated distance: <span className="font-medium text-foreground">{estimatedMiles.toLocaleString()} miles</span>
          </p>
        )}
      </div>

      {/* Dates */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Dates
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="pickup_date">Pickup Date *</Label>
            <Input
              id="pickup_date"
              type="date"
              disabled={isSubmitting}
              {...register('pickup_date')}
            />
            {errors.pickup_date && (
              <p className="text-sm font-medium text-destructive">{errors.pickup_date.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="delivery_date">Delivery Date</Label>
            <Input
              id="delivery_date"
              type="date"
              disabled={isSubmitting}
              {...register('delivery_date')}
            />
            {errors.delivery_date && (
              <p className="text-sm font-medium text-destructive">{errors.delivery_date.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Rate & Load Details */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Load Details
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="rate">Rate ($) *</Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              min="0"
              placeholder="2450.00"
              disabled={isSubmitting}
              {...register('rate', { valueAsNumber: true })}
            />
            {rpm !== null && (
              <p className="text-sm text-muted-foreground">
                RPM: <span className="font-medium text-foreground">${rpm} / mile</span>
              </p>
            )}
            {errors.rate && (
              <p className="text-sm font-medium text-destructive">{errors.rate.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="load_type">Load Type</Label>
            <Select
              onValueChange={(v) =>
                setValue('load_type', v as CreateLoadInput['load_type'], { shouldValidate: true })
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="load_type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {LOAD_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="weight">Weight (lbs)</Label>
            <Input
              id="weight"
              type="number"
              min="0"
              placeholder="42000"
              disabled={isSubmitting}
              {...register('weight', { valueAsNumber: true })}
            />
            {errors.weight && (
              <p className="text-sm font-medium text-destructive">{errors.weight.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="commodity">Commodity</Label>
            <Input
              id="commodity"
              placeholder="General freight"
              disabled={isSubmitting}
              {...register('commodity')}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="reference_number">Reference Number</Label>
            <Input
              id="reference_number"
              placeholder="RC-123456"
              disabled={isSubmitting}
              {...register('reference_number')}
            />
          </div>
        </div>
      </div>

      {/* Broker */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Broker
        </h2>
        {brokers.length > 0 ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setBrokerMode('select');
                  setValue('broker_name', null);
                }}
                className={`text-sm px-3 py-1 rounded-md border transition-colors ${
                  brokerMode === 'select'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-transparent hover:bg-accent'
                }`}
              >
                Existing broker
              </button>
              <button
                type="button"
                onClick={() => {
                  setBrokerMode('new');
                  setValue('broker_id', null);
                }}
                className={`text-sm px-3 py-1 rounded-md border transition-colors ${
                  brokerMode === 'new'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-transparent hover:bg-accent'
                }`}
              >
                New broker
              </button>
            </div>

            {brokerMode === 'select' ? (
              <Select
                onValueChange={(v) => setValue('broker_id', v, { shouldValidate: true })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select broker" />
                </SelectTrigger>
                <SelectContent>
                  {brokers.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                      {b.mc_number ? ` (MC# ${b.mc_number})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Broker company name"
                disabled={isSubmitting}
                {...register('broker_name')}
              />
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <Label htmlFor="broker_name">Broker Name</Label>
            <Input
              id="broker_name"
              placeholder="Broker company name"
              disabled={isSubmitting}
              {...register('broker_name')}
            />
          </div>
        )}
      </div>

      {/* Hidden estimated_miles — kept in sync via useEffect above */}
      <input type="hidden" {...register('estimated_miles', { valueAsNumber: true })} />

      {submitError && (
        <p className="text-sm font-medium text-destructive">{submitError}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating load…' : 'Create Load'}
      </Button>
    </form>
  );
}
