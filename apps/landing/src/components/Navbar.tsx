const CALENDLY_URL = 'https://calendly.com/YOUR_LINK';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ background: 'rgba(5,8,15,0.85)', backdropFilter: 'blur(12px)', borderColor: 'var(--border)' }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded flex items-center justify-center text-base" style={{ background: 'var(--amber)', color: '#000' }}>
            ✈
          </div>
          <span className="font-display font-700 text-lg tracking-tight" style={{ color: 'var(--text)' }}>
            Load<span style={{ color: 'var(--amber)' }}>Pilot</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>

        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold px-4 py-2 rounded-lg transition-all"
          style={{ background: 'var(--amber)', color: '#000', fontFamily: 'Onest, sans-serif' }}
        >
          Book a Demo
        </a>
      </div>
    </nav>
  );
}
