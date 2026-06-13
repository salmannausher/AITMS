const steps = [
  {
    n: '01',
    emoji: '📨',
    title: 'Broker emails your rate-con',
    description: 'Forward or BCC your inbox to LoadPilot. AI reads the email, extracts every field — origin, destination, rate, dates, commodity. No copy-paste.',
    detail: 'Email · PDF · Attachments',
  },
  {
    n: '02',
    emoji: '⚡',
    title: 'AI scores the load in 10 seconds',
    description: 'GOOD / MARGINAL / AVOID — based on your cost settings, live EIA diesel prices, and your lane history. TypeScript math, Claude judgment.',
    detail: 'Live fuel · Lane history · Your costs',
  },
  {
    n: '03',
    emoji: '👆',
    title: 'One click assigns the right driver',
    description: 'LoadPilot ranks available drivers by HOS compliance, equipment match, and deadhead miles. Top 3 picks shown with reasons. Click. Done.',
    detail: 'HOS check · Equipment match · Deadhead',
  },
  {
    n: '04',
    emoji: '💬',
    title: 'Driver confirms on WhatsApp',
    description: 'Your driver gets a WhatsApp with all load details the moment you assign them. They reply YES or NO. Load board updates in real-time.',
    detail: 'WhatsApp · SMS fallback · Auto-update',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-6" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="max-w-5xl mx-auto">

        <div className="mb-14">
          <p className="text-xs font-mono tracking-widest uppercase mb-3" style={{ color: 'var(--amber)' }}>
            How it works
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-800 leading-tight" style={{ color: '#FFFFFF' }}>
            Broker email → WhatsApp confirm<br />
            <span style={{ color: 'var(--amber)' }}>in under 60 seconds.</span>
          </h2>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-6 bottom-6 w-px hidden md:block" style={{ background: 'var(--border)' }} />

          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={step.n} className="flex gap-6 items-start p-6 rounded-xl border transition-all card-hover"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>

                {/* Number node */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm font-700 border z-10"
                  style={{ background: 'var(--bg)', borderColor: 'var(--amber)', color: 'var(--amber)' }}>
                  {step.n}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="font-display font-700 text-lg mb-2" style={{ color: 'var(--text)' }}>
                        {step.emoji} {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed max-w-lg" style={{ color: 'var(--text-muted)' }}>
                        {step.description}
                      </p>
                    </div>
                    <div className="font-mono text-xs px-3 py-1.5 rounded border whitespace-nowrap flex-shrink-0"
                      style={{ borderColor: 'var(--border-lit)', color: 'var(--text-muted)', background: 'var(--surface-2)' }}>
                      {step.detail}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
