import Reveal from './Reveal';

const CALENDLY_URL = 'https://calendly.com/YOUR_LINK';

export default function FooterCTA() {
  return (
    <section className="py-20 px-6" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="max-w-5xl mx-auto">
        <Reveal variant="scale">
        <div className="rounded-2xl p-10 md:p-16 text-center relative overflow-hidden border"
          style={{ borderColor: 'var(--amber)', background: 'var(--surface)' }}>

          {/* Glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.12) 0%, transparent 60%)' }} />

          <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--amber)' }}>
            Ready to dispatch smarter?
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-800 mb-4" style={{ color: '#FFFFFF' }}>
            See the full workflow live.
          </h2>
          <p className="text-base max-w-md mx-auto mb-8" style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
            30-minute demo. We&apos;ll show you email → score → assign → WhatsApp confirm, end-to-end,
            in under 60 seconds.
          </p>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all"
            style={{ background: 'var(--amber)', color: '#000' }}
          >
            Book a Free Demo →
          </a>
          <p className="text-xs mt-4 font-mono" style={{ color: 'var(--text-muted)' }}>
            Founder&apos;s Rate — $199/mo locked in forever for the first 20 carriers
          </p>
        </div>
        </Reveal>
      </div>
    </section>
  );
}
