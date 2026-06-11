'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { AppNotification } from '@aitms/shared';
import type { Load } from './useLoads';

const MAX_NOTIFICATIONS = 20;

function makeId() {
  return Math.random().toString(36).slice(2);
}

export function useNotifications(companyId: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const dismissedIds = useRef<Set<string>>(new Set());

  function addNotification(n: Omit<AppNotification, 'id' | 'timestamp'>) {
    const notification: AppNotification = {
      ...n,
      id: makeId(),
      timestamp: new Date(),
    };

    setNotifications((prev) => {
      const next = [notification, ...prev];
      if (next.length <= MAX_NOTIFICATIONS) return next;
      // evict oldest non-persistent when over limit
      const persistentCount = next.filter((x) => x.persistent).length;
      if (persistentCount >= MAX_NOTIFICATIONS) return next.slice(0, MAX_NOTIFICATIONS);
      // find last non-persistent and remove it
      const lastTransientIdx = [...next].reverse().findIndex((x) => !x.persistent);
      if (lastTransientIdx === -1) return next.slice(0, MAX_NOTIFICATIONS);
      const removeAt = next.length - 1 - lastTransientIdx;
      return next.filter((_, i) => i !== removeAt);
    });

    if (!n.persistent) {
      if (n.type === 'NEW_LOAD') {
        toast(n.message, { duration: 5000 });
      } else if (n.type === 'DRIVER_NO_REPLY') {
        toast.error(n.message, { duration: 10000 });
      }
    }

    return notification;
  }

  // Stable callback passed to useLoadsBoardRealtime via onNotificationEvent
  const onLoadEvent = useCallback(
    (payload: RealtimePostgresChangesPayload<Load>) => {
      if (payload.eventType === 'INSERT') {
        const row = payload.new;
        if (row.status === 'PENDING') {
          addNotification({
            type: 'NEW_LOAD',
            message: `New load: ${row.origin_city}, ${row.origin_state} → ${row.dest_city}, ${row.dest_state}`,
            loadId: row.id,
            persistent: false,
          });
        }
      } else if (payload.eventType === 'UPDATE') {
        const next = payload.new;
        const prev = payload.old as Partial<Load>;
        if (next.needs_review === true && prev.needs_review === false) {
          addNotification({
            type: 'NEEDS_REVIEW',
            message: `Load needs review: low confidence parse — ${next.origin_city} → ${next.dest_city}`,
            loadId: next.id,
            persistent: true,
          });
        }
        // Clear NEEDS_REVIEW notifications when needs_review flips back to false
        if (next.needs_review === false && prev.needs_review === true) {
          setNotifications((prev) =>
            prev.filter((n) => !(n.type === 'NEEDS_REVIEW' && n.loadId === next.id)),
          );
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Separate broadcast channel for backend-emitted driver alerts
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`alerts:company:${companyId}`)
      .on('broadcast', { event: 'driver_no_reply' }, (payload) => {
        const p = payload.payload as {
          driverName: string;
          origin: string;
          dest: string;
          loadId: string;
          driverId: string;
        };
        addNotification({
          type: 'DRIVER_NO_REPLY',
          message: `Driver ${p.driverName} hasn't replied — ${p.origin} → ${p.dest}`,
          loadId: p.loadId,
          driverId: p.driverId,
          persistent: true,
        });
      })
      .on('broadcast', { event: 'dispatch_ready' }, (payload) => {
        const p = payload.payload as {
          loadId: string;
          driverCount: number;
          origin: string;
          dest: string;
        };
        addNotification({
          type: 'DISPATCH_READY',
          message: `${p.driverCount} driver${p.driverCount === 1 ? '' : 's'} ranked for ${p.origin} → ${p.dest}`,
          loadId: p.loadId,
          persistent: false,
        });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  function dismissNotification(id: string) {
    dismissedIds.current.add(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function clearTransient() {
    setNotifications((prev) => prev.filter((n) => n.persistent));
  }

  return { notifications, onLoadEvent, dismissNotification, clearTransient };
}
