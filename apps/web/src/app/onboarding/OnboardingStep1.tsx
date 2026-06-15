'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { US_STATES } from '@aitms/shared';
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

const step1Schema = z.object({
  mc_number: z.string().optional(),
  dot_number: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'Select a state'),
});

type Step1Values = z.infer<typeof step1Schema>;

type Props = { onNext: () => void };

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function OnboardingStep1({ onNext }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultState, setDefaultState] = useState<string>('');

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
  });

  // Pre-fill from saved company data when navigating back
  useEffect(() => {
    fetch('/api/companies/me')
      .then((r) => r.json())
      .then((d: { mc_number?: string | null; dot_number?: string | null; address?: { city?: string; state?: string } }) => {
        const vals: Partial<Step1Values> = {};
        if (d.mc_number) vals.mc_number = d.mc_number;
        if (d.dot_number) vals.dot_number = d.dot_number;
        if (d.address?.city) vals.city = d.address.city;
        if (d.address?.state) {
          vals.state = d.address.state;
          setDefaultState(d.address.state);
        }
        if (Object.keys(vals).length > 0) reset(vals);
      })
      .catch(() => null);
  }, [reset]);

  async function onSubmit(data: Step1Values) {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/companies/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        setError(err.message ?? 'Failed to save. Please try again.');
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
        <h1 className="text-lg font-bold text-slate-900">Tell us about your company</h1>
        <p className="text-sm text-muted-foreground mt-1">
          This information is used to personalise your dispatch experience.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="MC Number" error={errors.mc_number?.message}>
            <Input placeholder="MC-XXXXXX" autoComplete="off" className="h-9" {...register('mc_number')} />
          </Field>
          <Field label="DOT Number" error={errors.dot_number?.message}>
            <Input placeholder="1234567" autoComplete="off" className="h-9" {...register('dot_number')} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Home City *" error={errors.city?.message}>
            <Input placeholder="Chicago" autoComplete="off" className="h-9" {...register('city')} />
          </Field>
          <Field label="Home State *" error={errors.state?.message}>
            <Select
              key={defaultState}
              defaultValue={defaultState || undefined}
              onValueChange={(v) => setValue('state', v, { shouldValidate: true })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((s) => (
                  <SelectItem key={s.code} value={s.code}>{s.code} — {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting} className="min-w-28">
            {isSubmitting ? (
              <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />Saving…</>
            ) : 'Next →'}
          </Button>
        </div>
      </form>
    </div>
  );
}
