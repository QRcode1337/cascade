import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// DEV ONLY - This endpoint bypasses email verification for local development
export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const devEmail = 'dev@localhost.test';

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if dev user exists, create if not
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    let user = existingUsers?.users?.find(u => u.email === devEmail);

    if (!user) {
      // Create the dev user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: devEmail,
        email_confirm: true,
        user_metadata: { name: 'Dev User' },
      });

      if (createError) {
        console.error('Create user error:', createError);
        throw createError;
      }
      user = newUser.user;
    }

    // Generate a magic link and extract session
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: devEmail,
    });

    if (error || !data?.properties?.hashed_token) {
      console.error('Generate link error:', error);
      throw error || new Error('Failed to generate login link');
    }

    // Verify the OTP to get tokens
    const { data: sessionData, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
      token_hash: data.properties.hashed_token,
      type: 'magiclink',
    });

    if (verifyError || !sessionData.session) {
      console.error('Verify error:', verifyError);
      throw verifyError || new Error('Failed to create session');
    }

    // Set the session cookies
    const cookieStore = await cookies();

    cookieStore.set('sb-access-token', sessionData.session.access_token, {
      httpOnly: true,
      secure: false, // Dev only
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    cookieStore.set('sb-refresh-token', sessionData.session.refresh_token, {
      httpOnly: true,
      secure: false, // Dev only
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return NextResponse.json({
      success: true,
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    });
  } catch (error) {
    console.error('Dev login error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Dev login failed' },
      { status: 500 }
    );
  }
}
