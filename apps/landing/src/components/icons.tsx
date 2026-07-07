type IconProps = {
  size?: number;
  accent?: string;
};

const base = 'rgba(255,255,255,0.85)';

/* Envelope with extraction beam — rate-con ingestion */
export function IconInbox({ size = 26, accent = '#F97316' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="4" y="9" width="24" height="16" rx="2.5" stroke={base} strokeWidth="1.8" />
      <path d="M5 11l11 8 11-8" stroke={base} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 3v4" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeDasharray="1.5 2.5" />
      <circle cx="16" cy="2.5" r="1.5" fill={accent} />
      <path d="M25 22.5h-6" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/* Bolt inside a gauge arc — instant AI scoring */
export function IconScore({ size = 26, accent = '#F97316' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M4 20a12 12 0 0 1 24 0" stroke={base} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 20a12 12 0 0 1 5-9.8" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      <path d="M17.5 12l-4.5 7h4l-2.5 6 7-9h-4.5l2-4h-1.5z" fill={accent} stroke={accent} strokeWidth="0.5" strokeLinejoin="round" />
      <circle cx="4" cy="24" r="1.3" fill={base} />
      <circle cx="28" cy="24" r="1.3" fill={base} />
    </svg>
  );
}

/* Crosshair locked on a driver node — smart assignment */
export function IconTarget({ size = 26, accent = '#F97316' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="10" stroke={base} strokeWidth="1.8" />
      <circle cx="16" cy="16" r="4.5" stroke={accent} strokeWidth="1.8" />
      <circle cx="16" cy="16" r="1.6" fill={accent} />
      <path d="M16 2v5M16 25v5M2 16h5M25 16h5" stroke={base} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/* Chat bubble with confirmed check — WhatsApp YES */
export function IconConfirm({ size = 26, accent = '#F97316' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M27 15a11 11 0 0 1-16 9.8L5 26l1.4-5.4A11 11 0 1 1 27 15z"
        stroke={base}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M11.5 15.5l3 3 6-6" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Kanban columns with moving card — live board */
export function IconBoard({ size = 26, accent = '#F97316' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="4" y="5" width="7" height="22" rx="1.8" stroke={base} strokeWidth="1.7" />
      <rect x="12.5" y="5" width="7" height="15" rx="1.8" stroke={base} strokeWidth="1.7" />
      <rect x="21" y="5" width="7" height="18" rx="1.8" stroke={base} strokeWidth="1.7" />
      <rect x="14" y="8" width="4" height="3.5" rx="1" fill={accent} />
      <path d="M18.5 21.5l4 2.5" stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeDasharray="1.5 2.5" />
    </svg>
  );
}

/* Document with scan line — PDF parsing */
export function IconParse({ size = 26, accent = '#F97316' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M8 4h11l6 6v18H8V4z" stroke={base} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M19 4v6h6" stroke={base} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3 16h26" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="29" cy="16" r="1.6" fill={accent} />
      <path d="M12 21h8M12 24.5h5" stroke={base} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/* Route with waypoints trending up — RPM analytics */
export function IconAnalytics({ size = 26, accent = '#F97316' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M4 27h24" stroke={base} strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M6 22c4-1 5-8 9-9s6 3 11-7"
        stroke={accent}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="3 3"
      />
      <circle cx="6" cy="22" r="2" fill="#05080F" stroke={base} strokeWidth="1.6" />
      <circle cx="15" cy="13" r="2" fill="#05080F" stroke={base} strokeWidth="1.6" />
      <circle cx="26" cy="6" r="2" fill={accent} />
    </svg>
  );
}

/* Truck cab with radar ping — driver ranking */
export function IconTruck({ size = 26, accent = '#F97316' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M3 21V10a1.5 1.5 0 0 1 1.5-1.5H17V21" stroke={base} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M17 12h5.5l4.5 5v4h-10v-9z" stroke={base} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="9" cy="23.5" r="2.6" stroke={base} strokeWidth="1.7" />
      <circle cx="22" cy="23.5" r="2.6" stroke={base} strokeWidth="1.7" />
      <path d="M23 4.5a6.5 6.5 0 0 1 4 2.5" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M24.5 1.5A10 10 0 0 1 30.5 5" stroke={accent} strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}
