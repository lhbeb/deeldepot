# Checkout Flow Update Error - Fix Guide

**Date**: February 9, 2026  
**Issue**: Cannot update product checkout_flow to 'stripe'  
**Error**: "Product update failed for slug: [slug]. The product may not exist or there may be a database issue."

---

## 🐛 Problem Description

When trying to update a product's `checkout_flow` from `buymeacoffee` to `stripe`, the update fails with an error message.

**Specific Error:**
```
Product update failed for slug: canon-powershot-sx740-hs-20mp-40x-zoom-4k-digital-point-shoot-camera. 
The product may not exist or there may be a database issue.
```

---

## 🔍 Root Cause

The database has a **CHECK constraint** on the `checkout_flow` column that only allows these values:
- `'buymeacoffee'`
- `'kofi'`
- `'external'`

**'stripe' is NOT in the allowed values**, so the database rejects the update.

### Current Constraint (BLOCKING):
```sql
ALTER TABLE products 
ADD CONSTRAINT products_checkout_flow_check 
CHECK (checkout_flow IN ('buymeacoffee', 'kofi', 'external'));
-- ❌ 'stripe' is missing!
```

---

## ✅ Solution

You need to run a database migration to update the CHECK constraint to include 'stripe'.

### Option 1: Run the Migration File (RECOMMENDED)

A migration file already exists: `supabase-add-stripe-checkout-flow.sql`

**Steps:**
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy the contents of `supabase-add-stripe-checkout-flow.sql`
4. Paste and run the SQL
5. Verify the constraint was updated

### Option 2: Run This Quick Fix SQL

If you want a quick fix, run this SQL in your Supabase SQL Editor:

```sql
-- Drop the old constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_checkout_flow_check;

-- Add new constraint with 'stripe' included
ALTER TABLE products 
ADD CONSTRAINT products_checkout_flow_check 
CHECK (checkout_flow IN ('buymeacoffee', 'kofi', 'external', 'stripe'));
```

### Option 3: Run the All-in-One Migration

There's also a comprehensive migration: `supabase-stripe-all-in-one.sql`

This includes:
- Adding the `checkout_flow` column (if missing)
- Updating the constraint to include 'stripe'
- Creating necessary indexes
- Setting up default values

---

## 🧪 Verification

After running the migration, verify it worked:

### 1. Check the Constraint
```sql
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'products_checkout_flow_check';
```

**Expected Result:**
```
conname: products_checkout_flow_check
consrc: CHECK (checkout_flow IN ('buymeacoffee', 'kofi', 'external', 'stripe'))
```

### 2. Test the Update
Try updating a product's checkout_flow to 'stripe':

```sql
UPDATE products 
SET checkout_flow = 'stripe'
WHERE slug = 'canon-powershot-sx740-hs-20mp-40x-zoom-4k-digital-point-shoot-camera'
RETURNING slug, checkout_flow;
```

**Expected Result:**
```
slug: canon-powershot-sx740-hs-20mp-40x-zoom-4k-digital-point-shoot-camera
checkout_flow: stripe
```

### 3. Test via Admin Dashboard
1. Go to `/admin/products`
2. Edit the product
3. Change checkout flow to "Stripe"
4. Save
5. ✅ Should succeed without errors

---

## 📋 Migration Files Available

You have these migration files in your project:

1. **`supabase-add-checkout-flow.sql`**
   - Original migration (only buymeacoffee, kofi, external)
   - ❌ Does NOT include 'stripe'

2. **`supabase-add-stripe-checkout-flow.sql`** ⭐ **USE THIS**
   - Adds 'stripe' to the constraint
   - Safe to run (checks for existing constraint)
   - Recommended for this fix

3. **`supabase-stripe-all-in-one.sql`**
   - Comprehensive migration for Stripe integration
   - Includes checkout_flow update + other Stripe features
   - Good for fresh installations

---

## 🎯 Step-by-Step Fix

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run the Migration
1. Click **New Query**
2. Copy the contents of `supabase-add-stripe-checkout-flow.sql`:

```sql
-- Add 'stripe' to checkout_flow options

-- Drop the existing constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_checkout_flow_check'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_checkout_flow_check;
  END IF;
END $$;

-- Add new constraint with stripe included
ALTER TABLE products 
ADD CONSTRAINT products_checkout_flow_check 
CHECK (checkout_flow IN ('buymeacoffee', 'kofi', 'external', 'stripe'));

-- Create index for faster filtering by checkout flow (if not exists)
CREATE INDEX IF NOT EXISTS idx_products_checkout_flow ON products(checkout_flow);
```

3. Click **Run** (or press Ctrl/Cmd + Enter)
4. Wait for "Success" message

### Step 3: Verify
Run this query to confirm:

```sql
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'products_checkout_flow_check';
```

You should see 'stripe' in the definition.

### Step 4: Test the Update
Now try updating your product again via the admin dashboard.

---

## 🔧 Technical Details

### Why This Happens

1. **Database Constraint**: PostgreSQL CHECK constraints validate data before allowing updates
2. **Migration Order**: The original `supabase-add-checkout-flow.sql` was run first
3. **Missing Update**: The Stripe migration wasn't run to update the constraint
4. **Silent Failure**: The update returns 0 rows (constraint violation), not an explicit error

### The Update Flow

```
Admin Dashboard → API Route → updateProduct() → Supabase UPDATE
                                                      ↓
                                                CHECK Constraint
                                                      ↓
                                    ❌ 'stripe' not in allowed values
                                                      ↓
                                            Update returns 0 rows
                                                      ↓
                                            Error: "Product update failed"
```

### After Fix

```
Admin Dashboard → API Route → updateProduct() → Supabase UPDATE
                                                      ↓
                                                CHECK Constraint
                                                      ↓
                                    ✅ 'stripe' is allowed
                                                      ↓
                                            Update succeeds
                                                      ↓
                                            Product updated successfully
```

---

## 📚 Related Files

- **Migration File**: `/supabase-add-stripe-checkout-flow.sql`
- **API Route**: `/src/app/api/admin/products/[slug]/route.ts`
- **Update Function**: `/src/lib/supabase/products.ts` (updateProduct)
- **Type Definition**: `/src/types/product.ts`

---

## ⚠️ Important Notes

1. **Run in Production**: Make sure to run this migration in your production Supabase instance
2. **Backup First**: Always backup your database before running migrations
3. **Test After**: Test updating a product to 'stripe' after the migration
4. **No Data Loss**: This migration only updates the constraint, no data is modified

---

## 🎓 Prevention

To prevent this in the future:

1. **Check Migrations**: Always verify all migrations are run in production
2. **Migration Tracking**: Keep a log of which migrations have been run
3. **Test Constraints**: Test all enum/constraint values in development first
4. **Documentation**: Document required migrations for new features

---

**Status**: ⚠️ Requires database migration  
**Impact**: High (blocks Stripe checkout flow updates)  
**Risk**: Low (safe migration, no data changes)  
**Time to Fix**: 2-3 minutes
