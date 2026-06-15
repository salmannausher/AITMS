'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type Props = { onBack: () => void };

export function OnboardingStep4({ onBack }: Props) {
  const router = useRouter();
  const [inboundEmail, setInboundEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetch('/api/companies/me')
      .then((r) => r.json())
      .then((d: { inbound_email?: string | null }) => setInboundEmail(d.inbound_email ?? null))
      .catch(() => null);
  }, []);

  async function handleCopy() {
    if (!inboundEmail) return;
    await navigator.clipboard.writeText(inboundEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSendTest() {
    setTestStatus('sending');
    try {
      const res = await fetch('/api/companies/onboarding/test-email', { method: 'POST' });
      setTestStatus(res.ok ? 'sent' : 'error');
    } catch {
      setTestStatus('error');
    }
  }

  async function handleComplete() {
    setCompleting(true);
    try {
      await fetch('/api/companies/onboarding/complete', { method: 'POST' });
      router.push('/dashboard');
    } catch {
      setCompleting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-slate-900">Your dedicated dispatch inbox</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Forward broker emails here, or add it as a CC to your broker communications.
          Every rate confirmation sent here will be automatically parsed and scored.
        </p>
      </div>

      {/* Email chip */}
      <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-border px-4 py-3 mb-6">
        {inboundEmail ? (
          <>
            <span className="flex-1 font-mono text-sm text-slate-800 truncate">{inboundEmail}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <span className="text-green-600 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Copied
                </span>
              ) : 'Copy'}
            </Button>
          </>
        ) : (
          <span className="text-sm text-muted-foreground italic">No inbox configured — contact support.</span>
        )}
      </div>

      {/* Send test email */}
      <div className="rounded-xl border border-border bg-slate-50/50 px-4 py-4 mb-6 space-y-3">
        <p className="text-sm font-medium text-slate-700">Test your inbox</p>
        <p className="text-xs text-muted-foreground">
          Send a sample rate confirmation to verify end-to-end parsing works before you go live.
        </p>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSendTest}
            disabled={testStatus === 'sending' || testStatus === 'sent'}
          >
            {testStatus === 'sending' ? (
              <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />Sending…</>
            ) : testStatus === 'sent' ? (
              <span className="text-green-600 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Sent!
              </span>
            ) : 'Send Test Email'}
          </Button>
          {testStatus === 'sent' && (
            <p className="text-xs text-green-700">Check your Inngest dashboard for the incoming event.</p>
          )}
          {testStatus === 'error' && (
            <p className="text-xs text-destructive">Failed to send — you can skip this and test later.</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
          ← Back
        </Button>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={handleComplete} disabled={completing}>
            Skip — set up later
          </Button>
          <Button onClick={handleComplete} disabled={completing} className="min-w-36">
            {completing ? (
              <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />Setting up…</>
            ) : 'Complete Setup →'}
          </Button>
        </div>
      </div>
    </div>
  );
}
