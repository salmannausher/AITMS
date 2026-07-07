import Reveal from './Reveal';
import { IconInbox, IconScore, IconTarget, IconConfirm } from './icons';

const steps = [
  {
    n: '01',
    Icon: IconInbox,
    title: 'Broker emails your rate-con',
    description: 'Forward or BCC your inbox to LoadPilot. AI reads the email, extracts every field — origin, destination, rate, dates, commodity. No copy-paste.',
    detail: 'Email · PDF · Attachments',
  },
  {
    n: '02',
    Icon: IconScore,
    title: 'AI scores the load in 10 seconds',
    description: 'GOOD / MARGINAL / AVOID — based on your cost settings, live EIA diesel prices, and your lane history. TypeScript math, Claude judgment.',
    detail: 'Live fuel · Lane history · Your costs',
  },
  {
    n: '03',
    Icon: IconTarget,
    title: 'One click assigns the right driver',
    description: 'LoadPilot ranks available drivers by HOS compliance, equipment match, and deadhead miles. Top 3 picks shown with reasons. Click. Done.',
    detail: 'HOS check · Equipment match · Deadhead',
  },
  {
    n: '04',
    Icon: IconConfirm,
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
          <Reveal variant="left">
            <p className="text-xs font-mono tracking-widest uppercase mb-3" style={{ color: 'var(--amber)' }}>
              How it works
            </p>
          </Reveal>
          <Reveal variant="blur" delay={100}>
            <h2 className="font-display text-4xl md:text-5xl font-800 leading-tight" style={{ color: '#FFFFFF' }}>
              Broker email → WhatsApp confirm<br />
              <span style={{ color: 'var(--amber)' }}>in under 60 seconds.</span>
            </h2>
          </Reveal>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 top-8 bottom-8 w-px hidden md:block" style={{ background: 'var(--border)' }} />

          <div className="space-y-2">
            {steps.map((step, i) => (
              <Reveal key={step.n} variant={i % 2 === 0 ? 'left' : 'right'} delay={80}>
                <div className="flex gap-6 items-start p-6 rounded-xl border transition-all card-hover"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>

                  {/* Icon node on the timeline */}
                  <div className="flex-shrink-0 relative z-10">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center border"
                      style={{
                        background: 'linear-gradient(145deg, var(--surface-3), var(--bg))',
                        borderColor: 'rgba(249,115,22,0.35)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px rgba(249,115,22,0.10)',
                      }}
                    >
                      <step.Icon size={30} />
                    </div>
                    <div
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-700 border"
                      style={{ background: 'var(--bg)', borderColor: 'var(--amber)', color: 'var(--amber)' }}
                    >
                      {step.n}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <h3 className="font-display font-700 text-lg mb-2" style={{ color: '#FFFFFF' }}>
                          {step.title}
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
              </Reveal>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
