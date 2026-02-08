import { createClient } from '@/lib/supabase/server';

export async function getSession() {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if ((error || !user) && process.env.NODE_ENV === 'development') {
    // If Supabase is down, return a mock user for dev
    return {
      user: {
        id: 'dev-user-id',
        email: 'dev@example.com',
        name: 'Dev User',
        avatar: undefined,
      },
    };
  }

  if (error || !user) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      avatar: user.user_metadata?.avatar_url,
    },
  };
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}
