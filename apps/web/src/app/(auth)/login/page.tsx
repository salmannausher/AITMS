import { login } from '@/lib/auth/actions';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata = { title: 'Login — Devsphinx AI Dispatch' };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your dispatcher account
          </p>
        </div>
        <AuthForm mode="login" action={login} />
        <p className="text-center text-sm text-muted-foreground">
          No account?{' '}
          <a href="/signup" className="underline underline-offset-4 hover:text-primary">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
