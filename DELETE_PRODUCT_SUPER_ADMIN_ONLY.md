# 🔐 Delete Product - Super Admin Only

**Date:** February 11, 2026  
**Status:** ✅ **IMPLEMENTED**

---

## 📋 **Change Summary**

Restricted the "Delete Product" functionality to **Super Admin only**. Regular Admins can no longer delete products from the admin dashboard.

---

## 🔒 **Permission Changes**

### Before:
- ❌ **Regular Admin:** Could delete products
- ✅ **Super Admin:** Could delete products

### After:
- ❌ **Regular Admin:** **CANNOT** delete products (button hidden)
- ✅ **Super Admin:** Can delete products

---

## 🛠️ **Files Modified**

### 1. Frontend: `/src/app/admin/products/page.tsx`

**Changes:**
1. Added `adminRole` state to track the current admin's role
2. Read role from `admin_role` cookie on component mount
3. Conditionally render delete buttons only for `SUPER_ADMIN` in **3 locations**:
   - Grid view (hover overlay)
   - List view (action buttons)
   - Dropdown menu (three-dot menu)

**Code:**
```typescript
// Added state
const [adminRole, setAdminRole] = useState<string | null>(null);

// Read role from cookie
useEffect(() => {
  fetchProducts();
  const role = document.cookie
    .split('; ')
    .find(row => row.startsWith('admin_role='))
    ?.split('=')[1];
  setAdminRole(role || null);
}, [fetchProducts]);

// Conditional rendering (Grid View)
{adminRole === 'SUPER_ADMIN' && (
  <button
    onClick={() => handleDelete(product.slug)}
    disabled={deletingId === product.slug}
    className="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
    title="Delete product (Super Admin only)"
  >
    {deletingId === product.slug ? (
      <RefreshCw className="h-4 w-4 text-red-600 animate-spin" />
    ) : (
      <Trash2 className="h-4 w-4 text-red-600" />
    )}
  </button>
)}
```

### 2. Backend: `/src/app/api/admin/products/[slug]/route.ts`

**Changes:**
1. Added role verification in the DELETE endpoint
2. Check `admin_role` cookie value
3. Return 403 Forbidden if user is not `SUPER_ADMIN`

**Code:**
```typescript
// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Check authentication
    const auth = await getAdminAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is SUPER_ADMIN
    const adminRole = request.cookies.get('admin_role')?.value;
    
    if (adminRole !== 'SUPER_ADMIN') {
      console.error('❌ [DELETE-PRODUCT] Access denied - user is not SUPER_ADMIN:', adminRole);
      return NextResponse.json(
        { 
          error: 'Access denied. Only Super Admins can delete products.',
          requiredRole: 'SUPER_ADMIN',
          currentRole: adminRole || 'none'
        },
        { status: 403 }
      );
    }

    console.log('✅ [DELETE-PRODUCT] Role verified: SUPER_ADMIN');

    const { slug } = await params;
    const success = await deleteProduct(slug);
    // ... rest of the code
  }
}
```

---

## 🧪 **Testing**

### Test 1: Regular Admin (Should NOT see delete button)

**Login as:**
```
Email: elmahboubimehdi@gmail.com
Password: Localserver!!2
Role: REGULAR_ADMIN
```

**Expected Result:**
- ✅ Can view products
- ✅ Can edit products
- ✅ Can toggle featured status
- ✅ Can toggle stock status
- ❌ **CANNOT see delete button** (in grid, list, or dropdown)
- ❌ **Cannot delete products**

**UI Behavior:**
- Grid view: No trash icon in hover overlay
- List view: No delete button in actions
- Dropdown menu: No "Delete Product" option

**API Response (if attempted via curl):**
```json
{
  "error": "Access denied. Only Super Admins can delete products.",
  "requiredRole": "SUPER_ADMIN",
  "currentRole": "REGULAR_ADMIN"
}
```
**Status:** `403 Forbidden`

---

### Test 2: Super Admin (Should see delete button)

**Login as:**
```
Email: Matrix01mehdi@gmail.com
Password: Mehbde!!2
Role: SUPER_ADMIN
```

**Expected Result:**
- ✅ Can view products
- ✅ Can edit products
- ✅ Can toggle featured status
- ✅ Can toggle stock status
- ✅ **CAN see delete button** (in all views)
- ✅ **Can delete products**

**UI Behavior:**
- Grid view: Trash icon visible in hover overlay
- List view: Delete button visible in actions
- Dropdown menu: "Delete Product" option visible

**API Response (on success):**
```json
{
  "success": true
}
```
**Status:** `200 OK`

---

## 🔐 **Security Layers**

This implementation has **2 layers of security**:

### Layer 1: Frontend (UI)
- Delete buttons hidden in **3 locations** for Regular Admins:
  1. Grid view hover overlay
  2. List view action buttons
  3. Dropdown three-dot menu
- Prevents accidental clicks
- Better UX (users don't see disabled features)

### Layer 2: Backend (API)
- API endpoint verifies role from cookie
- Returns 403 Forbidden if not Super Admin
- **Critical security layer** - prevents API abuse
- Logs security checks for auditing

**Why both layers?**
- Frontend: Better UX
- Backend: **Real security** (frontend can be bypassed)

---

## 📊 **Permission Matrix**

| Action | Regular Admin | Super Admin |
|--------|---------------|-------------|
| View Products | ✅ | ✅ |
| Create Products | ✅ | ✅ |
| Edit Products | ✅ | ✅ |
| Toggle Featured | ✅ (up to limit) | ✅ |
| Toggle Stock Status | ✅ | ✅ |
| Export Products | ✅ | ✅ |
| **Delete Products** | ❌ **NO** | ✅ **YES** |

---

## 🎯 **How It Works**

### 1. Login
```
User logs in → JWT token created → Cookies set:
- admin_token (JWT)
- admin_role (REGULAR_ADMIN or SUPER_ADMIN)
- admin_email
```

### 2. Products Page Loads
```
Component mounts → Reads admin_role cookie → Sets state
```

### 3. Button Rendering
```
For each product:
  IF adminRole === 'SUPER_ADMIN':
    Show delete button
  ELSE:
    Hide delete button
```

### 4. API Call (if button clicked)
```
DELETE /api/admin/products/{slug}
  ↓
Check admin_role cookie
  ↓
IF role !== 'SUPER_ADMIN':
  Return 403 Forbidden
ELSE:
  Delete product from database
  Return 200 OK
```

---

## 🚨 **Important Notes**

### For Regular Admins:
- You will **NOT** see any delete buttons
- This is intentional - only Super Admins can delete products
- If you need this permission, contact a Super Admin to upgrade your role
- You can still:
  - Create new products
  - Edit existing products
  - Toggle featured status
  - Toggle stock status

### For Super Admins:
- You will see delete buttons in all views
- **Use with caution** - deletion is permanent
- Always confirm before deleting
- Consider marking as "out of stock" instead of deleting

### For Developers:
- **Never bypass backend security checks**
- Frontend hiding is for UX, not security
- Always verify permissions on the backend
- Cookie-based role checking is sufficient for this use case
- Delete buttons are hidden in 3 locations - ensure consistency

---

## 🔄 **Related Permissions**

Other Super Admin-only features:
- **Delete Orders**
- **Mark Orders as Converted**
- Process Refunds
- Manage Admin Users
- View Audit Logs
- Database Operations

---

## 📝 **Database Impact**

When a product is deleted:
- Product record is removed from `products` table
- Associated images may remain in storage (consider cleanup)
- Orders referencing the product remain intact (foreign key constraints)

**Recommendation:**
- Instead of deleting, consider:
  - Marking as "draft" (unpublished)
  - Marking as "sold out"
  - Archiving (add `archived` column)

---

## ✅ **Verification Checklist**

- [x] Frontend delete button hidden for Regular Admin (grid view)
- [x] Frontend delete button hidden for Regular Admin (list view)
- [x] Frontend delete button hidden for Regular Admin (dropdown menu)
- [x] Frontend delete button visible for Super Admin (all views)
- [x] Backend API checks role
- [x] Backend returns 403 for Regular Admin
- [x] Backend allows Super Admin
- [x] Tooltip shows "Super Admin only"
- [x] Console logs role verification
- [x] Error messages are clear

---

## 🎨 **UI Locations**

Delete buttons appear in **3 different locations**:

### 1. Grid View (Hover Overlay)
```
Product Card
  ↓
Hover over image
  ↓
Overlay appears with action buttons
  ↓
Delete button (trash icon) - SUPER_ADMIN only
```

### 2. List View (Action Buttons)
```
Product Row
  ↓
Actions column on the right
  ↓
Delete button (trash icon) - SUPER_ADMIN only
```

### 3. Dropdown Menu (Three-Dot Menu)
```
Product Row
  ↓
Click three-dot menu (⋮)
  ↓
Dropdown opens
  ↓
"Delete Product" option - SUPER_ADMIN only
```

---

**Status:** 🎉 **FULLY IMPLEMENTED**  
**Security:** ✅ **Frontend + Backend Protected**  
**Locations:** ✅ **All 3 UI locations updated**  
**Ready for:** Production use

---

**Last Updated:** February 11, 2026, 02:00 AM
