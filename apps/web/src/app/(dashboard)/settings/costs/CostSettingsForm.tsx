'use client';

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { carrierCostSettingsSchema, type CarrierCostSettings, US_STATES } from '@aitms/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Props = {
  initialValues: CarrierCostSettings | null;
  isOwner: boolean;
  onSuccess?: () => void;
};

export function CostSettingsForm({ initialValues, isOwner, onSuccess }: Props) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<CarrierCostSettings>({
    resolver: zodResolver(carrierCostSettingsSchema),
    defaultValues: initialValues ?? undefined,
  });

  useEffect(() => {
    if (initialValues) reset(initialValues);
  }, [initialValues, reset]);

  const costPerMile = useWatch({ control, name: 'cost_per_mile' }) ?? 0;
  const fuelCostPerMile = useWatch({ control, name: 'fuel_cost_per_mile' }) ?? 0;
  const driverPayPerMile = useWatch({ control, name: 'driver_pay_per_mile' }) ?? 0;
  const minimumRpm = useWatch({ control, name: 'minimum_rpm' }) ?? 0;

  const allInCost = Number(costPerMile) + Number(fuelCostPerMile) + Number(driverPayPerMile);
  const belowBreakEven = Number(minimumRpm) > 0 && Number(minimumRpm) < allInCost;

  async function onSubmit(data: CarrierCostSettings) {
    setSaveStatus('saving');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/companies/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
        onSuccess?.();
      } else {
        const err = await res.json() as { message?: string };
        setErrorMessage(err.message ?? 'Failed to save settings.');
        setSaveStatus('error');
      }
    } catch {
      setErrorMessage('Network error. Please try again.');
      setSaveStatus('error');
    }
  }

  const disabled = !isOwner || saveStatus === 'saving';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {!isOwner && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You have read-only access. Only the company owner can edit these settings.
        </div>
      )}

      {/* Card 1 — Cost Basis */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Basis</CardTitle>
          <CardDescription>
            Your per-mile operating costs. Used to score loads and flag unprofitable rates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="cost_per_mile">Operating cost / mile ($)</Label>
              <Input
                id="cost_per_mile"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.65"
                disabled={disabled}
                {...register('cost_per_mile', { valueAsNumber: true })}
              />
              {errors.cost_per_mile && (
                <p className="text-sm text-destructive">{errors.cost_per_mile.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="fuel_cost_per_mile">Fuel cost / mile ($)</Label>
              <Input
                id="fuel_cost_per_mile"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.75"
                disabled={disabled}
                {...register('fuel_cost_per_mile', { valueAsNumber: true })}
              />
              {errors.fuel_cost_per_mile && (
                <p className="text-sm text-destructive">{errors.fuel_cost_per_mile.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="driver_pay_per_mile">Driver pay / mile ($)</Label>
              <Input
                id="driver_pay_per_mile"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.55"
                disabled={disabled}
                {...register('driver_pay_per_mile', { valueAsNumber: true })}
              />
              {errors.driver_pay_per_mile && (
                <p className="text-sm text-destructive">{errors.driver_pay_per_mile.message}</p>
              )}
            </div>
          </div>

          {/* Live break-even calc */}
          {allInCost > 0 && (
            <div className="rounded-md bg-muted px-4 py-3 text-sm">
              <span className="text-muted-foreground">Break-even: </span>
              <span className="font-semibold">${allInCost.toFixed(2)}/mi</span>
              {Number(minimumRpm) > 0 && (
                <>
                  <span className="mx-2 text-muted-foreground">·</span>
                  <span className="text-muted-foreground">Your minimum: </span>
                  <span className="font-semibold">${Number(minimumRpm).toFixed(2)}/mi</span>
                </>
              )}
            </div>
          )}

          {belowBreakEven && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Your minimum RPM is below break-even — you&apos;d lose money at this rate.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 2 — Dispatch Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Dispatch Rules</CardTitle>
          <CardDescription>
            Thresholds the AI scorer uses to classify loads as Good, Marginal, or Avoid.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="minimum_rpm">Minimum RPM ($/mile)</Label>
              <Input
                id="minimum_rpm"
                type="number"
                step="0.01"
                min="0"
                placeholder="2.00"
                disabled={disabled}
                {...register('minimum_rpm', { valueAsNumber: true })}
              />
              {errors.minimum_rpm && (
                <p className="text-sm text-destructive">{errors.minimum_rpm.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="home_state">Home State</Label>
              <Select
                defaultValue={initialValues?.home_state}
                onValueChange={(v) => setValue('home_state', v, { shouldValidate: true })}
                disabled={disabled}
              >
                <SelectTrigger id="home_state">
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
              {errors.home_state && (
                <p className="text-sm text-destructive">{errors.home_state.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {saveStatus === 'error' && errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}

      {saveStatus === 'saved' && (
        <p className="text-sm text-green-700 font-medium">Settings saved.</p>
      )}

      {isOwner && (
        <Button type="submit" disabled={disabled}>
          {saveStatus === 'saving' ? 'Saving…' : 'Save settings'}
        </Button>
      )}
    </form>
  );
}
