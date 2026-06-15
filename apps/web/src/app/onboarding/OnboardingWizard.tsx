'use client';

import { useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OnboardingStep1 } from './OnboardingStep1';
import { OnboardingStep2 } from './OnboardingStep2';
import { OnboardingStep3 } from './OnboardingStep3';
import { OnboardingStep4 } from './OnboardingStep4';

const TOTAL_STEPS = 4;

const STEP_LABELS = [
  'Company Info',
  'Cost Settings',
  'Add Driver',
  'Connect Email',
];

export type Step3Draft = {
  full_name?: string;
  phone?: string;
  whatsapp_phone?: string | null;
  cdl_class?: 'A' | 'B' | 'C';
  home_city?: string;
  home_state?: string;
  unit_number?: string;
  truck_type?: string;
};

function WizardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = Math.min(Math.max(Number(searchParams.get('step') ?? '1'), 1), TOTAL_STEPS);
  // Persists step 3 draft across back/next without re-mounting
  const step3Draft = useRef<Step3Draft>({});

  function setStep(n: number) {
    router.push(`/onboarding?step=${n}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-border px-6 py-4 flex items-center gap-4">
        <div className="font-display text-base font-bold" style={{ color: '#003d9b' }}>
          Dispatcher Hub
        </div>
        <div className="text-sm text-muted-foreground">— Setup Wizard</div>
      </header>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-700">
                Step {step} of {TOTAL_STEPS} — {STEP_LABELS[step - 1]}
              </p>
              <p className="text-xs text-muted-foreground">{Math.round((step / TOTAL_STEPS) * 100)}%</p>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%`, backgroundColor: '#003d9b' }}
              />
            </div>
            <div className="flex gap-2 mt-3">
              {STEP_LABELS.map((label, i) => (
                <div key={label} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="h-2 w-2 rounded-full mx-auto transition-colors"
                    style={{ backgroundColor: i + 1 <= step ? '#003d9b' : '#e2e8f0' }}
                  />
                  <p className="text-[10px] text-center text-muted-foreground hidden sm:block">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step panels */}
          {step === 1 && <OnboardingStep1 onNext={() => setStep(2)} />}
          {step === 2 && <OnboardingStep2 onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && (
            <OnboardingStep3
              draft={step3Draft.current}
              onDraftChange={(d) => { step3Draft.current = d; }}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && <OnboardingStep4 onBack={() => setStep(3)} />}
        </div>
      </div>
    </div>
  );
}

export function OnboardingWizard() {
  return (
    <Suspense>
      <WizardInner />
    </Suspense>
  );
}
