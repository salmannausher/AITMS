'use client';

import { useEffect, useState } from 'react';

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-0.5 z-[60]" style={{ background: 'transparent' }}>
      <div
        className="h-full origin-left"
        style={{
          background: 'linear-gradient(90deg, var(--amber), #FDBA74)',
          transform: `scaleX(${progress})`,
          transformOrigin: 'left',
          boxShadow: '0 0 12px rgba(249,115,22,0.6)',
        }}
      />
    </div>
  );
}
