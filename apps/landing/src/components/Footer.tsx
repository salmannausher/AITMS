export default function Footer() {
  return (
    <footer className="py-8 px-6 border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center text-sm" style={{ background: 'var(--amber)', color: '#000' }}>✈</div>
          <span className="font-display font-700 text-base" style={{ color: 'var(--text)' }}>
            Load<span style={{ color: 'var(--amber)' }}>Pilot</span>
          </span>
          <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>by Devsphinx</span>
        </div>

        <div className="flex gap-6 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="mailto:hello@getloadpilot.com" className="hover:text-white transition-colors">Contact</a>
        </div>

        <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} Devsphinx
        </p>
      </div>
    </footer>
  );
}
