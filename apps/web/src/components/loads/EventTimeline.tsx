import type { LoadEvent } from './types';

const EVENT_LABELS: Record<string, string> = {
  STATUS_CHANGE: 'changed status',
  ASSIGNED: 'assigned load',
  NOTE: 'note',
};

function actorName(event: LoadEvent): string {
  if (event.actor_type === 'user') return (event as unknown as Record<string, unknown>)['user_full_name'] as string ?? 'Dispatcher';
  if (event.actor_type === 'driver') return (event as unknown as Record<string, unknown>)['driver_full_name'] as string ?? 'Driver';
  if (event.actor_type === 'ai_agent') return 'AI Agent';
  return 'System';
}

function formatEventText(event: LoadEvent): string {
  const actor = actorName(event);
  const meta = event.metadata as Record<string, unknown>;

  if (event.event_type === 'STATUS_CHANGE') {
    return `${actor} • ${event.from_status ?? '?'} → ${event.to_status ?? '?'}`;
  }
  if (event.event_type === 'ASSIGNED') {
    const driver = meta?.['driver_name'] as string | undefined;
    return driver ? `${actor} assigned load to ${driver}` : `${actor} assigned load`;
  }
  if (event.event_type === 'NOTE') {
    const text = meta?.['text'] as string | undefined;
    return text ? `${actor}: ${text}` : `${actor}: note`;
  }
  return `${actor}: ${EVENT_LABELS[event.event_type] ?? event.event_type}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const month = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  const day = d.getUTCDate();
  const h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${month} ${day}, ${hour}:${m} ${ampm}`;
}

export function EventTimeline({ events }: { events: LoadEvent[] }) {
  if (events.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">No events yet.</p>;
  }

  return (
    <ol className="py-2">
      {[...events].reverse().map((event, i, arr) => (
        <li key={event.id} className="relative flex gap-4">
          {/* Connector line */}
          <div className="flex flex-col items-center">
            <div className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-primary bg-card z-10" />
            {i < arr.length - 1 && (
              <div className="w-px flex-1 bg-border mt-1 mb-0 min-h-[20px]" />
            )}
          </div>

          <div className="pb-4 min-w-0">
            <p className="text-sm text-foreground leading-snug">{formatEventText(event)}</p>
            <p className="font-mono-data text-[11px] text-muted-foreground mt-0.5">{formatTime(event.created_at)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
