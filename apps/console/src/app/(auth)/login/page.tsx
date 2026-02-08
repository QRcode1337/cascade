'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDevLoading, setIsDevLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingToken, setIsProcessingToken] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDev = process.env.NODE_ENV === 'development';

  // Handle token from URL fragment (magic link callback)
  useEffect(() => {
    const handleHashToken = async () => {
      // Check if we have tokens in the URL hash
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          setIsProcessingToken(true);
          try {
            const supabase = createClient();

            // Set the session from the tokens
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('Session error:', error);
              setError(error.message);
              setIsProcessingToken(false);
              return;
            }

            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname);

            // Redirect to intended destination or workspaces
            const redirect = searchParams.get('redirect') || '/workspaces';
            router.push(redirect);
          } catch (err) {
            console.error('Token processing error:', err);
            setError('Failed to process login. Please try again.');
            setIsProcessingToken(false);
          }
        }
      }
    };

    handleHashToken();
  }, [router, searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send magic link');
      }

      setIsSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDevLogin() {
    setIsDevLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/dev-login', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Dev login failed');
      }

      // Set session in Supabase client
      const supabase = createClient();
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      // Redirect
      const redirect = searchParams.get('redirect') || '/workspaces';
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dev login failed');
      setIsDevLoading(false);
    }
  }

  // Show loading state while processing token
  if (isProcessingToken) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
          <svg className="w-6 h-6 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold mb-2">Signing you in...</h2>
        <p className="text-muted-foreground text-sm">Please wait while we verify your login.</p>
      </div>
    );
  }

  if (isSent) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold mb-2">Check your email</h2>
        <p className="text-muted-foreground text-sm">
          We sent a magic link to <strong>{email}</strong>
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          Click the link in your email to sign in.
        </p>
        <button onClick={() => setIsSent(false)} className="mt-4 text-sm text-primary hover:underline">
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold mb-4">Sign in to CASCADE</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">Email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-3 py-2 rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Sending...' : 'Send magic link'}
        </button>
      </form>
      <p className="mt-4 text-xs text-muted-foreground text-center">
        No password needed. We&apos;ll email you a secure sign-in link.
      </p>

      {isDev && (
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center mb-3">Development Mode</p>
          <button
            type="button"
            onClick={handleDevLogin}
            disabled={isDevLoading}
            className="w-full py-2 px-4 rounded-md bg-amber-500 text-white font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isDevLoading ? 'Logging in...' : 'Dev Login (No Email)'}
          </button>
        </div>
      )}
    </div>
  );
}

function LoginLoading() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-muted rounded w-1/3"></div>
        <div className="h-10 bg-muted rounded"></div>
        <div className="h-10 bg-muted rounded"></div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
