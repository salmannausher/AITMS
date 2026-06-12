import type { LoadEvent } from './types';

// ── Actor display ─────────────────────────────────────────────────────────────

function actorLabel(event: LoadEvent, currentUserId: string): string {
  const t = event.actor_type?.toUpperCase();
  if (t === 'USER' || t === 'user') {
    if (event.actor_id === currentUserId) return 'You';
    return event.actor_name ?? 'Dispatcher';
  }
  if (t === 'AI_AGENT' || t === 'ai_agent') return 'AI Agent';
  if (t === 'DRIVER' || t === 'driver') return event.actor_name ?? 'Driver';
  return 'System';
}

// ── Event description ─────────────────────────────────────────────────────────

function eventDescription(event: LoadEvent): string {
  const meta = (event.metadata as Record<string, unknown> | null) ?? {};

  switch (event.event_type) {
    case 'CREATED':
      return 'Load created';
    case 'SCORED':
      return `AI scored load as ${(meta['score'] as string | undefined) ?? 'unknown'}`;
    case 'STATUS_CHANGE':
    case 'ACCEPTED':
      return 'Load accepted';
    case 'ASSIGNED': {
      const name = (meta['driver_name'] as string | undefined) ?? 'driver';
      return `Assigned to ${name}`;
    }
    case 'AT_PICKUP':
      return 'Driver arrived at pickup';
    case 'LOADED':
      return 'Freight loaded';
    case 'EN_ROUTE':
      return 'En route to delivery';
    case 'DELIVERED': {
      const hasPod = !!(meta['pod_url'] as string | undefined);
      return hasPod ? 'Delivered · POD uploaded' : 'Delivered';
    }
    case 'CANCELLED':
      return 'Load cancelled';
    case 'NEEDS_REVIEW':
      return 'Flagged for review';
    case 'NOTE': {
      const text = meta['text'] as string | undefined;
      return text ? `Note: ${text}` : 'Note';
    }
    default:
      return event.event_type;
  }
}

// ── Dot color ─────────────────────────────────────────────────────────────────

function dotColor(eventType: string): string {
  if (
    [
      'DELIVERED',
      'LOADED',
      'EN_ROUTE',
      'ACCEPTED',
      'ASSIGNED',
      'AT_PICKUP',
      'SCORED',
      'CREATED',
    ].includes(eventType)
  ) {
    return '#16a34a'; // green
  }
  if (['CANCELLED'].includes(eventType)) return '#dc2626'; // red
  return '#d97706'; // amber — NEEDS_REVIEW, STATUS_CHANGE, NOTE
}

// ── Timestamp ─────────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  events: LoadEvent[];
  currentUserId: string;
}

export function EventTimeline({ events, currentUserId }: Props) {
  if (events.length === 0) {
    return <p className="py-4 text-sm text-gray-400">No events yet.</p>;
  }

  // newest first
  const sorted = [...events].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <ol className="relative space-y-0 py-2">
      {/* vertical line */}
      <div className="absolute left-[5px] top-4 bottom-4 w-px bg-gray-200" aria-hidden />

      {sorted.map((event) => {
        const meta = (event.metadata as Record<string, unknown> | null) ?? {};
        const podUrl = meta['pod_url'] as string | undefined;
        const actor = actorLabel(event, currentUserId);
        const desc = eventDescription(event);

        return (
          <li key={event.id} className="flex gap-3 pb-4 last:pb-0">
            {/* dot */}
            <span
              className="relative z-10 mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ring-2 ring-white"
              style={{ backgroundColor: dotColor(event.event_type) }}
            />
            <div className="min-w-0">
              <p className="text-sm text-gray-800">
                <span className="font-medium">{actor}</span>
                {' · '}
                {desc}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-400">{formatTime(event.created_at)}</p>
                {podUrl && (
                  <a
                    href={podUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View POD
                  </a>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
