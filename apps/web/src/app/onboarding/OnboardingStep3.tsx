'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { US_STATES } from '@aitms/shared';
import { z } from 'zod';
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
import type { Step3Draft } from './OnboardingWizard';

const step3Schema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  whatsapp_phone: z.string().optional().nullable(),
  cdl_class: z.enum(['A', 'B', 'C']),
  home_city: z.string().min(1, 'Home city is required'),
  home_state: z.string().length(2, 'Select a state'),
  unit_number: z.string().min(1, 'Unit number is required'),
  truck_type: z.enum(['DRY_VAN', 'REEFER', 'FLATBED', 'STEP_DECK', 'LOWBOY', 'TANKER', 'OTHER']),
});

type Step3Values = z.infer<typeof step3Schema>;

const TRUCK_TYPES = [
  { value: 'DRY_VAN', label: 'Dry Van' },
  { value: 'REEFER', label: 'Reefer' },
  { value: 'FLATBED', label: 'Flatbed' },
  { value: 'STEP_DECK', label: 'Step Deck' },
  { value: 'LOWBOY', label: 'Lowboy' },
  { value: 'TANKER', label: 'Tanker' },
  { value: 'OTHER', label: 'Other' },
] as const;

type Props = {
  draft: Step3Draft;
  onDraftChange: (d: Step3Draft) => void;
  onNext: () => void;
  onBack: () => void;
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
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

export function OnboardingStep3({ draft, onDraftChange, onNext, onBack }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Step3Values>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      cdl_class: (draft.cdl_class as 'A' | 'B' | 'C' | undefined) ?? 'A',
      truck_type: (draft.truck_type as Step3Values['truck_type'] | undefined) ?? 'DRY_VAN',
      full_name: draft.full_name ?? '',
      phone: draft.phone ?? '',
      whatsapp_phone: draft.whatsapp_phone ?? '',
      home_city: draft.home_city ?? '',
      home_state: draft.home_state ?? '',
      unit_number: draft.unit_number ?? '',
    },
  });

  // Keep draft in sync as user types
  const values = watch();
  function saveDraft() {
    onDraftChange({ ...values });
  }

  async function onSubmit(data: Step3Values) {
    onDraftChange({ ...data });
    setIsSubmitting(true);
    setError(null);
    try {
      const truckRes = await fetch('/api/trucks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit_number: data.unit_number, type: data.truck_type }),
      });
      if (!truckRes.ok) {
        const err = await truckRes.json() as { message?: string };
        setError(err.message ?? 'Failed to create truck.');
        return;
      }
      const truck = await truckRes.json() as { id: string };

      const driverRes = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: data.full_name,
          phone: data.phone,
          whatsapp_phone: data.whatsapp_phone || null,
          cdl_class: data.cdl_class,
          home_city: data.home_city,
          home_state: data.home_state,
          assigned_truck_id: truck.id,
          endorsements: [],
        }),
      });
      if (!driverRes.ok) {
        const err = await driverRes.json() as { message?: string };
        setError(err.message ?? 'Failed to create driver.');
        return;
      }

      onNext();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-slate-900">Add your first driver</h1>
        <p className="text-sm text-muted-foreground mt-1">
          You can add more drivers later from the Fleet page.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" onChange={saveDraft}>
        <Section title="Driver">
          <Field label="Full Name *" error={errors.full_name?.message}>
            <Input placeholder="John Smith" autoComplete="off" className="h-9" {...register('full_name')} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone *" error={errors.phone?.message}>
              <Input placeholder="+1 312 555 0100" autoComplete="off" className="h-9" {...register('phone')} />
            </Field>
            <Field label="WhatsApp">
              <Input placeholder="Same as phone" autoComplete="off" className="h-9" {...register('whatsapp_phone')} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="CDL Class *" error={errors.cdl_class?.message}>
              <Select
                defaultValue={draft.cdl_class ?? 'A'}
                onValueChange={(v) => { setValue('cdl_class', v as 'A' | 'B' | 'C', { shouldValidate: true }); saveDraft(); }}
              >
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Class A</SelectItem>
                  <SelectItem value="B">Class B</SelectItem>
                  <SelectItem value="C">Class C</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Home City *" error={errors.home_city?.message}>
              <Input placeholder="Chicago" autoComplete="off" className="h-9" {...register('home_city')} />
            </Field>
            <Field label="Home State *" error={errors.home_state?.message}>
              <Select
                defaultValue={draft.home_state ?? ''}
                onValueChange={(v) => { setValue('home_state', v, { shouldValidate: true }); saveDraft(); }}
              >
                <SelectTrigger className="h-9"><SelectValue placeholder="State" /></SelectTrigger>
                <SelectContent>
                  {US_STATES.map((s) => (
                    <SelectItem key={s.code} value={s.code}>{s.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Section>

        <Section title="Truck">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Unit Number *" error={errors.unit_number?.message}>
              <Input placeholder="T-101" autoComplete="off" className="h-9" {...register('unit_number')} />
            </Field>
            <Field label="Truck Type *" error={errors.truck_type?.message}>
              <Select
                defaultValue={draft.truck_type ?? 'DRY_VAN'}
                onValueChange={(v) => { setValue('truck_type', v as Step3Values['truck_type'], { shouldValidate: true }); saveDraft(); }}
              >
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRUCK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Section>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
          <p className="text-xs text-amber-800">You'll need at least one driver to assign loads.</p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={onBack} type="button" className="text-muted-foreground">
            ← Back
          </Button>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onNext} disabled={isSubmitting}>
              Skip for now
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-28">
              {isSubmitting ? (
                <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />Saving…</>
              ) : 'Next →'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
