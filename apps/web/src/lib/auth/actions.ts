'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const supabase = createSupabaseServerClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect('/');
}

export async function signup(formData: FormData) {
  const supabase = createSupabaseServerClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const companyName = formData.get('company_name') as string;

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: 'Signup failed — no user returned.' };
  }

  // Call API to create Company + User records and set JWT custom claims
  const res = await fetch(
    `${process.env['NEXT_PUBLIC_API_URL']}/companies/onboard`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_user_id: data.user.id,
        email,
        full_name: fullName,
        company_name: companyName,
      }),
    },
  );

  if (!res.ok) {
    // Clean up the orphaned auth user if onboarding fails
    await supabase.auth.admin.deleteUser(data.user.id).catch(() => null);
    return { error: 'Failed to create your account. Please try again.' };
  }

  redirect('/');
}

export async function logout() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}
