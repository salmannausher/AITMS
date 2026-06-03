'use client';

import { useTransition, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AuthFormProps = {
  mode: 'login' | 'signup';
  action: (formData: FormData) => Promise<{ error: string } | void>;
};

export function AuthForm({ mode, action }: AuthFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await action(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === 'signup' && (
        <>
          <div className="space-y-1">
            <Label htmlFor="company_name">Company name</Label>
            <Input
              id="company_name"
              name="company_name"
              placeholder="Acme Trucking LLC"
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="full_name">Your full name</Label>
            <Input
              id="full_name"
              name="full_name"
              placeholder="Jane Smith"
              required
              disabled={isPending}
            />
          </div>
        </>
      )}

      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@carrier.com"
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={mode === 'signup' ? 'Min 8 characters' : '••••••••'}
          minLength={8}
          required
          disabled={isPending}
        />
      </div>

      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending
          ? mode === 'login'
            ? 'Signing in…'
            : 'Creating account…'
          : mode === 'login'
            ? 'Sign in'
            : 'Create account'}
      </Button>
    </form>
  );
}
