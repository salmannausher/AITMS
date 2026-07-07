'use client';

import { useEffect, useRef, useState } from 'react';

type RevealProps = {
  children: React.ReactNode;
  /** 'up' | 'left' | 'right' | 'scale' | 'blur' */
  variant?: 'up' | 'left' | 'right' | 'scale' | 'blur';
  delay?: number; // ms
  className?: string;
  style?: React.CSSProperties;
};

const hiddenStyles: Record<string, React.CSSProperties> = {
  up:    { opacity: 0, transform: 'translateY(48px)' },
  left:  { opacity: 0, transform: 'translateX(-48px)' },
  right: { opacity: 0, transform: 'translateX(48px)' },
  scale: { opacity: 0, transform: 'scale(0.92)' },
  blur:  { opacity: 0, filter: 'blur(12px)', transform: 'translateY(16px)' },
};

export default function Reveal({ children, variant = 'up', delay = 0, className, style }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        ...(visible
          ? { opacity: 1, transform: 'none', filter: 'none' }
          : hiddenStyles[variant]),
        transition: `opacity 0.8s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.8s cubic-bezier(.22,1,.36,1) ${delay}ms, filter 0.8s cubic-bezier(.22,1,.36,1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}
