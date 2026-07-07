import Reveal from './Reveal';

const CALENDLY_URL = 'https://calendly.com/YOUR_LINK';

const starterFeatures = [
  '1 dispatcher seat',
  'Up to 10 trucks',
  'Unlimited load scoring',
  'WhatsApp dispatch',
  'Real-time load board',
  'Email + PDF ingestion',
  'Email support',
];

const comingSoon = [
  { name: 'Growth', price: '$499/mo', desc: '3 dispatchers · 50 trucks · Lane analytics' },
  { name: 'Fleet', price: 'Custom', desc: 'Unlimited seats · Dedicated onboarding · SLA' },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 px-6" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="max-w-5xl mx-auto">

        <div className="mb-14">
          <Reveal variant="left">
            <p className="text-xs font-mono tracking-widest uppercase mb-3" style={{ color: 'var(--amber)' }}>
              Pricing
            </p>
          </Reveal>
          <Reveal variant="blur" delay={100}>
            <h2 className="font-display text-4xl md:text-5xl font-800 leading-tight" style={{ color: '#FFFFFF' }}>
              Less than the cost of<br />one missed load.
            </h2>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-3 gap-6">

          {/* Starter — active */}
          <Reveal variant="up" className="md:col-span-2">
          <div className="rounded-2xl p-8 border relative overflow-hidden h-full"
            style={{ borderColor: 'var(--amber)', background: 'var(--surface)' }}>

            {/* Amber glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)' }} />

            <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
              <div>
                <div className="font-mono text-xs mb-1" style={{ color: 'var(--amber)' }}>AVAILABLE NOW</div>
                <h3 className="font-display font-800 text-3xl" style={{ color: 'var(--text)' }}>Starter</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Perfect for owner-operators and small fleets</p>
              </div>
              <div className="text-right">
                <div className="font-display font-800 text-4xl" style={{ color: 'var(--text)' }}>$199<span className="text-lg font-400">/mo</span></div>
                <div className="text-sm line-through" style={{ color: 'var(--text-muted)' }}>$299/mo regular</div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 border rounded-full px-3 py-1 text-xs font-mono mb-6"
              style={{ borderColor: 'var(--amber-dim)', color: 'var(--amber)', background: 'rgba(249,115,22,0.06)' }}>
              🔥 Founder&apos;s Rate — first 20 carriers lock in forever
            </div>

            <div className="grid grid-cols-2 gap-2 mb-8">
              {starterFeatures.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--green)' }}>✓</span> {f}
                </div>
              ))}
            </div>

            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all"
              style={{ background: 'var(--amber)', color: '#000' }}
            >
              Book a Demo →
            </a>

            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)', fontFamily: 'Space Mono' }}>
              14-day free trial · No credit card required
            </p>
          </div>
          </Reveal>

          {/* Coming Soon column */}
          <Reveal variant="right" delay={150} className="flex flex-col gap-4">
            {comingSoon.map((plan) => (
              <div key={plan.name} className="flex-1 rounded-2xl p-6 border opacity-50"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                <div className="inline-block font-mono text-xs px-2 py-0.5 rounded mb-3"
                  style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>
                  Coming Soon
                </div>
                <h3 className="font-display font-700 text-xl mb-1" style={{ color: 'var(--text)' }}>{plan.name}</h3>
                <p className="font-mono text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{plan.price}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{plan.desc}</p>
                <div className="mt-4 w-full text-center text-sm py-2.5 rounded-xl font-medium cursor-not-allowed"
                  style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>
                  Coming Soon
                </div>
              </div>
            ))}
          </Reveal>

        </div>
      </div>
    </section>
  );
}
