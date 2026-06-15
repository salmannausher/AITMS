'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CostSettingsForm } from '@/app/(dashboard)/settings/costs/CostSettingsForm';
import type { CarrierCostSettings } from '@aitms/shared';

type Props = { onNext: () => void; onBack: () => void };

export function OnboardingStep2({ onNext, onBack }: Props) {
  const [initialValues, setInitialValues] = useState<CarrierCostSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/companies/settings')
      .then((r) => r.json())
      .then((d: { costs: CarrierCostSettings | null }) => setInitialValues(d.costs))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-slate-900">Set your cost basis</h1>
        <p className="text-sm text-muted-foreground mt-1">
          The AI uses these to score loads as Good, Marginal, or Avoid.
        </p>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <CostSettingsForm initialValues={initialValues} isOwner={true} onSuccess={onNext} />
      )}

      <div className="mt-6 pt-4 border-t border-border">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
          ← Back
        </Button>
      </div>
    </div>
  );
}
