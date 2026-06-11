'use client';

import { useRouter } from 'next/navigation';
import type { AppNotification } from '@aitms/shared';

interface NeedsReviewBannerProps {
  notifications: AppNotification[];
}

export function NeedsReviewBanner({ notifications }: NeedsReviewBannerProps) {
  const router = useRouter();
  const reviewNotifications = notifications.filter((n) => n.type === 'NEEDS_REVIEW');

  if (reviewNotifications.length === 0) return null;

  const count = reviewNotifications.length;

  return (
    <button
      onClick={() => router.push('/dashboard?filter=needs_review')}
      className="flex w-full items-center gap-2 border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-left text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors"
    >
      <span className="text-base">⚠</span>
      <span>
        {count} load{count !== 1 ? 's' : ''} need manual review — AI confidence was low.
      </span>
      <span className="ml-auto text-xs font-normal text-amber-600 underline">View loads →</span>
    </button>
  );
}
