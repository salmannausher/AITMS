const features = [
  {
    icon: '⚡',
    iconBg: 'linear-gradient(135deg, #92400e, #f97316)',
    title: 'AI Load Scoring',
    description: (
      <>
        Every load auto-scored{' '}
        <span style={{ color: '#4ADE80', fontWeight: 600 }}>GOOD</span>,{' '}
        <span style={{ color: '#FBBF24', fontWeight: 600 }}>MARGINAL</span>, or{' '}
        <span style={{ color: '#F87171', fontWeight: 600 }}>AVOID</span>.
        {' '}Your costs + live diesel + lane history. Claude makes the call in seconds.
      </>
    ),
    accentColor: '#F97316',
  },
  {
    icon: '🚛',
    iconBg: 'linear-gradient(135deg, #065f46, #10b981)',
    title: 'Smart Driver Ranking',
    description: 'AI ranks available drivers by HOS hours, equipment type, and deadhead miles. Top 3 with reasons. Override anytime.',
    accentColor: '#10B981',
  },
  {
    icon: '💬',
    iconBg: 'linear-gradient(135deg, #064e3b, #34d399)',
    title: 'WhatsApp Dispatch',
    description: 'One click sends a WhatsApp with full load details. Driver replies YES or NO. Load board updates automatically. No calls.',
    accentColor: '#34D399',
  },
  {
    icon: '📊',
    iconBg: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
    title: 'Live Load Board',
    description: 'Kanban board from PENDING to DELIVERED. Supabase Realtime — updates the moment anything changes. No refresh.',
    accentColor: '#3B82F6',
  },
  {
    icon: '📄',
    iconBg: 'linear-gradient(135deg, #4c1d95, #8b5cf6)',
    title: 'Rate-Con Parser',
    description: 'Forward any broker email or PDF. LoadPilot extracts origin, destination, rate, dates, commodity automatically. 95%+ accuracy.',
    accentColor: '#8B5CF6',
  },
  {
    icon: '📈',
    iconBg: 'linear-gradient(135deg, #7f1d1d, #ef4444)',
    title: 'RPM Analytics',
    description: 'Track revenue per mile, fuel costs, and profit per load. See which lanes win and which to avoid next time.',
    accentColor: '#EF4444',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 px-6" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="max-w-5xl mx-auto">

        <div className="mb-14">
          <p className="text-xs font-mono tracking-widest uppercase mb-3" style={{ color: 'var(--amber)' }}>
            Features
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-800 leading-tight" style={{ color: '#FFFFFF' }}>
            Built for carriers with<br />1–100 trucks.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="rounded-2xl p-6 border flex flex-col gap-4 card-hover cursor-default"
              style={{
                background: 'var(--surface-2)',
                borderColor: i === 0 ? f.accentColor + '60' : 'var(--border)',
              }}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: f.iconBg }}
              >
                {f.icon}
              </div>

              {/* Text */}
              <div className="flex-1">
                <h3
                  className="font-display font-700 text-lg mb-2 leading-snug"
                  style={{ color: '#FFFFFF' }}
                >
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {f.description}
                </p>
              </div>

              {/* Accent line */}
              <div className="h-0.5 w-10 rounded-full" style={{ background: f.accentColor }} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
