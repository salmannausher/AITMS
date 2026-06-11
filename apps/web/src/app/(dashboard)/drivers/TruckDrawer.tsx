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
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Truck' : 'Add Truck'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          {/* Unit number */}
          <div className="space-y-1">
            <Label htmlFor="unit_number">Unit Number *</Label>
            <Input id="unit_number" placeholder="T-101" disabled={isSubmitting} {...register('unit_number')} />
            {errors.unit_number && <p className="text-sm text-destructive">{errors.unit_number.message}</p>}
          </div>

          {/* Type */}
          <div className="space-y-1">
            <Label>Truck Type *</Label>
            <Select
              defaultValue={truck?.type ?? 'DRY_VAN'}
              onValueChange={(v) => setValue('type', v as CreateTruckInput['type'], { shouldValidate: true })}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRUCK_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
          </div>

          {/* Year / Make / Model */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min={1980}
                max={2030}
                placeholder="2022"
                disabled={isSubmitting}
                {...register('year', { valueAsNumber: true })}
              />
              {errors.year && <p className="text-sm text-destructive">{errors.year.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="make">Make</Label>
              <Input id="make" placeholder="Kenworth" disabled={isSubmitting} {...register('make')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="model">Model</Label>
              <Input id="model" placeholder="T680" disabled={isSubmitting} {...register('model')} />
            </div>
          </div>

          {/* VIN */}
          <div className="space-y-1">
            <Label htmlFor="vin">VIN</Label>
            <Input id="vin" placeholder="1XKDD49X4MJ123456" disabled={isSubmitting} {...register('vin')} />
          </div>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Truck'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
