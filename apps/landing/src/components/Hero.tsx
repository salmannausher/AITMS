const CALENDLY_URL = 'https://calendly.com/YOUR_LINK';

export default function Hero() {
  return (
    <section className="pt-36 pb-24 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Badge */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 border rounded-full px-4 py-1.5 text-xs font-mono tracking-widest uppercase"
            style={{ borderColor: 'var(--amber-dim)', color: 'var(--amber)', background: 'rgba(249,115,22,0.06)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--amber)' }} />
            Founder&apos;s Rate — 12 spots remaining
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-6">
          <h1 className="font-display text-6xl md:text-8xl font-800 leading-none tracking-tight animate-fade-up" style={{ color: 'var(--text)' }}>
            One dispatcher.
          </h1>
          <h1 className="font-display text-6xl md:text-8xl font-800 leading-none tracking-tight animate-fade-up delay-100" style={{ color: 'var(--amber)', WebkitTextStroke: '0px', letterSpacing: '-0.02em' }}>
            3× the trucks.
          </h1>
        </div>

        <p className="text-center text-lg max-w-xl mx-auto mb-10 animate-fade-up delay-200" style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
          LoadPilot reads broker emails, scores every load in 10 seconds,
          and sends WhatsApp assignments in one click. Less grind. More freight.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up delay-300">
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-7 py-3.5 rounded-xl font-semibold text-base transition-all"
            style={{ background: 'var(--amber)', color: '#000', fontFamily: 'Onest' }}
          >
            Book a Free Demo →
          </a>
          <a
            href="#how-it-works"
            className="px-7 py-3.5 rounded-xl font-semibold text-base border transition-all"
            style={{ borderColor: 'var(--border-lit)', color: 'var(--text-muted)' }}
          >
            See how it works
          </a>
        </div>
        <p className="text-center text-xs mt-3 animate-fade-in delay-400" style={{ color: 'var(--text-muted)', fontFamily: 'Space Mono' }}>
          No credit card · 30-min demo · Cancel anytime
        </p>

        {/* Terminal mockup */}
        <div className="mt-16 rounded-2xl overflow-hidden border animate-fade-up delay-400"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>

          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
            <div className="w-3 h-3 rounded-full" style={{ background: '#F87171' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#FCD34D' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#4ADE80' }} />
            <span className="ml-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              app.getloadpilot.com/dashboard
            </span>
            <div className="ml-auto flex items-center gap-1.5 text-xs font-mono" style={{ color: 'var(--green)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--green)' }} />
              LIVE
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-4 border-b" style={{ borderColor: 'var(--border)' }}>
            {[
              { label: 'Active Loads', value: '14', unit: '' },
              { label: 'Need Assignment', value: '3', unit: '' },
              { label: 'Drivers Ready', value: '7', unit: '' },
              { label: 'Avg RPM', value: '2.74', unit: '$' },
            ].map((s, i) => (
              <div key={s.label} className={`px-4 py-3 ${i < 3 ? 'border-r' : ''}`} style={{ borderColor: 'var(--border)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'Space Mono' }}>{s.label}</div>
                <div className="text-xl font-display font-700" style={{ color: i === 1 ? 'var(--amber)' : 'var(--text)' }}>
                  {s.unit}{s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Load cards */}
          <div className="p-4 grid grid-cols-3 gap-3">
            {[
              { status: 'GOOD', statusColor: 'var(--green)', lane: 'CHI → DAL', rate: '$2,850', rpm: '2.91', broker: 'Echo Global', driver: null },
              { status: 'ACCEPTED', statusColor: 'var(--cyan)', lane: 'ATL → MIA', rate: '$1,640', rpm: '2.10', broker: 'Coyote', driver: null },
              { status: 'ASSIGNED', statusColor: 'var(--amber)', lane: 'NYC → BOS', rate: '$980', rpm: '2.45', broker: 'XPO', driver: 'M. Johnson' },
            ].map((load) => (
              <div key={load.lane} className="rounded-xl p-4 border card-hover" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: load.statusColor, background: `${load.statusColor}18`, border: `1px solid ${load.statusColor}30` }}>
                    {load.status}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{load.broker}</span>
                </div>
                <div className="font-display font-700 text-base mb-1" style={{ color: 'var(--text)' }}>{load.lane}</div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-sm" style={{ color: 'var(--text)' }}>{load.rate}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{load.rpm} RPM</span>
                </div>
                {load.driver ? (
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ background: 'var(--amber)', color: '#000', fontWeight: 700 }}>
                      {load.driver[0]}
                    </span>
                    {load.driver}
                  </div>
                ) : (
                  <div className="text-xs text-center py-1.5 rounded-lg font-semibold transition-all cursor-pointer"
                    style={{ background: 'var(--amber)', color: '#000' }}>
                    Assign Driver
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
