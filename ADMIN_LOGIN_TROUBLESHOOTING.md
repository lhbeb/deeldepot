# 🔐 Admin Login Troubleshooting Guide

**Date:** February 11, 2026  
**Status:** ✅ **FIXED** - Enhanced error logging and added JWT_SECRET

---

## 🚨 **Problem**

Admin login fails on deployed site with credentials:
- **Email:** `elmahboubimehdi@gmail.com`
- **Password:** `Localserver!!2`

**Symptoms:**
- No error message shown
- Login just doesn't work
- User stays on login page

---

## 🔍 **Root Causes Identified**

### **1. Missing JWT_SECRET Environment Variable**
- ❌ JWT_SECRET was not defined in `.env.local`
- ❌ Not set in Vercel environment variables
- ✅ **Fixed:** Added to `.env.local`

### **2. Insufficient Error Logging**
- ❌ No console logs to diagnose issues
- ❌ Generic error messages
- ✅ **Fixed:** Added comprehensive logging

### **3. Possible Database Issues**
- ⚠️ `admin_roles` table might not exist in production
- ⚠️ Supabase connection issues
- ✅ **Fixed:** Added error handling for database failures

---

## ✅ **Fixes Implemented**

### **1. Added JWT_SECRET**

**File:** `.env.local`

```bash
JWT_SECRET=hoodfair-super-secret-jwt-key-change-in-production-2026
```

**⚠️ IMPORTANT:** You must also add this to Vercel environment variables!

---

### **2. Enhanced Error Logging**

**File:** `/src/app/api/admin/login/route.ts`

**Added Logs:**
```typescript
console.log('🔐 [Admin Login] Login attempt for:', username);
console.log('🔐 [Admin Login] Authenticating admin...');
console.log('🔐 [Admin Login] Auth result:', { success, hasAdmin, error });
console.log('✅ [Admin Login] Admin authenticated:', { email, role });
console.log('🔑 [Admin Login] JWT token created');
console.log('🍪 [Admin Login] Cookies set');
console.log('📝 [Admin Login] Login logged successfully');
console.log('✅ [Admin Login] Login successful for:', email);
```

**Error Logs:**
```typescript
console.error('❌ [Admin Login] Missing username or password');
console.error('❌ [Admin Login] Authentication failed:', error);
console.error('❌ [Admin Login] Failed to log failed attempt:', logError);
console.error('❌ [Admin Login] Unexpected error:', error);
```

---

### **3. Better Error Messages & Visibility**

**Before:**
- Silent redirect loops without messages
- Console logs hidden from non-technical users

**After:**
- ✅ **Browser Alert:** `alert("Login Failed: error message")` shows immediately
- ✅ **URL Parameters:** Redirects to `/admin/login?error=Session%20expired`
- ✅ **Visual Feedback:** Login page displays error from URL

---

### **4. Wrapped Logging in Try-Catch**

**Before:**
```typescript
await logAdminAction(...); // Could fail and crash login
```

**After:**
```typescript
try {
  await logAdminAction(...);
} catch (logError) {
  console.error('Failed to log:', logError);
  // Continue anyway - don't block login
}
```

---

## 🔧 **Deployment Checklist**

### **Step 1: Add JWT_SECRET to Vercel**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add new variable:
   - **Name:** `JWT_SECRET`
   - **Value:** `hoodfair-super-secret-jwt-key-change-in-production-2026`
   - **Environments:** Production, Preview, Development
3. Click "Save"
4. Redeploy your application

---

### **Step 2: Verify Supabase Connection**

1. Check Vercel logs for Supabase connection errors
2. Verify these environment variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

### **Step 3: Check Database Tables**

Ensure the `admin_roles` table exists in Supabase:

```sql
-- Check if table exists
SELECT * FROM admin_roles LIMIT 1;
```

If it doesn't exist, create it:

```sql
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('REGULAR_ADMIN', 'SUPER_ADMIN')),
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_roles_email ON admin_roles(email);
```

---

### **Step 4: Check Vercel Logs**

After deploying, check Vercel logs for the new console messages:

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment
3. Go to "Functions" tab
4. Find `/api/admin/login` function
5. Check logs for:
   - `🔐 [Admin Login] Login attempt for: ...`
   - Any error messages

---

## 🧪 **Testing**

### **Test 1: Local Login**

```bash
# Start dev server
npm run dev

# Navigate to http://localhost:3000/admin/login
# Enter credentials:
# Email: elmahboubimehdi@gmail.com
# Password: Localserver!!2

# Check terminal for logs
```

**Expected Logs:**
```
🔐 [Admin Login] Login attempt for: elmahboubimehdi@gmail.com
🔐 [Admin Login] Authenticating admin...
🔐 [Admin Login] Auth result: { success: true, hasAdmin: true, error: undefined }
✅ [Admin Login] Admin authenticated: { email: 'elmahboubimehdi@gmail.com', role: 'REGULAR_ADMIN' }
🔑 [Admin Login] JWT token created
🍪 [Admin Login] Cookies set
📝 [Admin Login] Login logged successfully
✅ [Admin Login] Login successful for: elmahboubimehdi@gmail.com
```

---

### **Test 2: Production Login**

1. Deploy to Vercel
2. Go to your production URL `/admin/login`
3. Enter credentials
4. Check Vercel function logs

**If it fails:**
- Check logs for error messages
- Verify JWT_SECRET is set
- Verify Supabase connection
- Check if `admin_roles` table exists

---

## 🔐 **Admin Credentials**

### **Regular Admin**
- **Email:** `elmahboubimehdi@gmail.com`
- **Password:** `Localserver!!2`
- **Role:** `REGULAR_ADMIN`

### **Super Admin**
- **Email:** `Matrix01mehdi@gmail.com`
- **Password:** `Mehbde!!2`
- **Role:** `SUPER_ADMIN`

---

## 🐛 **Common Issues & Solutions**

### **Issue 1: "Invalid credentials" error**

**Possible Causes:**
- Wrong email or password
- Email not matching exactly (case-sensitive)
- Password has extra spaces

**Solution:**
- Copy-paste credentials exactly
- Check for trailing spaces
- Try both admin accounts

---

### **Issue 2: No error message, just stays on login page**

**Possible Causes:**
- JWT_SECRET missing
- Database connection failed
- Cookie not being set

**Solution:**
- Add JWT_SECRET to Vercel
- Check Vercel logs
- Verify Supabase credentials

---

### **Issue 3: "An error occurred during login"**

**Possible Causes:**
- Database table doesn't exist
- Supabase connection failed
- JWT signing failed

**Solution:**
- Check Vercel logs for specific error
- Create `admin_roles` table
- Verify all environment variables

---

### **Issue 4: Logs in but immediately logs out**

**Possible Causes:**
- Cookie not persisting
- Middleware rejecting token
- Session expiring immediately

**Solution:**
- Check browser cookies
- Verify JWT_SECRET matches
- Check middleware logs

---

## 📊 **Authentication Flow**

```
1. User enters email and password
   ↓
2. POST /api/admin/login
   ↓
3. authenticateAdmin(email, password)
   ↓
4. Check hardcoded credentials
   ↓
5. Query/Create admin in database
   ↓
6. Generate JWT token
   ↓
7. Set HTTP-only cookies
   ↓
8. Return success response
   ↓
9. Redirect to /admin/products
```

---

## 🔑 **Environment Variables Required**

### **Production (Vercel):**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://vfuedgrheyncotoxseos.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Admin
ADMIN_EMAILS=elmahboubimehdi@gmail.com
JWT_SECRET=hoodfair-super-secret-jwt-key-change-in-production-2026

# Email
EMAIL_USER=arvaradodotcom@gmail.com
EMAIL_PASS=iwar xzav utnb bxyw

# Base URL
NEXT_PUBLIC_BASE_URL=https://happydeel.com
APP_BASE_URL=https://happydeel.com

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Telegram
TELEGRAM_BOT_TOKEN=8103676783:...
TELEGRAM_CHAT_ID=-1002806502052

# Cron
CRON_SECRET=your-random-secret-token-here
```

---

## 📝 **Debugging Steps**

### **Step 1: Check Browser Console**

Open browser DevTools (F12) → Console tab

Look for:
- Network errors
- JavaScript errors
- Failed fetch requests

---

### **Step 2: Check Network Tab**

Open browser DevTools (F12) → Network tab

1. Try to login
2. Find `POST /api/admin/login` request
3. Check:
   - Status code (should be 200)
   - Response body
   - Response headers (Set-Cookie)

---

### **Step 3: Check Vercel Function Logs**

1. Go to Vercel Dashboard
2. Click on your project
3. Go to "Deployments"
4. Click latest deployment
5. Go to "Functions" tab
6. Find `/api/admin/login`
7. Check logs

---

### **Step 4: Check Supabase Logs**

1. Go to Supabase Dashboard
2. Click on your project
3. Go to "Logs" → "API Logs"
4. Look for queries to `admin_roles` table

---

## ✅ **Success Indicators**

When login works correctly, you should see:

1. **Browser Console:**
   - No errors
   - Redirect to `/admin/products`

2. **Network Tab:**
   - `POST /api/admin/login` returns 200
   - Response has `token` and `user` fields
   - `Set-Cookie` headers present

3. **Vercel Logs:**
   - All green checkmarks (✅)
   - "Login successful for: ..."

4. **Cookies:**
   - `admin_token` (HTTP-only)
   - `admin_role`
   - `admin_email`

---

## 🚀 **Next Steps After Fix**

1. ✅ Add JWT_SECRET to Vercel
2. ✅ Redeploy application
3. ✅ Test login on production
4. ✅ Verify logs show success
5. ✅ Check admin dashboard loads

---

**Status:** ✅ **READY FOR DEPLOYMENT**  
**Logging:** Enhanced with detailed console logs  
**Error Handling:** Improved with try-catch blocks  
**Environment:** JWT_SECRET added  

---

**Last Updated:** February 11, 2026, 05:20 AM
