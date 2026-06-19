import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isOnboardingRoute = pathname.startsWith('/onboarding');
  const isApiRoute = pathname.startsWith('/api');

  // API routes must never be redirected — their handlers own auth and return JSON.
  // A redirect here would send an HTML page back to a fetch() expecting JSON.
  if (isApiRoute) {
    return supabaseResponse;
  }

  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  if (user && isPublicRoute) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    return NextResponse.redirect(dashboardUrl);
  }

  // Onboarding gate — only check for authenticated users on non-public routes
  if (user && !isPublicRoute) {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (token) {
      try {
        const apiUrl = process.env['NEXT_PUBLIC_API_URL'];
        const companyRes = await fetch(`${apiUrl}/companies/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (companyRes.ok) {
          const company = await companyRes.json() as { onboarding_complete: boolean };
          if (!company.onboarding_complete && !isOnboardingRoute) {
            return NextResponse.redirect(new URL('/onboarding', request.url));
          }
          if (company.onboarding_complete && isOnboardingRoute) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }
        }
      } catch {
        // If the API is unreachable, let the request through — don't block the user
      }
    }
  }

  return supabaseResponse;
}
