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
    return `${actor} changed status: ${event.from_status ?? '?'} → ${event.to_status ?? '?'}`;
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
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function EventTimeline({ events }: { events: LoadEvent[] }) {
  if (events.length === 0) {
    return <p className="py-4 text-sm text-gray-400">No events yet.</p>;
  }

  return (
    <ol className="space-y-3 py-2">
      {[...events].reverse().map((event) => (
        <li key={event.id} className="flex gap-3 text-sm">
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gray-300" />
          <div>
            <p className="text-gray-800">{formatEventText(event)}</p>
            <p className="text-xs text-gray-400">{formatTime(event.created_at)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
