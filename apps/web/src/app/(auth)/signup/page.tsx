import { signup } from '@/lib/auth/actions';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata = { title: 'Sign Up — Devsphinx AI Dispatch' };

export default function SignupPage() {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[420px] shrink-0 flex-col justify-between p-10" style={{ backgroundColor: 'hsl(var(--sidebar))' }}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: 'hsl(var(--primary))' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
              <rect width="13" height="8" x="8" y="13" rx="1" />
              <path d="M18 13V8" />
              <circle cx="6.5" cy="17.5" r="2.5" />
              <circle cx="18.5" cy="17.5" r="2.5" />
            </svg>
          </div>
          <span className="text-white font-semibold text-base">Devsphinx AI Dispatch</span>
        </div>

        <div className="space-y-6">
          <blockquote className="text-white text-xl font-medium leading-relaxed">
            "Set up in minutes. Your AI dispatcher starts working on day one."
          </blockquote>
          <div className="space-y-3">
            {[
              'Free to start — no credit card required',
              'Connects to your existing broker email inbox',
              'First load scored within seconds of setup',
            ].map((point) => (
              <div key={point} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{point}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>© 2026 Devsphinx · MVP v0.1</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm space-y-7">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'hsl(var(--primary))' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
                <rect width="13" height="8" x="8" y="13" rx="1" />
                <circle cx="6.5" cy="17.5" r="2.5" />
                <circle cx="18.5" cy="17.5" r="2.5" />
              </svg>
            </div>
            <span className="font-semibold text-sm">Devsphinx AI Dispatch</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create your account</h1>
            <p className="text-sm text-muted-foreground">Get your carrier dispatching on autopilot</p>
          </div>

          <AuthForm mode="signup" action={signup} />

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <a href="/login" className="font-medium underline-offset-4 hover:underline" style={{ color: 'hsl(var(--primary))' }}>
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
