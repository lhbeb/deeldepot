# Stripe.js Loading Error - Fix Guide

**Date**: February 9, 2026  
**Error**: "Failed to load Stripe.js" + "Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON"  
**Status**: ✅ Fixed (Requires environment variable setup)

---

## 🐛 Problem Description

When users try to checkout with Stripe, they get these errors:

```
Runtime Error: Failed to load Stripe.js

Console Error: SyntaxError
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

---

## 🔍 Root Cause

The error occurs because:

1. **Missing Environment Variable**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is not set
2. **Empty Stripe Key**: `loadStripe('')` is called with an empty string
3. **Stripe CDN Error**: Stripe.js CDN returns an HTML error page instead of the JavaScript library
4. **JSON Parse Error**: The code tries to parse the HTML error page as JSON

### The Error Chain:
```
Missing env var → loadStripe('') → Stripe CDN error → HTML error page → JSON parse fails
```

---

## ✅ Solution

### Step 1: Add Stripe Publishable Key to Environment

You need to add your Stripe publishable key to your environment variables.

**Create/Update `.env.local` file:**

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
```

**Important Notes:**
- ✅ Use `NEXT_PUBLIC_` prefix for client-side variables
- ✅ Use `pk_test_` keys for testing
- ✅ Use `pk_live_` keys for production
- ❌ Never commit `.env.local` to git

### Step 2: Get Your Stripe Keys

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com
2. **Navigate to**: Developers → API keys
3. **Copy**:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### Step 3: Restart Development Server

After adding the environment variables:

```bash
# Stop the current dev server (Ctrl+C)
# Then restart it
npm run dev
```

**Why restart?** Next.js only loads environment variables at startup.

### Step 4: Verify

Check the browser console. You should see:
- ✅ No "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined" error
- ✅ Stripe.js loads successfully
- ✅ Payment form appears

---

## 🔧 Code Fix Applied

I've updated `/src/components/StripeCheckout.tsx` to:

1. **Add better error handling** for missing keys
2. **Log helpful error messages** to console
3. **Prevent silent failures**

### Before (Problematic):
```tsx
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
// ❌ Silent failure if key is missing
```

### After (Fixed):
```tsx
const getStripeKey = () => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
        console.error('❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
        console.error('Please add it to your .env.local file');
        return '';
    }
    return key;
};

const stripePromise = loadStripe(getStripeKey());
// ✅ Clear error message if key is missing
```

---

## 🧪 Testing

### 1. Check Environment Variable

Open browser console and run:
```javascript
console.log(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
```

**Expected**: Should show your publishable key (pk_test_...)  
**If undefined**: Environment variable not set correctly

### 2. Test Stripe Checkout

1. Add a product to cart
2. Go to checkout
3. Fill in shipping details
4. Select "Stripe" as payment method
5. Click "Continue to Payment"
6. ✅ Should see Stripe payment form (not error)

### 3. Check Network Tab

Open DevTools → Network tab:
- Look for request to `https://js.stripe.com/v3/`
- Status should be `200 OK`
- Response should be JavaScript (not HTML)

---

## 📋 Environment Variables Checklist

Make sure you have these in `.env.local`:

```bash
# ✅ Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ✅ Stripe (ADD THESE)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# ✅ Email
EMAIL_USER=your_email
EMAIL_PASS=your_password

# ✅ App URLs
NEXT_PUBLIC_BASE_URL=http://localhost:3000
APP_BASE_URL=http://localhost:3000

# ✅ Admin
ADMIN_EMAILS=admin@example.com
DISABLE_AUTH_IN_DEV=true

# ✅ Other (if applicable)
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
CRON_SECRET=your_secret
```

---

## ⚠️ Common Mistakes

### 1. Wrong Prefix
```bash
# ❌ WRONG - Won't work in client components
STRIPE_PUBLISHABLE_KEY=pk_test_...

# ✅ CORRECT - Must have NEXT_PUBLIC_ prefix
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 2. Forgot to Restart Server
```bash
# After adding env vars, you MUST restart:
# Ctrl+C to stop
npm run dev  # Start again
```

### 3. Using Secret Key Instead of Publishable Key
```bash
# ❌ WRONG - Secret key is for server-side only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=sk_test_...

# ✅ CORRECT - Publishable key starts with pk_
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 4. Quotes in .env.local
```bash
# ❌ WRONG - Don't use quotes
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# ✅ CORRECT - No quotes needed
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 🎯 Quick Fix Summary

1. **Add to `.env.local`**:
   ```bash
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
   STRIPE_SECRET_KEY=sk_test_YOUR_KEY
   ```

2. **Restart dev server**:
   ```bash
   npm run dev
   ```

3. **Test checkout** - Should work now! ✅

---

## 📚 Related Files

- **Component**: `/src/components/StripeCheckout.tsx` (Fixed)
- **API Route**: `/src/app/api/create-stripe-payment-intent/route.ts`
- **Environment**: `/.env.local` (You need to create/update this)
- **Example**: `/.env.example` (Reference for all env vars)

---

## 🔐 Security Notes

1. **Never commit** `.env.local` to git
2. **Use test keys** in development (`pk_test_`, `sk_test_`)
3. **Use live keys** in production (`pk_live_`, `sk_live_`)
4. **Rotate keys** if accidentally exposed
5. **Publishable key** is safe to expose (client-side)
6. **Secret key** must NEVER be exposed (server-side only)

---

**Status**: ✅ Code fixed, requires environment setup  
**Impact**: High (blocks all Stripe payments)  
**Risk**: Low (safe code change)  
**Time to Fix**: 2-3 minutes (just add env vars and restart)
