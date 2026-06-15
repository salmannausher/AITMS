export function TruckLoader({ size = 200 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="Loading"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <style>{`
          .tl-road { animation: tl-dash 0.6s linear infinite; }
          @keyframes tl-dash { to { stroke-dashoffset: -24; } }
          .tl-wheel { animation: tl-spin 0.7s linear infinite; }
          @keyframes tl-spin { to { transform: rotate(360deg); } }
          .tl-truck { animation: tl-drive 3s ease-in-out infinite alternate; }
          @keyframes tl-drive { 0% { transform: translateY(0px); } 100% { transform: translateY(-2px); } }
          .tl-e1 { animation: tl-puff 1.2s ease-out infinite; }
          .tl-e2 { animation: tl-puff 1.2s ease-out infinite 0.4s; }
          .tl-e3 { animation: tl-puff 1.2s ease-out infinite 0.8s; }
          @keyframes tl-puff {
            0%   { opacity: 0.6; transform: translate(0,0) scale(1); }
            100% { opacity: 0; transform: translate(-12px,-14px) scale(2.2); }
          }
          .tl-bar { animation: tl-progress 2.4s ease-in-out infinite; }
          @keyframes tl-progress {
            0%   { width: 10px; }
            50%  { width: 120px; }
            100% { width: 10px; }
          }
          .tl-d1 { animation: tl-blink 1.2s ease-in-out infinite; }
          .tl-d2 { animation: tl-blink 1.2s ease-in-out infinite 0.4s; }
          .tl-d3 { animation: tl-blink 1.2s ease-in-out infinite 0.8s; }
          @keyframes tl-blink {
            0%, 100% { opacity: 0.2; }
            50%       { opacity: 1; }
          }
        `}</style>
      </defs>

      {/* Road */}
      <rect x="10" y="138" width="180" height="18" rx="3" fill="var(--color-background-secondary, #f0f0f0)" />
      <line x1="10" y1="147" x2="190" y2="147" stroke="var(--color-border-secondary, #ccc)" strokeWidth="1.5" strokeDasharray="12 12" className="tl-road" />

      <g className="tl-truck">
        {/* Exhaust puffs */}
        <circle className="tl-e1" cx="44" cy="72" r="4" fill="var(--color-background-tertiary, #ddd)" />
        <circle className="tl-e2" cx="44" cy="72" r="3" fill="var(--color-background-tertiary, #ddd)" />
        <circle className="tl-e3" cx="44" cy="72" r="3" fill="var(--color-background-tertiary, #ddd)" />

        {/* Trailer */}
        <rect x="46" y="78" width="112" height="58" rx="3" fill="#1e4080" />
        <rect x="47" y="79" width="110" height="56" rx="2" fill="#22488a" />
        <rect x="46" y="118" width="112" height="8" fill="#003d9b" opacity="0.5" />
        <line x1="102" y1="79" x2="102" y2="135" stroke="#1a3a6e" strokeWidth="1.2" />
        <rect x="46"  y="131" width="5" height="3" rx="1" fill="#f59e0b" />
        <rect x="153" y="131" width="5" height="3" rx="1" fill="#f59e0b" />

        {/* Cab connector */}
        <rect x="39" y="92" width="12" height="43" rx="2" fill="#0f2d5a" />

        {/* Cab body */}
        <rect x="20" y="86" width="26" height="49" rx="4" fill="#1e4080" />
        <path d="M 22 86 Q 33 72 44 78 L 44 86 Z" fill="#1a3a6e" />

        {/* Windshield */}
        <rect x="23" y="89" width="19" height="22" rx="2" fill="#7dd3fc" opacity="0.85" />
        <rect x="24" y="90" width="6" height="5" rx="1" fill="white" opacity="0.4" />

        {/* Cab door */}
        <rect x="22" y="113" width="22" height="20" rx="2" fill="#193580" />
        <rect x="38" y="121" width="4" height="2" rx="1" fill="#60a5fa" />

        {/* Headlight */}
        <rect x="20" y="100" width="4" height="7" rx="1" fill="#fef3c7" />
        <rect x="16" y="102" width="5" height="4" rx="1" fill="#fef3c7" opacity="0.5" />

        {/* Grill */}
        <rect x="20" y="110" width="4" height="20" rx="1" fill="#0f2d5a" />
        <line x1="21" y1="112" x2="23" y2="112" stroke="#2a52a0" strokeWidth="0.8" />
        <line x1="21" y1="116" x2="23" y2="116" stroke="#2a52a0" strokeWidth="0.8" />
        <line x1="21" y1="120" x2="23" y2="120" stroke="#2a52a0" strokeWidth="0.8" />
        <line x1="21" y1="124" x2="23" y2="124" stroke="#2a52a0" strokeWidth="0.8" />

        {/* Exhaust stack */}
        <rect x="41" y="64" width="5" height="18" rx="2" fill="#0f2d5a" />

        {/* Front wheel */}
        <g style={{ transformOrigin: '30px 140px' }} className="tl-wheel">
          <circle cx="30" cy="140" r="10" fill="#1a1a2e" />
          <circle cx="30" cy="140" r="7"  fill="#2d2d4e" />
          <circle cx="30" cy="140" r="3"  fill="#3d3d6e" />
          <line x1="30" y1="133" x2="30" y2="147" stroke="#4a4a80" strokeWidth="1.5" />
          <line x1="23" y1="140" x2="37" y2="140" stroke="#4a4a80" strokeWidth="1.5" />
          <line x1="25" y1="135" x2="35" y2="145" stroke="#4a4a80" strokeWidth="1" />
          <line x1="35" y1="135" x2="25" y2="145" stroke="#4a4a80" strokeWidth="1" />
        </g>

        {/* Rear wheel 1 */}
        <g style={{ transformOrigin: '138px 140px' }} className="tl-wheel">
          <circle cx="138" cy="140" r="10" fill="#1a1a2e" />
          <circle cx="138" cy="140" r="7"  fill="#2d2d4e" />
          <circle cx="138" cy="140" r="3"  fill="#3d3d6e" />
          <line x1="138" y1="133" x2="138" y2="147" stroke="#4a4a80" strokeWidth="1.5" />
          <line x1="131" y1="140" x2="145" y2="140" stroke="#4a4a80" strokeWidth="1.5" />
          <line x1="133" y1="135" x2="143" y2="145" stroke="#4a4a80" strokeWidth="1" />
          <line x1="143" y1="135" x2="133" y2="145" stroke="#4a4a80" strokeWidth="1" />
        </g>

        {/* Rear wheel 2 */}
        <g style={{ transformOrigin: '157px 140px' }} className="tl-wheel">
          <circle cx="157" cy="140" r="10" fill="#1a1a2e" />
          <circle cx="157" cy="140" r="7"  fill="#2d2d4e" />
          <circle cx="157" cy="140" r="3"  fill="#3d3d6e" />
          <line x1="157" y1="133" x2="157" y2="147" stroke="#4a4a80" strokeWidth="1.5" />
          <line x1="150" y1="140" x2="164" y2="140" stroke="#4a4a80" strokeWidth="1.5" />
          <line x1="152" y1="135" x2="162" y2="145" stroke="#4a4a80" strokeWidth="1" />
          <line x1="162" y1="135" x2="152" y2="145" stroke="#4a4a80" strokeWidth="1" />
        </g>
      </g>

      {/* Progress bar */}
      <rect x="40" y="166" width="120" height="4" rx="2" fill="var(--color-background-secondary, #e5e7eb)" />
      <rect x="40" y="166" height="4" rx="2" fill="#003d9b" className="tl-bar" />

      {/* Loading dots */}
      <text x="100" y="186" textAnchor="middle" fill="var(--color-text-secondary, #666)" fontFamily="var(--font-sans, sans-serif)" fontSize="11">
        Loading
        <tspan className="tl-d1"> .</tspan>
        <tspan className="tl-d2">.</tspan>
        <tspan className="tl-d3">.</tspan>
      </text>
    </svg>
  );
}

export function TruckLoaderPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <TruckLoader size={200} />
    </div>
  );
}
