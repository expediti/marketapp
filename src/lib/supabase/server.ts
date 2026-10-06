import { createServerClient } from '@supabase/ssr';
import { createClient as createClientJs } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getServerRuntimeSecret } from '@/lib/server/razorpay';
import type { Database } from '@/types/database';

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key-for-development';

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components where cookies cannot be mutated directly
          }
        },
      },
    }
  );
}

/**
 * Server-side helper to verify the authenticated user and retrieve their profile
 * Uses auth.users.id strictly to query public.profiles.
 */
export async function getAuthenticatedUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { user: null, profile: null, error: userError || null };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    return { user, profile: profile || null, error: profileError || null };
  } catch (err) {
    return {
      user: null,
      profile: null,
      error: err instanceof Error ? err : new Error('Unknown server auth error'),
    };
  }
}

/**
 * Helper to safely check if service-role key is available in runtime
 */
export function isServiceRoleKeyAvailable(): boolean {
  const serviceKey =
    getServerRuntimeSecret('SUPABASE_SERVICE_ROLE_KEY') ||
    getServerRuntimeSecret('SUPABASE_SERVICE_KEY') ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;
  return Boolean(serviceKey && serviceKey.trim().length > 0);
}

/**
 * Service-role/Admin client for secure server-side mutations (OAuth callbacks, webhooks, crons).
 * Strictly isolated: never inherits SSR cookies or user session JWTs.
 */
export function createServiceClient() {
  const supabaseUrl =
    getServerRuntimeSecret('NEXT_PUBLIC_SUPABASE_URL') ||
    getServerRuntimeSecret('SUPABASE_URL') ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://placeholder-project.supabase.co';

  const serviceKey =
    getServerRuntimeSecret('SUPABASE_SERVICE_ROLE_KEY') ||
    getServerRuntimeSecret('SUPABASE_SERVICE_KEY') ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    getServerRuntimeSecret('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'placeholder-anon-key-for-development';

  return createClientJs<Database>(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

