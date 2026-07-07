import Reveal from './Reveal';
import CountUp from './CountUp';

const problems = [
  {
    tag: '01',
    title: 'Broker emails eat your morning',
    description: 'You spend 2+ hours parsing rate confirmations, copy-pasting into spreadsheets, doing math on a calculator. Every day.',
  },
  {
    tag: '02',
    title: 'Every load is a gut call',
    description: "Without live fuel prices and lane history, you're guessing. One bad load wipes a week of margin.",
  },
  {
    tag: '03',
    title: 'Driver assignment is phone tag',
    description: "Call 3 drivers to find one who's available, HOS-compliant, and has the right equipment. 45 minutes, every single load.",
  },
];

export default function Problem() {
  return (
    <section className="py-20 px-6" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="max-w-5xl mx-auto">

        <div className="mb-14">
          <Reveal variant="left">
            <p className="text-xs font-mono tracking-widest uppercase mb-3" style={{ color: 'var(--amber)' }}>
              The problem
            </p>
          </Reveal>
          <Reveal variant="blur" delay={100}>
            <h2 className="font-display text-4xl md:text-5xl font-800 leading-tight" style={{ color: '#FFFFFF' }}>
              Dispatching hasn&apos;t changed<br />since the fax machine.
            </h2>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-3 gap-px" style={{ background: 'var(--border)' }}>
          {problems.map((p, i) => (
            <Reveal key={p.tag} variant="up" delay={i * 150}>
              <div className="p-8 h-full" style={{ background: 'var(--surface)' }}>
                <div className="font-mono text-xs mb-6" style={{ color: 'var(--amber)' }}>{p.tag}</div>
                <h3 className="font-display font-700 text-xl mb-3 leading-snug" style={{ color: '#FFFFFF' }}>{p.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{p.description}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Callout with count-up */}
        <Reveal variant="scale" delay={200}>
          <div className="mt-px p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>
            <div>
              <p className="font-display font-700 text-2xl" style={{ color: '#FFFFFF' }}>
                Average dispatcher manages{' '}
                <span style={{ color: 'var(--amber)' }}>8–12 trucks.</span>
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                LoadPilot-powered dispatcher handles{' '}
                <span className="font-mono" style={{ color: 'var(--green)' }}>
                  <CountUp end={30} suffix="+" duration={1600} />
                </span>
                . Same salary. 3× the output.
              </p>
            </div>
            <div className="font-mono text-xs px-4 py-2 rounded border whitespace-nowrap"
              style={{ borderColor: 'var(--amber)', color: 'var(--amber)', background: 'rgba(249,115,22,0.06)' }}>
              ~$<CountUp end={90} duration={1600} />k/yr saved in hiring
            </div>
          </div>
        </Reveal>

      </div>
    </section>
  );
}
