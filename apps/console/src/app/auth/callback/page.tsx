'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function CallbackHandler() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();
      const redirectTo = searchParams.get('redirect') || '/workspaces';

      // Check for error in URL
      const urlError = searchParams.get('error');
      if (urlError) {
        setError(searchParams.get('error_description') || urlError);
        return;
      }

      // Check for PKCE code in query params
      const code = searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('Code exchange error:', error);
          setError(error.message);
          return;
        }
        router.push(redirectTo);
        return;
      }

      // Check for tokens in URL hash (implicit flow)
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Session error:', error);
            setError(error.message);
            return;
          }

          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname);
          router.push(redirectTo);
          return;
        }
      }

      // Check for token_hash in query params (email OTP flow)
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          type: type as 'email' | 'magiclink' | 'recovery' | 'invite',
          token_hash: tokenHash,
        });

        if (error) {
          console.error('OTP verification error:', error);
          setError(error.message);
          return;
        }
        router.push(redirectTo);
        return;
      }

      // No valid auth params found
      setError('No authentication parameters found');
    };

    handleCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-lg border bg-card p-6 max-w-md text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Authentication Failed</h2>
          <p className="text-muted-foreground text-sm mb-4">{error}</p>
          <a href="/login" className="text-primary hover:underline">
            Try again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="rounded-lg border bg-card p-6 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
          <svg className="w-6 h-6 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold mb-2">Completing sign in...</h2>
        <p className="text-muted-foreground text-sm">Please wait while we verify your login.</p>
      </div>
    </div>
  );
}

function CallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="rounded-lg border bg-card p-6 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
          <svg className="w-6 h-6 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold mb-2">Loading...</h2>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackLoading />}>
      <CallbackHandler />
    </Suspense>
  );
}
