'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { LoadDetail } from './types';

interface Action {
  label: string;
  nextStatus: string;
  requiresPod: boolean;
}

const STATUS_ACTIONS: Record<string, Action> = {
  ASSIGNED: { label: 'Mark At Pickup', nextStatus: 'AT_PICKUP', requiresPod: false },
  AT_PICKUP: { label: 'Mark Loaded', nextStatus: 'LOADED', requiresPod: false },
  LOADED: { label: 'Mark En Route', nextStatus: 'EN_ROUTE', requiresPod: false },
  EN_ROUTE: {
    label: 'Mark Delivered + Collect POD',
    nextStatus: 'DELIVERED',
    requiresPod: true,
  },
};

interface Props {
  load: LoadDetail;
  currentUserId: string;
  onStatusChange: (updated: LoadDetail) => void;
}

async function patchStatus(loadId: string, status: string, podUrl?: string): Promise<LoadDetail> {
  const res = await fetch(`/api/loads/${loadId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, ...(podUrl ? { pod_url: podUrl } : {}) }),
  });
  const data = (await res.json()) as LoadDetail & { message?: string };
  if (!res.ok) throw new Error(data.message ?? res.statusText);
  return data;
}

// ── Delivery sheet ────────────────────────────────────────────────────────────

function DeliverySheet({
  open,
  onClose,
  load,
  onStatusChange,
}: {
  open: boolean;
  onClose: () => void;
  load: LoadDetail;
  onStatusChange: (updated: LoadDetail) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleConfirm() {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      // Bucket 'pods' must be created in Supabase Dashboard with public=false
      const supabase = createSupabaseBrowserClient();
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'pdf';
      const path = `${load.company_id}/${load.id}/pod.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('pods')
        .upload(path, file, { upsert: true });

      if (uploadError) {
        toast.error('Failed to upload POD document');
        setError(uploadError.message);
        return;
      }

      const { data: signedData, error: signedError } = await supabase.storage
        .from('pods')
        .createSignedUrl(path, 60 * 60 * 24 * 7); // 7-day TTL

      if (signedError || !signedData?.signedUrl) {
        toast.error('Failed to get signed URL for POD');
        setError(signedError?.message ?? 'Unknown error');
        return;
      }

      const updated = await patchStatus(load.id, 'DELIVERED', signedData.signedUrl);
      onStatusChange(updated);
      onClose();
      toast.success('Load marked as delivered');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Confirm Delivery</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-6 py-4">
          <p className="text-sm text-gray-600">
            Upload the Proof of Delivery document to mark this load as delivered.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">POD Document</label>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-gray-200"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setError(null);
              }}
            />
            {file && <p className="mt-1 text-xs text-gray-500 truncate">{file.name}</p>}
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
              Uploading…
            </div>
          )}

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <Button disabled={!file || uploading} onClick={() => void handleConfirm()}>
            {uploading ? 'Uploading…' : 'Confirm Delivery'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function StatusProgressionPanel({
  load,
  currentUserId: _currentUserId,
  onStatusChange,
}: Props) {
  const action = STATUS_ACTIONS[load.status];
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!action) return null;

  const resolvedAction = action;

  async function handleSimpleTransition() {
    if (loading) return;
    setLoading(true);
    try {
      const updated = await patchStatus(load.id, resolvedAction.nextStatus);
      onStatusChange(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 flex items-center gap-3">
      {action.requiresPod ? (
        <>
          <Button onClick={() => setSheetOpen(true)} disabled={loading}>
            {action.label}
          </Button>
          <DeliverySheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            load={load}
            onStatusChange={onStatusChange}
          />
        </>
      ) : (
        <Button onClick={() => void handleSimpleTransition()} disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Updating…
            </span>
          ) : (
            action.label
          )}
        </Button>
      )}
    </div>
  );
}
