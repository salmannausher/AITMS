'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';

interface CounterOfferPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedRate: number;
  origin: string;
  dest: string;
  pickupDate: string;
}

export function CounterOfferPanel({
  open,
  onOpenChange,
  suggestedRate,
  origin,
  dest,
  pickupDate,
}: CounterOfferPanelProps) {
  const [rate, setRate] = useState(suggestedRate);
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(pickupDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const copyText = `Counteroffer: $${rate.toLocaleString()} for ${origin} → ${dest}, pickup ${formattedDate}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Counter Offer</SheetTitle>
          <SheetClose className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
            ✕
          </SheetClose>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Counteroffer Rate ($)
            </label>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-600 font-mono break-all">
            {copyText}
          </div>

          <button
            onClick={handleCopy}
            className="w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>

          <p className="text-xs text-gray-400">
            Paste this into your broker communication. Full broker email integration coming in
            v0.5.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
