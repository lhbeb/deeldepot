# Stock Filter Feature - Admin Product List

**Date**: February 6, 2026  
**Feature**: Added "Sold Out" filter to admin product list page

---

## ✅ Changes Made

### 1. Added Stock Filter State
- Added `stockFilter` state variable with three options:
  - `'all'` - Show all products
  - `'in_stock'` - Show only in-stock products
  - `'sold_out'` - Show only sold-out products

### 2. Implemented Filter Logic
- Added stock filter logic to the filtering `useEffect`
- Filters products based on `inStock` property:
  - `in_stock`: Shows products where `inStock !== false`
  - `sold_out`: Shows products where `inStock === false`

### 3. Added Stock Filter Dropdown
- Added new dropdown in the toolbar section
- Positioned after the Featured Filter
- Options:
  - "All Stock Status" (default)
  - "✅ In Stock"
  - "❌ Sold Out"

### 4. Updated Filter Status Display
- Added stock filter to the filter status condition
- Shows active filter information:
  - "(in stock only)" when filtering by in stock
  - "(sold out only)" when filtering by sold out

### 5. Updated Page Subtitle
- Added sold out count to the AdminLayout subtitle
- Now shows: `X products • Y published • Z drafts • A/B featured • C sold out`

---

## 🎯 Usage

Admins can now:
1. **Filter by stock status** using the new dropdown in the toolbar
2. **See sold out count** in the page subtitle
3. **View filter status** showing which stock filter is active
4. **Combine filters** - stock filter works alongside other filters (published/draft, featured, listed by)

---

## 🔍 Technical Details

**File Modified**: `/src/app/admin/products/page.tsx`

**State Added**:
```tsx
const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'sold_out'>('all');
```

**Filter Logic**:
```tsx
// Apply stock filter
if (stockFilter === 'in_stock') {
  filtered = filtered.filter(p => p.inStock !== false);
} else if (stockFilter === 'sold_out') {
  filtered = filtered.filter(p => p.inStock === false);
}
```

**UI Component**:
```tsx
{/* Stock Filter */}
<div className="flex items-center gap-2">
  <Filter className="h-5 w-5 text-gray-400" />
  <select
    value={stockFilter}
    onChange={(e) => setStockFilter(e.target.value as 'all' | 'in_stock' | 'sold_out')}
    className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2658A6] focus:border-transparent text-sm font-medium"
  >
    <option value="all">All Stock Status</option>
    <option value="in_stock">✅ In Stock</option>
    <option value="sold_out">❌ Sold Out</option>
  </select>
</div>
```

---

## ✨ Benefits

1. **Better Inventory Management**: Quickly identify sold out products
2. **Improved Workflow**: Filter out sold out items when managing active inventory
3. **Quick Overview**: See sold out count at a glance in the subtitle
4. **Consistent UX**: Follows the same pattern as other filters (featured, listed by)

---

## 🧪 Testing

To test the feature:
1. Navigate to `/admin/products`
2. Use the "Stock Filter" dropdown to filter by:
   - All Stock Status (default)
   - In Stock
   - Sold Out
3. Verify the filter status message updates
4. Verify the sold out count appears in the subtitle
5. Test combining with other filters (published/draft, featured, etc.)

---

**Status**: ✅ Complete and ready to use
