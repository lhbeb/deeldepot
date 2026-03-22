# 🔧 Fix Admin Login Issue

## Problem
The admin login is failing with "Authentication failed" because the `admin_roles` table doesn't exist in your Supabase database.

## Solution

### Option 1: Run SQL in Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `vfuedgrheyncotoxseos`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste the Schema**
   - Open the file: `supabase-admin-rbac-system.sql`
   - Copy ALL the contents
   - Paste into the SQL Editor

4. **Run the Migration**
   - Click "Run" button (or press Cmd/Ctrl + Enter)
   - Wait for it to complete
   - You should see: "Admin RBAC system created successfully!"

5. **Verify**
   - Run this test script again:
     ```bash
     npx tsx test-admin-login-debug.ts
     ```
   - You should see: "✅ admin_roles table exists"

### Option 2: Use Supabase CLI (Alternative)

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref vfuedgrheyncotoxseos

# Run the migration
supabase db push --file supabase-admin-rbac-system.sql
```

## After Running the Migration

The migration will create:

1. **Tables:**
   - `admin_roles` - Stores admin users
   - `admin_permissions` - Defines permissions
   - `admin_audit_log` - Tracks admin actions

2. **Default Admin Accounts:**
   - **Regular Admin:**
     - Email: `elmahboubimehdi@gmail.com`
     - Password: `Localserver!!2`
     - Role: `REGULAR_ADMIN`
   
   - **Super Admin:**
     - Email: `Matrix01mehdi@gmail.com`
     - Password: `Mehbde!!2`
     - Role: `SUPER_ADMIN`

3. **Functions:**
   - `log_admin_action()` - Audit logging
   - `check_admin_permission()` - Permission checking

## Test the Login

After running the migration:

1. Go to: http://localhost:3000/admin/login
2. Enter:
   - Username: `elmahboubimehdi@gmail.com`
   - Password: `Localserver!!2`
3. Click "Sign In"
4. You should be redirected to: http://localhost:3000/admin/products

## Troubleshooting

If login still fails after running the migration:

1. **Verify the table exists:**
   ```bash
   npx tsx test-admin-login-debug.ts
   ```

2. **Check Supabase logs:**
   - Go to Supabase Dashboard → Logs
   - Look for any errors

3. **Clear browser cache:**
   - Clear localStorage
   - Clear cookies
   - Refresh the page

4. **Check environment variables:**
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

## Security Note

⚠️ **IMPORTANT:** The passwords in `supabase-admin-rbac-system.sql` are hardcoded in the application code (`src/lib/supabase/admin-auth.ts`). 

For production:
1. Change these passwords
2. Update them in both files
3. Consider using environment variables instead

---

**Status:** Ready to fix  
**Estimated Time:** 2-3 minutes  
**Difficulty:** Easy
