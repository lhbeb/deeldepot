# 🔐 Stripe API Keys Location & Security

**Date:** February 11, 2026  
**Status:** ⚠️ **SECURITY WARNING - LIVE KEYS IN USE**

---

## 📍 **Where Stripe API Keys Live**

### ✅ **Correct Location: Environment Variables**

Your Stripe API keys are **properly stored in environment variables**, NOT hardcoded in the source code.

**File:** `.env.local` (lines 46-47)

```bash
# ============================================
# STRIPE CONFIGURATION
# ============================================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51SqSvCBf3Y77Xr3G...
STRIPE_SECRET_KEY=sk_live_51SqSvCBf3Y77Xr3G...
```

---

## 🔑 **Two Types of Keys**

### 1. **Publishable Key** (Client-Side)
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51SqSvCBf3Y77Xr3G...
```

**Characteristics:**
- ✅ **Prefix:** `NEXT_PUBLIC_` (exposed to browser)
- ✅ **Starts with:** `pk_live_` (live mode) or `pk_test_` (test mode)
- ✅ **Used in:** Client-side components (browser)
- ✅ **Safe to expose:** Yes, it's meant to be public
- ✅ **Location:** `/src/config/stripe.ts`

**Usage:**
```typescript
// src/config/stripe.ts
export const stripeConfig = {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
};
```

---

### 2. **Secret Key** (Server-Side)
```bash
STRIPE_SECRET_KEY=sk_live_51SqSvCBf3Y77Xr3G...
```

**Characteristics:**
- ⚠️ **No prefix:** NOT exposed to browser
- ⚠️ **Starts with:** `sk_live_` (live mode) or `sk_test_` (test mode)
- ⚠️ **Used in:** Server-side API routes only
- ⚠️ **Safe to expose:** NO! Must be kept secret
- ⚠️ **Location:** Server-side API routes

**Usage:**
```typescript
// src/app/api/create-stripe-checkout/route.ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});
```

```typescript
// src/app/api/create-stripe-payment-intent/route.ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});
```

---

## 🚨 **CRITICAL SECURITY WARNING**

### ⚠️ **You Are Using LIVE Keys!**

Your `.env.local` file contains **LIVE Stripe keys** (not test keys):

```
pk_live_51SqSvCBf3Y77Xr3G...  ← LIVE publishable key
sk_live_51SqSvCBf3Y77Xr3G...  ← LIVE secret key
```

**This means:**
- 💳 **Real payments** are being processed
- 💰 **Real money** is being charged
- 🏦 **Real bank transfers** will occur
- ⚠️ **Any mistakes** will affect real customers and real money

**Warning in your `.env.local` (lines 40-42):**
```bash
# ⚠️ WARNING: THESE KEYS WERE EXPOSED PUBLICLY
# ⚠️ YOU MUST REVOKE THEM AT: https://dashboard.stripe.com/apikeys
# ⚠️ AND GENERATE NEW KEYS IMMEDIATELY
```

---

## 🔒 **Security Best Practices**

### ✅ **What You're Doing Right**

1. **Environment Variables**
   - ✅ Keys are in `.env.local` (not hardcoded)
   - ✅ `.env.local` is in `.gitignore` (not committed to Git)
   - ✅ Using `process.env` to access keys

2. **Separation of Concerns**
   - ✅ Publishable key in client config
   - ✅ Secret key only in server-side API routes

---

### ⚠️ **What Needs Improvement**

1. **Use Test Keys in Development**
   ```bash
   # DEVELOPMENT (.env.local)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  ← Test key
   STRIPE_SECRET_KEY=sk_test_...                   ← Test key
   ```

   ```bash
   # PRODUCTION (.env.production)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  ← Live key
   STRIPE_SECRET_KEY=sk_live_...                   ← Live key
   ```

2. **Rotate Exposed Keys**
   - The warning says these keys were exposed publicly
   - You should revoke them and generate new ones
   - Visit: https://dashboard.stripe.com/apikeys

3. **Add Key Validation**
   ```typescript
   // Add to your API routes
   if (!process.env.STRIPE_SECRET_KEY) {
     throw new Error('STRIPE_SECRET_KEY is not configured');
   }
   
   if (process.env.NODE_ENV === 'production' && 
       !process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
     throw new Error('Production must use live Stripe keys');
   }
   ```

---

## 📂 **File Structure**

### Environment Files
```
hoodfair/
├── .env.local              ← Your local environment (Stripe keys here)
├── .env.example            ← Template for other developers
└── .env                    ← Base environment file
```

### Code Files Using Stripe
```
src/
├── config/
│   └── stripe.ts           ← Client config (publishable key)
└── app/api/
    ├── create-stripe-checkout/
    │   └── route.ts        ← Server route (secret key)
    └── create-stripe-payment-intent/
        └── route.ts        ← Server route (secret key)
```

---

## 🔍 **How Keys Are Used**

### Client-Side (Browser)
```typescript
// src/config/stripe.ts
export const stripeConfig = {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
};

// Used in components
import { stripeConfig } from '@/config/stripe';
const stripe = await loadStripe(stripeConfig.publishableKey);
```

**Flow:**
```
.env.local
  ↓
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ↓
Bundled into client JavaScript
  ↓
Sent to browser
  ↓
Used to initialize Stripe.js
```

---

### Server-Side (API Routes)
```typescript
// src/app/api/create-stripe-checkout/route.ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

// Used to create checkout sessions
const session = await stripe.checkout.sessions.create({...});
```

**Flow:**
```
.env.local
  ↓
STRIPE_SECRET_KEY
  ↓
Loaded in Node.js server
  ↓
NEVER sent to browser
  ↓
Used to call Stripe API
```

---

## ✅ **Verification Checklist**

### Current Status
- [x] Keys are in environment variables (not hardcoded)
- [x] `.env.local` is in `.gitignore`
- [x] Publishable key has `NEXT_PUBLIC_` prefix
- [x] Secret key has NO prefix
- [x] Secret key only used in API routes
- [ ] ⚠️ Using test keys in development
- [ ] ⚠️ Keys have been rotated (if exposed)
- [ ] ⚠️ Production uses separate live keys

---

## 🎯 **Recommended Actions**

### Immediate (High Priority)

1. **Get Test Keys**
   - Go to: https://dashboard.stripe.com/test/apikeys
   - Copy your test publishable key (`pk_test_...`)
   - Copy your test secret key (`sk_test_...`)

2. **Update `.env.local` for Development**
   ```bash
   # Use TEST keys for development
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY
   STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY
   ```

3. **Rotate Live Keys (if exposed)**
   - Go to: https://dashboard.stripe.com/apikeys
   - Click "Delete" on the exposed keys
   - Generate new live keys
   - Update production environment variables

---

### Long-Term (Best Practices)

1. **Separate Environments**
   ```bash
   # .env.local (development)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   
   # .env.production (production)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```

2. **Add Environment Detection**
   ```typescript
   // src/config/stripe.ts
   const isProduction = process.env.NODE_ENV === 'production';
   const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
   
   // Validate key matches environment
   if (isProduction && !publishableKey.startsWith('pk_live_')) {
     console.warn('⚠️ Production should use live Stripe keys');
   }
   if (!isProduction && publishableKey.startsWith('pk_live_')) {
     console.warn('⚠️ Development should use test Stripe keys');
   }
   ```

3. **Use Vercel Environment Variables**
   - Store production keys in Vercel dashboard
   - Never commit live keys to Git
   - Use different keys per environment

---

## 📊 **Summary**

| Aspect | Status | Notes |
|--------|--------|-------|
| **Storage Method** | ✅ Environment Variables | Correct approach |
| **Not Hardcoded** | ✅ Yes | Good security practice |
| **Publishable Key** | ✅ Properly exposed | Has `NEXT_PUBLIC_` prefix |
| **Secret Key** | ✅ Server-side only | Never sent to browser |
| **Test vs Live** | ⚠️ Using LIVE keys | Should use TEST in dev |
| **Key Rotation** | ⚠️ May be exposed | Check warning in .env.local |
| **Git Security** | ✅ Not committed | .env.local in .gitignore |

---

## 🔗 **Useful Links**

- **Stripe Dashboard:** https://dashboard.stripe.com
- **API Keys (Live):** https://dashboard.stripe.com/apikeys
- **API Keys (Test):** https://dashboard.stripe.com/test/apikeys
- **Stripe Docs:** https://stripe.com/docs/keys
- **Security Best Practices:** https://stripe.com/docs/security/guide

---

## 🎓 **Key Takeaways**

1. **Your keys ARE in environment variables** ✅
   - Not hardcoded in source files
   - Properly separated (client vs server)

2. **You're using LIVE keys** ⚠️
   - Real payments are being processed
   - Should use TEST keys in development

3. **Keys may have been exposed** ⚠️
   - Warning in .env.local suggests this
   - Should rotate keys immediately

4. **Best practice: Separate environments**
   - Test keys for development
   - Live keys for production only
   - Never mix them up

---

**Status:** ✅ **Properly stored in environment variables**  
**Security:** ⚠️ **Using LIVE keys (should use TEST in dev)**  
**Action Required:** Rotate keys if exposed, use test keys in development

---

**Last Updated:** February 11, 2026, 03:00 AM
