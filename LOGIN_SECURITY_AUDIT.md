# 🔒 Login Page Security Audit & Issues Report

**Date:** February 11, 2026  
**Auditor:** AI Assistant  
**Status:** 🚨 **CRITICAL ISSUES FOUND**

---

## 🎯 Executive Summary

After a comprehensive code review of the admin login system, I've identified **10 security and functionality issues** ranging from critical to minor. While the login appears to work in development, there are significant security vulnerabilities and potential production issues.

### Risk Level Breakdown
- 🔴 **Critical:** 3 issues
- 🟠 **High:** 2 issues  
- 🟡 **Medium:** 3 issues
- 🟢 **Low:** 2 issues

---

## 🔴 CRITICAL ISSUES

### 1. Hardcoded Admin Credentials in Source Code
**File:** `src/lib/supabase/admin-auth.ts` (Lines 35-46)  
**Risk Level:** 🔴 **CRITICAL**

**Problem:**
```typescript
const ADMIN_CREDENTIALS = {
    REGULAR_ADMIN: {
        email: 'elmahboubimehdi@gmail.com',
        password: 'Localserver!!2',  // ⚠️ PLAINTEXT PASSWORD
        role: 'REGULAR_ADMIN' as AdminRole,
    },
    SUPER_ADMIN: {
        email: 'Matrix01mehdi@gmail.com',
        password: 'Mehbde!!2',  // ⚠️ PLAINTEXT PASSWORD
        role: 'SUPER_ADMIN' as AdminRole,
    },
};
```

**Impact:**
- Admin passwords are exposed in source code
- Anyone with access to the repository has super admin credentials
- Passwords are visible in git history
- Violates basic security principles

**Recommendation:**
1. **IMMEDIATELY** change both admin passwords
2. Remove hardcoded credentials from source code
3. Store credentials in environment variables or database only
4. Use proper password hashing (bcrypt) stored in database
5. Audit git history for password exposure

---

### 2. Cookie Security Flags Inconsistent Between Client & Server
**Files:** 
- `src/app/admin/login/page.tsx` (Lines 79-83)
- `src/app/api/admin/login/route.ts` (Lines 96-121)

**Problem:**

**Client-side (login page):**
```typescript
// Lines 79-83: ALWAYS sets secure flag regardless of environment
document.cookie = `admin_token=${data.token}; path=/; max-age=${maxAge}; samesite=lax; secure`;
```

**Server-side (API route):**
```typescript
// Lines 99-103: Conditional secure flag based on environment
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',  // ⚠️ MISMATCH
    sameSite: 'lax' as const,
    ...
};
```

**Impact:**
- In development (HTTP), client sets `secure` flag but server doesn't
- This causes cookie setting failures in non-HTTPS environments
- Cookies won't be sent because of security mismatch
- May cause login loops or silent failures in development

**Recommendation:**
Make client-side cookie setting match server-side:
```typescript
// Line 79 - Make it conditional
const isProduction = process.env.NODE_ENV === 'production';
const secureFlag = isProduction ? '; secure' : '';
document.cookie = `admin_token=${data.token}; path=/; max-age=${maxAge}; samesite=lax${secureFlag}`;
```

---

### 3. Missing JWT Token Expiry Validation in localStorage
**File:** `src/hooks/useAdminAuth.ts` (Lines 55-104)

**Problem:**
The `checkAndRefreshToken` function has complex logic but doesn't properly validate the JWT token expiry from localStorage before attempting refresh.

**Current Flow Issues:**
```typescript
// Line 62-79: Checks localStorage but doesn't decode/validate token
const localToken = localStorage.getItem('admin_token');

if (!expiryCookie && localToken && !hasAttemptedRefreshRef.current) {
    console.log('[Auth] No expiry cookie but has localStorage token, attempting refresh...');
    hasAttemptedRefreshRef.current = true;
    const success = await refreshToken();
    // ⚠️ If token is already expired, this will fail
}
```

**Impact:**
- May cause unnecessary API calls with expired tokens
- Could trigger 401 errors that force logout
- Inconsistent state between localStorage and cookies
- Race conditions during page load

**Recommendation:**
1. Decode and validate the JWT from localStorage before refresh
2. Check if token is expired using `jwt.decode()` (client-safe)
3. Only attempt refresh if token is valid but expiring soon

---

## 🟠 HIGH SEVERITY ISSUES

### 4. Development Auth Bypass Not Properly Secured
**File:** `src/middleware.ts` (Lines 14-25)  
**Environment:** `.env.local` (Line 36)

**Problem:**
```typescript
// middleware.ts
const { shouldBypassAuth } = await import('@/lib/supabase/auth');
const bypassAuth = shouldBypassAuth();

if (bypassAuth) {
    console.log('🔓 [MIDDLEWARE] Bypassing authentication for:', pathname);
    const response = NextResponse.next();
    return response;  // ⚠️ NO VALIDATION AT ALL
}
```

```bash
# .env.local
DISABLE_AUTH_IN_DEV=true  # ⚠️ This bypasses ALL auth
```

**Impact:**
- If `DISABLE_AUTH_IN_DEV=true` is accidentally deployed to production, **all admin routes are open**
- No authentication required for sensitive admin operations
- Complete security bypass with a single environment variable

**Recommendation:**
1. Add explicit environment check:
```typescript
if (bypassAuth && process.env.NODE_ENV !== 'production') {
    // Only bypass in development
}
```

2. Add startup warning:
```typescript
if (bypassAuth) {
    console.warn('⚠️⚠️⚠️ AUTH BYPASS ENABLED - DEVELOPMENT ONLY ⚠️⚠️⚠️');
}
```

3. Consider removing this bypass entirely and using proper test accounts instead

---

### 5. Logout Doesn't Clear All Cookies Correctly
**File:** `src/app/api/admin/logout/route.ts` (Lines 16-22)

**Problem:**
```typescript
// Lines 16-22: Tries to clear admin_refresh_token
response.cookies.set('admin_refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
});
```

**But the login system doesn't use `admin_refresh_token` anymore!**

Looking at the login route (`src/app/api/admin/login/route.ts`), it only sets:
- `admin_token`
- `admin_role`
- `admin_email`

**Impact:**
- Logout tries to clear a cookie that doesn't exist (harmless but confusing)
- Legacy code from old Supabase Auth implementation
- May cause confusion during debugging

**Also Missing:**
The logout endpoint doesn't clear the `admin_token_expires` cookie that the refresh endpoint might set.

**Recommendation:**
Update logout to only clear the cookies that are actually used:
```typescript
// Clear the actual cookies being used
response.cookies.set('admin_token', '', { maxAge: 0, path: '/' });
response.cookies.set('admin_role', '', { maxAge: 0, path: '/' });
response.cookies.set('admin_email', '', { maxAge: 0, path: '/' });
response.cookies.set('admin_token_expires', '', { maxAge: 0, path: '/' });
```

---

## 🟡 MEDIUM SEVERITY ISSUES

### 6. JWT Secret Using Default Value
**Files:**
- `src/app/api/admin/login/route.ts` (Line 6)
- `src/app/api/admin/refresh/route.ts` (Line 6)
- `src/middleware.ts` (Line 6)

**Problem:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
```

**Impact:**
- If `JWT_SECRET` is not set, a predictable default is used
- Attacker could forge admin tokens
- All three files must use the EXACT same secret or tokens won't verify

**Current Status:**
`.env.local` has `JWT_SECRET=hoodfair-super-secret-jwt-key-change-in-production-2026`

This is better than default but still has issues:
- Descriptive name (not truly random)
- Shared in `.env.local` which might be committed

**Recommendation:**
1. Generate a cryptographically secure random secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

2. Store in production secrets manager (Vercel, AWS Secrets Manager, etc.)

3. Add startup validation:
```typescript
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}
```

---

### 7. Missing Rate Limiting on Login Endpoint
**File:** `src/app/api/admin/login/route.ts`

**Problem:**
No rate limiting or brute force protection on the login endpoint.

**Impact:**
- Attackers can attempt unlimited password guesses
- No delay or lockout after failed attempts
- Could lead to account compromise

**Current Mitigation:**
- Audit logging exists (logs failed attempts)
- But no active prevention

**Recommendation:**
Implement rate limiting:
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    );
  }
  // ... rest of login logic
}
```

---

### 8. Potential Race Condition in useAdminAuth Hook
**File:** `src/hooks/useAdminAuth.ts` (Lines 106-119)

**Problem:**
```typescript
useEffect(() => {
    // Check token immediately on mount
    checkAndRefreshToken();  // ⚠️ Async, not awaited

    // Set up interval to check every minute
    const interval = setInterval(checkAndRefreshToken, 60 * 1000);

    return () => {
        clearInterval(interval);
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);  // ⚠️ Never set
        }
    };
}, [checkAndRefreshToken]);
```

**Issues:**
1. `refreshTimeoutRef` is defined but never actually set/used
2. `checkAndRefreshToken` is called but not awaited, making `isReady` timing unpredictable
3. Dependency on `checkAndRefreshToken` causes the effect to re-run unnecessarily

**Impact:**
- Components may render before auth state is ready
- Potential flickering or incorrect redirects
- Memory leaks from abandoned intervals

**Recommendation:**
1. Remove unused `refreshTimeoutRef`
2. Consider using `useCallback` with stable dependencies
3. Add loading state management

---

### 9. Client-Side Cookie Setting as "Fallback"
**File:** `src/app/admin/login/page.tsx` (Lines 76-84)

**Problem:**
```typescript
// FALLBACK: Manually set cookie on client side
// This is crucial for fixing login loops where Set-Cookie is blocked
const maxAge = 60 * 60 * 24 * 30; // 30 days
document.cookie = `admin_token=${data.token}; path=/; max-age=${maxAge}; samesite=lax; secure`;
```

**Comment says "fallback" but it ALWAYS runs!**

**Impact:**
- Duplicate cookie setting (both server and client)
- Client-side cookies are less secure (can't set `httpOnly`)
- Reveals token in client JavaScript
- Increases attack surface for XSS

**Recommendation:**
This should only run if server cookies failed:
```typescript
// Check if cookie was set by server
const hasServerCookie = document.cookie.includes('admin_token');

if (!hasServerCookie) {
    // Only then set client-side as fallback
    console.warn('Server cookie not found, setting client-side fallback');
    document.cookie = `admin_token=${data.token}; path=/; max-age=${maxAge}; samesite=lax`;
}
```

---

## 🟢 LOW SEVERITY ISSUES

### 10. Excessive Console Logging in Production
**Files:** Almost all auth-related files

**Problem:**
Extensive logging in all files:
- `console.log('[Admin Login] ...')` - 10+ instances
- `console.log('[MIDDLEWARE] ...')` - 8+ instances
- `console.log('[Auth] ...')` - 6+ instances

**Impact:**
- Exposes internal logic flow to attackers
- Performance overhead
- Leaks sensitive information (emails, token presence)

**Recommendation:**
1. Use environment-based logging:
```typescript
const isDev = process.env.NODE_ENV === 'development';
if (isDev) {
    console.log('[Admin Login] ...');
}
```

2. Or use a proper logging library with levels (Winston, Pino)

---

### 11. Missing CSRF Protection
**Files:** All API routes (login, logout, refresh)

**Problem:**
No CSRF token validation on state-changing operations.

**Current Mitigation:**
- `SameSite=lax` on cookies provides some protection
- But not complete for all scenarios

**Impact:**
- Attacker could potentially trick logged-in admin into making unwanted requests
- Lower risk with SameSite cookies, but still exists

**Recommendation:**
Add CSRF token validation for admin operations:
1. Generate CSRF token on login
2. Include in forms and API calls
3. Validate on server before processing

---

## 📋 Remediation Checklist

### Immediate Actions (Do Today)
- [ ] Change both admin passwords (`Localserver!!2` and `Mehbde!!2`)
- [ ] Move credentials to environment variables only
- [ ] Fix cookie secure flag mismatch (Issue #2)
- [ ] Add production check to auth bypass (Issue #4)
- [ ] Generate new JWT_SECRET with crypto random bytes

### This Week
- [ ] Fix logout to clear correct cookies (Issue #5)
- [ ] Add JWT token validation before refresh (Issue #3)
- [ ] Implement rate limiting on login endpoint (Issue #7)
- [ ] Remove client-side duplicate cookie setting (Issue #9)
- [ ] Add conditional logging (Issue #10)

### Next Sprint
- [ ] Refactor useAdminAuth race conditions (Issue #8)
- [ ] Implement CSRF protection (Issue #11)
- [ ] Move admin credentials to database with proper hashing
- [ ] Add session management (track active sessions)
- [ ] Implement account lockout after failed attempts
- [ ] Add 2FA for super admin accounts

---

## 🛡️ Security Best Practices to Implement

### 1. Secure Password Storage
```typescript
// ❌ NEVER do this
const password = 'Localserver!!2';

// ✅ Always hash with bcrypt
const hashedPassword = await bcrypt.hash(password, 10);
```

### 2. Environment Variable Validation
```typescript
// Add to startup script
function validateEnv() {
    const required = ['JWT_SECRET', 'SUPABASE_SERVICE_ROLE_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required env vars: ${missing.join(', ')}`);
    }
    
    if (process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
        throw new Error('JWT_SECRET must be changed from default!');
    }
}
```

### 3. Secure Cookie Settings
```typescript
const cookieOptions = {
    httpOnly: true,  // Prevent XSS
    secure: true,    // HTTPS only in production
    sameSite: 'strict',  // Prevent CSRF
    path: '/',
    maxAge: 60 * 60 * 24 * 7,  // 7 days (shorter is better)
};
```

### 4. Input Validation
```typescript
import { z } from 'zod';

const loginSchema = z.object({
    username: z.string().email(),
    password: z.string().min(8),
});

// Validate before processing
const { username, password } = loginSchema.parse(await request.json());
```

---

## 🔍 Testing Recommendations

### Security Tests to Add:
1. **Brute Force Test:** Attempt 100 logins rapidly - should be blocked
2. **Token Expiry Test:** Wait for token to expire, verify logout
3. **Cookie Injection Test:** Try setting malicious cookies
4. **XSS Test:** Try injecting scripts through username field
5. **CSRF Test:** Try forging requests from different origin

### Functional Tests:
1. Login with correct credentials → Success
2. Login with wrong password → Fail with error
3. Login → Navigate to admin page → Should stay logged in
4. Login → Refresh page → Should stay logged in
5. Login → Wait 5 minutes → Should auto-refresh token
6. Logout → Try accessing admin page → Redirect to login

---

## 📊 Overall Security Score

**Current Score: 4.5/10** ⚠️

**Breakdown:**
- ✅ **Working:** JWT authentication, audit logging, role-based access
- ⚠️ **Concerning:** Hardcoded credentials, cookie mismatches, no rate limiting
- ❌ **Missing:** CSRF protection, proper password storage, rate limiting

**Target Score: 9/10** (After implementing recommendations)

---

## 📝 Additional Resources

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Secure Cookie Attributes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#security)

---

**Report Generated:** February 11, 2026  
**Next Review:** February 18, 2026 (after fixes are implemented)

---

## 🚀 Quick Fix Script

Create a `.env.production` file with secure values:

```bash
#!/bin/bash
# generate-secure-env.sh

echo "Generating secure environment variables..."

# Generate secure JWT secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

cat > .env.production << EOF
# Secure production environment variables
JWT_SECRET=$JWT_SECRET
DISABLE_AUTH_IN_DEV=false
NODE_ENV=production

# TODO: Set actual admin credentials in database, not here!
# ADMIN_EMAIL=your-admin@example.com

# Add other production variables...
EOF

echo "✅ Secure .env.production generated!"
echo "⚠️ Remember to:"
echo "   1. Change admin passwords"
echo "   2. Set ADMIN_EMAIL in production"
echo "   3. Never commit this file to git!"
```

---

**Status:** 🔴 **Action Required**  
**Priority:** 🚨 **Critical**  
**Estimated Fix Time:** 4-6 hours for critical issues, 2 weeks for all issues
