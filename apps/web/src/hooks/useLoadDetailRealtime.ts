'use client';

import { useEffect, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * Subscribes to Supabase postgres_changes for a single load row.
 * Calls onUpdate whenever the row changes (e.g. driver_rankings added).
 * Caller is responsible for re-fetching the full load on update.
 */
export function useLoadDetailRealtime(loadId: string, companyId: string, onUpdate: () => void) {
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`load-detail:${loadId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'loads',
          filter: `id=eq.${loadId}`,
        },
        () => {
          onUpdateRef.current();
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          setTimeout(() => channel.subscribe(), 3000);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadId, companyId]);
}
