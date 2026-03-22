"use client";

import { useEffect, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook to automatically refresh admin token before it expires
 * - Attempts refresh immediately on mount if token is missing/expired
 * - Checks token expiry every minute
 * - Refreshes token 5 minutes before expiry
 * - Redirects to login if refresh fails
 */
export function useAdminAuth() {
    const router = useRouter();
    const isRefreshingRef = useRef(false);
    const hasAttemptedRefreshRef = useRef(false);
    const [isReady, setIsReady] = useState(false);

    const refreshToken = useCallback(async (): Promise<boolean> => {
        if (isRefreshingRef.current) return true;
        isRefreshingRef.current = true;

        try {
            const response = await fetch('/api/admin/refresh', {
                method: 'POST',
                credentials: 'include',
            });

            if (!response.ok) {
                console.warn('[Auth] Token refresh failed, redirecting to login');
                localStorage.removeItem('admin_token');
                router.push('/admin/login');
                return false;
            }

            const data = await response.json();

            // Update localStorage with new token
            if (data.token) {
                localStorage.setItem('admin_token', data.token);
            }

            console.log('[Auth] Token refreshed successfully');
            setIsReady(true);
            return true;
        } catch (error) {
            console.error('[Auth] Token refresh error:', error);
            return false;
        } finally {
            isRefreshingRef.current = false;
        }
    }, [router]);

    const checkAndRefreshToken = useCallback(async () => {
        // Get token expiry from cookie (this is non-HttpOnly so we can read it)
        const cookies = document.cookie.split(';');
        const expiryCookie = cookies.find(c => c.trim().startsWith('admin_token_expires='));

        // If no expiry cookie and localStorage has a token, we might have just logged in
        // Wait a bit for cookies to be set
        const localToken = localStorage.getItem('admin_token');

        if (!expiryCookie && !localToken) {
            // No tokens at all - not logged in
            setIsReady(true);
            return;
        }

        // If we have localStorage token but no expiry cookie, validate the token first
        if (!expiryCookie && localToken && !hasAttemptedRefreshRef.current) {
            console.log('[Auth] No expiry cookie but has localStorage token, validating...');

            try {
                // Decode JWT to check expiry (client-side decode, no verification needed)
                const tokenParts = localToken.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    const expiresAt = payload.exp;
                    const now = Math.floor(Date.now() / 1000);

                    if (expiresAt && expiresAt < now) {
                        // Token is already expired, don't bother refreshing
                        console.log('[Auth] Token is expired, redirecting to login');
                        localStorage.removeItem('admin_token');
                        router.push('/admin/login');
                        setIsReady(true);
                        return;
                    }

                    // Token is valid, try refreshing to get updated cookies
                    console.log('[Auth] Token is valid, attempting refresh...');
                }
            } catch (err) {
                console.error('[Auth] Error decoding token:', err);
                // If we can't decode, try refresh anyway
            }

            hasAttemptedRefreshRef.current = true;
            const success = await refreshToken();
            if (!success) {
                setIsReady(true);
            }
            return;
        }

        if (!expiryCookie) {
            setIsReady(true);
            return;
        }

        const expiresAt = parseInt(expiryCookie.split('=')[1]?.trim() || '0', 10);

        if (!expiresAt) {
            setIsReady(true);
            return;
        }

        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt - now;

        // Refresh if token expires soon or is already expired
        if (timeUntilExpiry < 300) {
            console.log('[Auth] Token expiring soon or expired, refreshing...');
            await refreshToken();
        } else {
            setIsReady(true);
        }
    }, [refreshToken, router]);

    useEffect(() => {
        // Check token immediately on mount
        checkAndRefreshToken();

        // Set up interval to check every minute
        const interval = setInterval(checkAndRefreshToken, 60 * 1000);

        return () => {
            clearInterval(interval);
        };
    }, [checkAndRefreshToken]);

    return { refreshToken, isReady };
}

/**
 * Get admin token from localStorage
 */
export function getAdminToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('admin_token');
}

/**
 * Check if user is logged in (has token)
 */
export function isLoggedIn(): boolean {
    return !!getAdminToken();
}

/**
 * Logout and clear all admin session data
 */
export async function logout(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Clear localStorage
    localStorage.removeItem('admin_token');

    // Clear cookies by calling logout endpoint or setting expired cookies
    try {
        await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
        console.error('[Auth] Logout error:', error);
    }
}
