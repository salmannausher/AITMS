import { signup } from '@/lib/auth/actions';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata = { title: 'Sign Up — Devsphinx AI Dispatch' };

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground">Get your carrier dispatching on autopilot</p>
        </div>
        <AuthForm mode="signup" action={signup} />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <a href="/login" className="underline underline-offset-4 hover:text-primary">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
