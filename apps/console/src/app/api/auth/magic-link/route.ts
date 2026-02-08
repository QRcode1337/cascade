import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = schema.parse(body);

    // Use admin client with service role key to generate magic link
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Generate magic link using admin API
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      console.error('Generate link error:', error);
      throw error;
    }

    if (!data?.properties?.action_link) {
      throw new Error('No magic link generated');
    }

    // Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'CASCADE <onboarding@resend.dev>',
      to: email,
      subject: 'Sign in to CASCADE',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 24px;">Sign in to CASCADE</h1>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5; margin-bottom: 32px;">
            Click the button below to sign in to your account. This link will expire in 1 hour.
          </p>
          <a href="${data.properties.action_link}"
             style="display: inline-block; background: #0070f3; color: white; padding: 14px 28px;
                    text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px;">
            Sign in to CASCADE
          </a>
          <p style="color: #888; font-size: 14px; margin-top: 32px;">
            If you didn't request this email, you can safely ignore it.
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      throw emailError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Magic link error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send magic link' },
      { status: 500 }
    );
  }
}
