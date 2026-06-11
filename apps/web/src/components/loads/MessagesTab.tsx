import type { LoadMessage } from './types';

const DIRECTION_STYLES = {
  INBOUND: { label: 'Inbound', bg: '#f3f4f6', color: '#374151' },
  OUTBOUND: { label: 'Outbound', bg: '#dbeafe', color: '#1d4ed8' },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function MessagesTab({ messages }: { messages: LoadMessage[] }) {
  if (messages.length === 0) {
    return <p className="py-4 text-sm text-gray-400">No messages on this load yet.</p>;
  }

  return (
    <ol className="space-y-3 py-2">
      {messages.map((msg) => {
        const style = DIRECTION_STYLES[msg.direction];
        return (
          <li key={msg.id} className="rounded-md border border-gray-100 p-3 text-sm">
            <div className="mb-1 flex items-center gap-2">
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ backgroundColor: style.bg, color: style.color }}
              >
                {style.label}
              </span>
              <span className="text-[10px] text-gray-400">{msg.channel}</span>
              <span className="ml-auto text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{msg.body}</p>
          </li>
        );
      })}
    </ol>
  );
}
