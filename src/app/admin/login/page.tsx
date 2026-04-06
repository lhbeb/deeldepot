"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for error in URL query params (from middleware redirect)
    const errorMsg = searchParams.get('error');
    if (errorMsg) {
      setError(decodeURIComponent(errorMsg));
      // Optional: Clear the error param from URL without refreshing
      window.history.replaceState({}, '', '/admin/login');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🔐 [Client] Login form submitted');
    console.log('🔐 [Client] Username:', username);

    try {
      console.log('🔐 [Client] Sending login request...');

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // Ensure cookies are included
      });

      console.log('🔐 [Client] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      let data;
      try {
        data = await response.json();
        console.log('🔐 [Client] Response data:', data);
      } catch (jsonError) {
        console.warn('⚠️ [Client] Failed to parse JSON response:', jsonError);
        const text = await response.text();
        console.warn('⚠️ [Client] Response text:', text);
        throw new Error('Invalid response from server. Please try again.');
      }

      if (!response.ok) {
        console.warn('⚠️ [Client] Login failed:', data.error);
        throw new Error(data.error || 'Login failed');
      }

      console.log('✅ [Client] Login successful, storing token...');

      // Store token in localStorage as backup
      if (data.token) {
        localStorage.setItem('admin_token', data.token);
        console.log('✅ [Client] Token stored in localStorage');

        // Wait a bit for server cookies to be set
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check if server cookies were set successfully
        const hasServerCookie = document.cookie.includes('admin_token=');

        // FALLBACK: Only manually set cookies if server didn't set them
        if (!hasServerCookie) {
          console.warn('🍪 [Client] Server cookies not detected, setting client-side fallback...');

          const maxAge = 60 * 60 * 24 * 30; // 30 days
          const isProduction = window.location.protocol === 'https:';
          const secureFlag = isProduction ? '; secure' : '';

          document.cookie = `admin_token=${data.token}; path=/; max-age=${maxAge}; samesite=lax${secureFlag}`;
          if (data.user) {
            document.cookie = `admin_role=${data.user.role}; path=/; max-age=${maxAge}; samesite=lax${secureFlag}`;
            document.cookie = `admin_email=${data.user.email}; path=/; max-age=${maxAge}; samesite=lax${secureFlag}`;
          }
          console.log('🍪 [Client] Client-side cookies set as fallback');
        } else {
          console.log('✅ [Client] Server cookies detected, no fallback needed');
        }
      } else {
        console.warn('⚠️ [Client] No token in response');
      }

      console.log('🔄 [Client] Redirecting to /admin/products...');

      // IMPORTANT: Use window.location instead of router.push
      // This forces a full page navigation which ensures:
      // 1. Cookies from Set-Cookie header are fully processed
      // 2. No race condition between cookie setting and navigation
      // 3. Middleware will see the cookie on the next request
      window.location.href = '/admin/products';
    } catch (err) {
      console.warn('⚠️ [Client] Login error:', err);

      let errorMessage = 'An unexpected error occurred';

      if (err instanceof Error) {
        console.warn('⚠️ [Client] Error message:', err.message);
        console.warn('⚠️ [Client] Error stack:', err.stack);
        errorMessage = err.message;
        setError(err.message);
      } else {
        console.warn('⚠️ [Client] Unknown error:', err);
        setError('An unexpected error occurred. Please try again.');
        errorMessage = 'An unexpected error occurred. Please try again.';
      }

      // SHOW ALERT so the error is visible immediately
      alert(`Login Failed: ${errorMessage}`);

      setLoading(false);
    }
    // Don't set loading to false on success - we're navigating away
  };

  return (
    <div className="relative w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#F5970C] to-[#E08A09] rounded-2xl shadow-2xl shadow-[#F5970C]/30 mb-4">
          <Lock className="h-8 w-8 text-[#090A28]" />
        </div>
        <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
        <p className="text-gray-400 mt-1">Sign in to access your dashboard</p>
      </div>

      {/* Login Card */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="email"
                id="username"
                name="username"
                autoComplete="username email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#090A28] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#090A28] focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#F5970C] text-[#090A28] font-bold rounded-xl hover:bg-[#F5970C]/90 focus:outline-none focus:ring-2 focus:ring-[#F5970C] focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#F5970C]/25"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-[#090A28]/30 border-t-[#090A28] rounded-full animate-spin"></div>
            ) : (
              <>
                Sign In
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-gray-500 text-sm mt-6">
        Protected area • Authorized personnel only
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#090A28] flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#F5970C]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#F5970C]/10 rounded-full blur-3xl"></div>

      <Suspense fallback={
        <div className="relative w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl flex items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-[#F5970C]/20 border-t-[#F5970C] rounded-full animate-spin"></div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
