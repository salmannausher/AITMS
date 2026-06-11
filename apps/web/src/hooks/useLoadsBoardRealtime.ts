'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Load } from './useLoads';

export function useLoadsBoardRealtime(
  companyId: string,
  onLoadChange: (payload: RealtimePostgresChangesPayload<Load>) => void,
  onNotificationEvent?: (payload: RealtimePostgresChangesPayload<Load>) => void,
): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const onLoadChangeRef = useRef(onLoadChange);
  const onNotificationEventRef = useRef(onNotificationEvent);

  useEffect(() => {
    onLoadChangeRef.current = onLoadChange;
  }, [onLoadChange]);

  useEffect(() => {
    onNotificationEventRef.current = onNotificationEvent;
  }, [onNotificationEvent]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`loads:company:${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loads',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          onLoadChangeRef.current(payload as RealtimePostgresChangesPayload<Load>);
          onNotificationEventRef.current?.(payload as RealtimePostgresChangesPayload<Load>);
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConnected(true);
        if (status === 'CHANNEL_ERROR') {
          setConnected(false);
          setTimeout(() => channel.subscribe(), 3000);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [companyId]);

  return { connected };
}
