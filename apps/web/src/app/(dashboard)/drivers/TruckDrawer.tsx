'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTruckSchema, type CreateTruckInput } from '@aitms/shared';
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
import type { Truck } from './DriverBoardClient';

const TRUCK_TYPE_OPTIONS = [
  { value: 'DRY_VAN', label: 'Dry Van' },
  { value: 'REEFER', label: 'Reefer' },
  { value: 'FLATBED', label: 'Flatbed' },
  { value: 'STEP_DECK', label: 'Step Deck' },
  { value: 'LOWBOY', label: 'Lowboy' },
  { value: 'TANKER', label: 'Tanker' },
  { value: 'OTHER', label: 'Other' },
] as const;

type Props = {
  open: boolean;
  truck: Truck | null;
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

export function TruckDrawer({ open, truck, onClose, onSuccess }: Props) {
  const isEdit = truck !== null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateTruckInput>({
    resolver: zodResolver(createTruckSchema),
  });

  useEffect(() => {
    if (open) {
      setSubmitError(null);
      reset({
        unit_number: truck?.unit_number ?? '',
        type: truck?.type ?? 'DRY_VAN',
        year: truck?.year ?? undefined,
        make: truck?.make ?? '',
        model: truck?.model ?? '',
        vin: truck?.vin ?? '',
      });
    }
  }, [open, truck, reset]);

  async function onSubmit(data: CreateTruckInput) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const url = isEdit ? `/api/trucks/${truck.id}` : '/api/trucks';
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
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <SheetTitle className="font-display text-base">
            {isEdit ? 'Edit Truck' : 'Add Truck'}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {isEdit ? 'Update truck details and specifications.' : 'Add a new truck to your fleet.'}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
          <Section title="Identity">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Unit Number *" error={errors.unit_number?.message}>
                <Input
                  placeholder="T-101"
                  autoComplete="off"
                  disabled={isSubmitting}
                  className="h-9"
                  {...register('unit_number')}
                />
              </Field>

              <Field label="Truck Type *" error={errors.type?.message}>
                <Select
                  defaultValue={truck?.type ?? 'DRY_VAN'}
                  onValueChange={(v) => setValue('type', v as CreateTruckInput['type'], { shouldValidate: true })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRUCK_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          <Section title="Specifications">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Year" error={errors.year?.message}>
                <Input
                  type="number"
                  min={1980}
                  max={2030}
                  placeholder="2022"
                  disabled={isSubmitting}
                  className="h-9"
                  {...register('year', { valueAsNumber: true })}
                />
              </Field>
              <Field label="Make">
                <Input
                  placeholder="Kenworth"
                  autoComplete="off"
                  disabled={isSubmitting}
                  className="h-9"
                  {...register('make')}
                />
              </Field>
              <Field label="Model">
                <Input
                  placeholder="T680"
                  autoComplete="off"
                  disabled={isSubmitting}
                  className="h-9"
                  {...register('model')}
                />
              </Field>
            </div>

            <Field label="VIN">
              <Input
                placeholder="1XKDD49X4MJ123456"
                autoComplete="off"
                disabled={isSubmitting}
                className="h-9 font-mono text-sm tracking-wider"
                {...register('vin')}
              />
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
          <form onSubmit={handleSubmit(onSubmit)} id="truck-form" />
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
              form="truck-form"
              className="flex-1"
              disabled={isSubmitting}
              onClick={handleSubmit(onSubmit)}
            >
              {isSubmitting
                ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />Saving…</>
                : isEdit ? 'Save Changes' : 'Add Truck'
              }
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
