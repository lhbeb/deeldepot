# ✅ Admin Role Permissions - Feature/Unfeature Products

**Date:** February 13, 2026  
**Status:** ✅ **ALREADY WORKING**  

---

## 🎯 Summary

**Regular admins already have full access to feature/unfeature products.**

Both SUPER_ADMIN and ADMIN roles can:
- ✅ Feature products (up to 6 limit)
- ✅ Unfeature products
- ✅ See featured status in dashboard
- ✅ Use the feature toggle button

---

## 🔐 Current Permission Structure

### **SUPER_ADMIN Permissions**
1. ✅ Create products
2. ✅ Read/view products
3. ✅ Update products
4. ✅ **Delete products** ⚠️ (Exclusive to Super Admin)
5. ✅ Feature/unfeature products
6. ✅ Toggle stock status
7. ✅ Export products
8. ✅ Manage admin users

### **ADMIN (Regular) Permissions**
1. ✅ Create products
2. ✅ Read/view products
3. ✅ Update products
4. ❌ Delete products (Only Super Admin)
5. ✅ **Feature/unfeature products** ✅ (Already enabled)
6. ✅ Toggle stock status
7. ✅ Export products
8. ❌ Manage admin users

---

## 📂 Implementation Details

### **Frontend (Admin Dashboard)**

**File:** `src/app/admin/products/page.tsx`

**Feature Toggle Button (Lines 729-746):**
```typescript
<button
  onClick={(e) => {
    e.preventDefault();
    handleToggleFeatured(product.slug);
  }}
  disabled={togglingFeatured === product.slug || (!(product.isFeatured || product.is_featured) && featuredCount >= FEATURE_LIMIT)}
  className={`p-2 rounded-lg transition-colors ${(product.isFeatured || product.is_featured)
    ? 'bg-amber-500 hover:bg-amber-600'
    : 'bg-white hover:bg-gray-100'
    } disabled:opacity-50`}
  title={(product.isFeatured || product.is_featured) ? 'Remove from featured' : 'Add to featured'}
>
  {togglingFeatured === product.slug ? (
    <RefreshCw className={`h-4 w-4 animate-spin ${(product.isFeatured || product.is_featured) ? 'text-white' : 'text-gray-700'}`} />
  ) : (
    <Star className={`h-4 w-4 ${(product.isFeatured || product.is_featured) ? 'text-white fill-white' : 'text-gray-700'}`} />
  )}
</button>
```

**Note:** No `adminRole === 'SUPER_ADMIN'` check on this button (unlike the delete button on lines 764-777).

### **Backend (API Route)**

**File:** `src/app/api/admin/products/[slug]/feature/route.ts`

**Authentication Check (Lines 75-79):**
```typescript
// Check authentication
const auth = await getAdminAuth(request);
if (!auth) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**No Role Check:** The API only verifies that the user is authenticated as an admin, but doesn't check if they're a SUPER_ADMIN specifically.

**Feature Limit Check (Lines 92-99):**
```typescript
// If trying to feature a product, check limit
if (newFeaturedStatus) {
  try {
    await assertFeaturedLimit(true);
  } catch (limitError: any) {
    const status = limitError.statusCode || 500;
    return NextResponse.json({ error: limitError.message }, { status });
  }
}
```

This applies to **all admins** equally - both Super Admin and Regular Admin.

---

## 🔑 Authentication Flow

```
┌────────────────────────────────────────────────────────┐
│         FEATURE/UNFEATURE AUTHENTICATION FLOW          │
└────────────────────────────────────────────────────────┘

1. User clicks feature/unfeature button
   └─> Frontend: handleToggleFeatured(slug)

2. Frontend checks feature limit (client-side)
   ├─> If trying to feature AND limit reached (6)
   │   └─> Show error, don't send request
   └─> Otherwise, proceed

3. POST /api/admin/products/[slug]/feature
   └─> Headers: Authorization: Bearer {token}

4. Backend: getAdminAuth(request)
   ├─> Check admin_token cookie
   ├─> Verify JWT token
   └─> Check isAdmin() status
       ├─> ✅ Is admin (SUPER_ADMIN or ADMIN)
       │   └─> Return auth token
       └─> ❌ Not admin
           └─> Return 401 Unauthorized

5. Backend: Get current product
   └─> const newFeaturedStatus = !current.isFeatured

6. Backend: Check feature limit (if featuring)
   ├─> Count featured products
   └─> If >= 6, return 400 error

7. Backend: Update product
   └─> updateProduct(slug, { is_featured, isFeatured })

8. Frontend: Update local state
   └─> Refresh product list
```

---

## 🎨 UI Permissions

### **Products Page Actions**

| Action | Super Admin | Regular Admin |
|--------|-------------|---------------|
| View products | ✅ | ✅ |
| Search/filter | ✅ | ✅ |
| Create product | ✅ | ✅ |
| Edit product | ✅ | ✅ |
| **Feature/unfeature** | ✅ | ✅ |
| Toggle stock | ✅ | ✅ |
| Export products | ✅ | ✅ |
| **Delete product** | ✅ | ❌ |

### **Permission Checks in Code**

**Delete Button (SUPER_ADMIN only):**
```typescript
{/* Only SUPER_ADMIN can delete products */}
{adminRole === 'SUPER_ADMIN' && (
  <button onClick={() => handleDelete(product.slug)}>
    <Trash2 />
  </button>
)}
```

**Feature Button (All admins):**
```typescript
{/* No role check - available to all admins */}
<button onClick={() => handleToggleFeatured(product.slug)}>
  <Star />
</button>
```

---

## 📊 Feature Management

### **Feature Limit**
- **Maximum:** 6 featured products
- **Enforced:** Both frontend and backend
- **Applies to:** All admin roles

### **Featured Product Count Display**
```
56 products • 45 published • 11 drafts • 6/6 featured • 3 sold out
                                          ↑
                         Shows current/max featured count
```

### **Feature Limit Validation**

**Frontend (Client-side):**
```typescript
const featureLimitReached = featuredCount >= FEATURE_LIMIT;

if (!isCurrentlyFeatured && featureLimitReached) {
  setError(`Maximum of ${FEATURE_LIMIT} featured products reached. Unfeature another product first.`);
  return;
}
```

**Backend (Server-side):**
```typescript
async function assertFeaturedLimit(canFeature: boolean) {
  if (!canFeature) return;

  const { count } = await supabaseAdmin
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_featured', true);

  if ((count ?? 0) >= FEATURE_LIMIT) {
    throw new Error(`Maximum of ${FEATURE_LIMIT} featured products reached.`);
  }
}
```

---

## ✅ Testing Checklist

To verify regular admins can feature/unfeature:

1. **Login as Regular Admin**
   ```
   Email: [regular admin email]
   Role: ADMIN
   ```

2. **Navigate to Products Page**
   ```
   /admin/products
   ```

3. **Test Feature Toggle**
   - ✅ Click star icon on a product
   - ✅ Product should become featured (gold star)
   - ✅ Click star icon again
   - ✅ Product should be unfeatured

4. **Test Feature Limit**
   - ✅ Feature 6 products
   - ✅ Try to feature a 7th product
   - ✅ Should show error: "Maximum of 6 featured products reached"

5. **Test Delete Restriction**
   - ❌ Delete button should NOT be visible
   - ✅ Only Super Admins can delete

---

## 🚀 Deployment Status

**Current State:** ✅ **WORKING AS INTENDED**

- Regular admins have full access to feature/unfeature
- No code changes needed
- Feature limit enforced for all admin roles
- Delete permission correctly restricted to Super Admin only

---

## 📝 Role Comparison

### **What SUPER_ADMIN can do that ADMIN cannot:**

1. **Delete Products** ⚠️
   - Remove products from database
   - Permanent action

2. **Manage Admin Users** ⚠️
   - Create new admin accounts
   - Deactivate admin accounts
   - Change admin roles

### **What both roles can do:**

1. **Feature Management** ✅
   - Feature products (up to 6)
   - Unfeature products
   - Subject to same 6-product limit

2. **Product CRUD** ✅
   - Create new products
   - Edit existing products
   - Toggle stock status
   - Bulk export

---

## 🎯 Conclusion

**Regular admins already have full access to feature/unfeature products.**

This is the intended behavior - the feature limit (6 products) is a business rule that applies to all admins equally, not a permission restriction. The only permission difference between SUPER_ADMIN and ADMIN is:

- ⚠️ **Delete products** (Super Admin only)
- ⚠️ **Manage admin users** (Super Admin only)

Everything else, including **feature/unfeature**, is available to both roles.

---

**Status:** ✅ NO CHANGES NEEDED  
**Verified:** February 13, 2026
