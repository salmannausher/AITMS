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
  SheetDescription,
} from '@/components/ui/sheet';
import type { Driver, Truck } from './DriverBoardClient';

const ENDORSEMENTS = ['H', 'N', 'T', 'X', 'P', 'S'];

const ENDORSEMENT_LABELS: Record<string, string> = {
  H: 'Hazmat',
  N: 'Tanker',
  T: 'Doubles/Triples',
  X: 'Tanker + Hazmat',
  P: 'Passenger',
  S: 'School Bus',
};

type Props = {
  open: boolean;
  driver: Driver | null;
  trucks: Truck[];
  onClose: () => void;
  onSuccess: () => void;
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 border-b border-border pb-1.5">{title}</p>
      {children}
    </div>
  );
}

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
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0 gap-0">
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <SheetTitle className="font-display text-base">
            {isEdit ? 'Edit Driver' : 'Add Driver'}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {isEdit ? 'Update driver details and truck assignment.' : 'Add a new driver to your fleet roster.'}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
          <Section title="Identity">
            <Field label="Full Name *" error={errors.full_name?.message}>
              <Input
                placeholder="John Smith"
                autoComplete="off"
                disabled={isSubmitting}
                className="h-9"
                {...register('full_name')}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone *" error={errors.phone?.message}>
                <Input
                  placeholder="+1 312 555 0100"
                  autoComplete="off"
                  disabled={isSubmitting}
                  className="h-9"
                  {...register('phone')}
                />
              </Field>
              <Field label="WhatsApp">
                <Input
                  placeholder="Same as phone"
                  autoComplete="off"
                  disabled={isSubmitting}
                  className="h-9"
                  {...register('whatsapp_phone')}
                />
              </Field>
            </div>
          </Section>

          <Section title="License">
            <Field label="CDL Class *" error={errors.cdl_class?.message}>
              <Select
                defaultValue={driver?.cdl_class ?? 'A'}
                onValueChange={(v) => setValue('cdl_class', v as 'A' | 'B' | 'C', { shouldValidate: true })}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Class A — Combination vehicles</SelectItem>
                  <SelectItem value="B">Class B — Heavy straight vehicles</SelectItem>
                  <SelectItem value="C">Class C — Small vehicles</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Endorsements</Label>
              <div className="flex flex-wrap gap-2">
                {ENDORSEMENTS.map((e) => {
                  const active = selectedEndorsements.includes(e);
                  return (
                    <button
                      key={e}
                      type="button"
                      title={ENDORSEMENT_LABELS[e]}
                      onClick={() => toggleEndorsement(e)}
                      disabled={isSubmitting}
                      className={`h-8 w-8 rounded-lg border text-sm font-semibold transition-all ${
                        active
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-input bg-background text-foreground hover:border-primary/50 hover:bg-accent'
                      }`}
                    >
                      {e}
                    </button>
                  );
                })}
              </div>
              {selectedEndorsements.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedEndorsements.map((e) => ENDORSEMENT_LABELS[e]).join(' · ')}
                </p>
              )}
            </div>
          </Section>

          <Section title="Location & Availability">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Home City *" error={errors.home_city?.message}>
                <Input
                  placeholder="Chicago"
                  autoComplete="off"
                  disabled={isSubmitting}
                  className="h-9"
                  {...register('home_city')}
                />
              </Field>
              <Field label="Home State *" error={errors.home_state?.message}>
                <Select
                  defaultValue={driver?.home_state ?? ''}
                  onValueChange={(v) => setValue('home_state', v, { shouldValidate: true })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-9">
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
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="HOS Remaining (hrs)" error={errors.hos_remaining_hours?.message}>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    max={70}
                    step={0.5}
                    disabled={isSubmitting}
                    className="h-9 pr-10"
                    {...register('hos_remaining_hours', { valueAsNumber: true })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">/ 70</span>
                </div>
              </Field>

              <Field label="Status">
                <Select
                  defaultValue={driver?.status ?? 'AVAILABLE'}
                  onValueChange={(v) => setValue('status', v as DriverFormValues['status'], { shouldValidate: true })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="ON_LOAD">On Load</SelectItem>
                    <SelectItem value="OFF_DUTY">Off Duty</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          <Section title="Truck Assignment">
            <Field label="Assigned Truck">
              <Select
                defaultValue={driver?.assigned_truck_id ?? '__none__'}
                onValueChange={(v) => setValue('assigned_truck_id', v === '__none__' ? null : v)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="No truck assigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-muted-foreground">No truck assigned</span>
                  </SelectItem>
                  {availableTrucks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.unit_number} · {t.type.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </Section>
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 border-t border-border bg-background px-6 py-4 space-y-3">
          {submitError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-sm text-destructive">{submitError}</p>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} id="driver-form" />
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="driver-form"
              className="flex-1"
              disabled={isSubmitting}
              onClick={handleSubmit(onSubmit)}
            >
              {isSubmitting
                ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />Saving…</>
                : isEdit ? 'Save Changes' : 'Add Driver'
              }
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
