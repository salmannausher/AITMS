'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDriverSchema, US_STATES } from '@aitms/shared';
import type { z } from 'zod';

type DriverFormValues = z.input<typeof createDriverSchema>;
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Driver, Truck } from './DriverBoardClient';

const ENDORSEMENTS = ['H', 'N', 'T', 'X', 'P', 'S'];

type Props = {
  open: boolean;
  driver: Driver | null;
  trucks: Truck[];
  onClose: () => void;
  onSuccess: () => void;
};

export function DriverDrawer({ open, driver, trucks, onClose, onSuccess }: Props) {
  const isEdit = driver !== null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedEndorsements, setSelectedEndorsements] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DriverFormValues>({
    resolver: zodResolver(createDriverSchema),
  });

  // Reset form when drawer opens
  useEffect(() => {
    if (open) {
      setSubmitError(null);
      setSelectedEndorsements(driver?.endorsements ?? []);
      reset({
        full_name: driver?.full_name ?? '',
        phone: driver?.phone ?? '',
        whatsapp_phone: driver?.whatsapp_phone ?? '',
        cdl_class: driver?.cdl_class ?? 'A',
        endorsements: driver?.endorsements ?? [],
        home_city: driver?.home_city ?? '',
        home_state: driver?.home_state ?? '',
        hos_remaining_hours: driver?.hos_remaining_hours ?? 70,
        status: driver?.status ?? 'AVAILABLE',
        assigned_truck_id: driver?.assigned_truck_id ?? null,
      });
    }
  }, [open, driver, reset]);

  function toggleEndorsement(e: string) {
    const next = selectedEndorsements.includes(e)
      ? selectedEndorsements.filter((x) => x !== e)
      : [...selectedEndorsements, e];
    setSelectedEndorsements(next);
    setValue('endorsements', next);
  }

  const availableTrucks = trucks.filter(
    (t) => t.status === 'AVAILABLE' || t.id === driver?.assigned_truck_id,
  );

  async function onSubmit(data: DriverFormValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const url = isEdit ? `/api/drivers/${driver.id}` : '/api/drivers';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.json() as { message?: string; error?: string };
        setSubmitError(err.message ?? err.error ?? 'Something went wrong.');
      }
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Driver' : 'Add Driver'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input id="full_name" placeholder="John Smith" disabled={isSubmitting} {...register('full_name')} />
            {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
          </div>

          {/* Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" placeholder="+1-555-0100" disabled={isSubmitting} {...register('phone')} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="whatsapp_phone">WhatsApp</Label>
              <Input id="whatsapp_phone" placeholder="+1-555-0100" disabled={isSubmitting} {...register('whatsapp_phone')} />
            </div>
          </div>

          {/* CDL */}
          <div className="space-y-1">
            <Label>CDL Class *</Label>
            <Select
              defaultValue={driver?.cdl_class ?? 'A'}
              onValueChange={(v) => setValue('cdl_class', v as 'A' | 'B' | 'C', { shouldValidate: true })}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Class A</SelectItem>
                <SelectItem value="B">Class B</SelectItem>
                <SelectItem value="C">Class C</SelectItem>
              </SelectContent>
            </Select>
            {errors.cdl_class && <p className="text-sm text-destructive">{errors.cdl_class.message}</p>}
          </div>

          {/* Endorsements */}
          <div className="space-y-2">
            <Label>Endorsements</Label>
            <div className="flex flex-wrap gap-2">
              {ENDORSEMENTS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => toggleEndorsement(e)}
                  disabled={isSubmitting}
                  className={`px-3 py-1 rounded-md border text-sm transition-colors ${
                    selectedEndorsements.includes(e)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-transparent hover:bg-accent'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Home location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="home_city">Home City *</Label>
              <Input id="home_city" placeholder="Chicago" disabled={isSubmitting} {...register('home_city')} />
              {errors.home_city && <p className="text-sm text-destructive">{errors.home_city.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Home State *</Label>
              <Select
                defaultValue={driver?.home_state ?? ''}
                onValueChange={(v) => setValue('home_state', v, { shouldValidate: true })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.code} — {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.home_state && <p className="text-sm text-destructive">{errors.home_state.message}</p>}
            </div>
          </div>

          {/* HOS */}
          <div className="space-y-1">
            <Label htmlFor="hos_remaining_hours">HOS Remaining (hours, 0–70)</Label>
            <Input
              id="hos_remaining_hours"
              type="number"
              min={0}
              max={70}
              step={0.5}
              disabled={isSubmitting}
              {...register('hos_remaining_hours', { valueAsNumber: true })}
            />
            {errors.hos_remaining_hours && <p className="text-sm text-destructive">{errors.hos_remaining_hours.message}</p>}
          </div>

          {/* Status */}
          <div className="space-y-1">
            <Label>Status</Label>
            <Select
              defaultValue={driver?.status ?? 'AVAILABLE'}
              onValueChange={(v) => setValue('status', v as DriverFormValues['status'], { shouldValidate: true })}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="ON_LOAD">On Load</SelectItem>
                <SelectItem value="OFF_DUTY">Off Duty</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assigned truck */}
          <div className="space-y-1">
            <Label>Assigned Truck</Label>
            <Select
              defaultValue={driver?.assigned_truck_id ?? '__none__'}
              onValueChange={(v) => setValue('assigned_truck_id', v === '__none__' ? null : v)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {availableTrucks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.unit_number} ({t.type.replace('_', ' ')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Driver'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
