# Multi-Checkout Flow System

## Overview

HoodFair now supports **multiple checkout flows** for different products. Each product can have its own checkout method, allowing you to use different payment providers for different products.

## Supported Checkout Flows

### 1. **BuyMeACoffee** (Default)
- **Flow Type**: `buymeacoffee`
- **Behavior**: Redirects user to external BuyMeACoffee checkout link after address confirmation
- **Use Case**: Default checkout method, external payment processing

### 2. **Ko-fi**
- **Flow Type**: `kofi`
- **Behavior**: Shows Ko-fi checkout in an embedded iframe after address confirmation
- **Use Case**: Keep users on your site during checkout, seamless experience

### 3. **External**
- **Flow Type**: `external`
- **Behavior**: Redirects user to any external checkout link (PayPal, Stripe, etc.)
- **Use Case**: Custom payment providers

---

## How It Works

### Database Schema

The `products` table now includes a `checkout_flow` column:

```sql
ALTER TABLE products ADD COLUMN checkout_flow TEXT DEFAULT 'buymeacoffee';
ALTER TABLE products ADD CONSTRAINT products_checkout_flow_check 
  CHECK (checkout_flow IN ('buymeacoffee', 'kofi', 'external'));
```

### Product Type

The `Product` interface now includes:

```typescript
export interface Product {
  // ... other fields
  checkoutFlow?: 'buymeacoffee' | 'kofi' | 'external';
  checkoutLink: string; // The actual checkout URL
}
```

---

## Setting Up Checkout Flows

### For Admin Users

When creating or editing a product in the admin dashboard:

1. Navigate to **Admin → Products → New Product** (or edit existing)
2. Fill in product details
3. **Checkout Link**: Enter the payment URL (e.g., `https://ko-fi.com/summary/488ad3f8-fa7b-4087-b668-862b8a76a287`)
4. **Checkout Flow**: Select the checkout method:
   - **BuyMeACoffee**: Redirects to external link
   - **Ko-fi**: Shows iframe on your site
   - **External**: Redirects to external link

### Example: Ko-fi Product

```json
{
  "title": "Premium Camera",
  "price": 299.99,
  "checkoutLink": "https://ko-fi.com/summary/488ad3f8-fa7b-4087-b668-862b8a76a287",
  "checkoutFlow": "kofi"
}
```

When a customer checks out:
1. They fill in their shipping address
2. Address is confirmed and saved
3. **Instead of redirecting**, a Ko-fi iframe appears on the same page
4. Customer completes payment without leaving your site

---

## Checkout Flow Behavior

### BuyMeACoffee / External Flow

```
User fills address → Address confirmed → 4-second countdown → Redirect to external link
```

**User Experience:**
- Sees "Address Confirmed" message
- Sees shipping address summary
- Loading spinner with "Finalizing Your Checkout" message
- Automatically redirected after 4 seconds

### Ko-fi Flow

```
User fills address → Address confirmed → Ko-fi iframe loads on same page
```

**User Experience:**
- Sees "Address Confirmed" message
- Sees shipping address summary at top
- Ko-fi payment form loads in iframe below
- Completes payment without leaving site
- Can close iframe to return home

---

## Technical Implementation

### Checkout Page Logic

```typescript
// In src/app/checkout/page.tsx

const checkoutFlow = product.checkoutFlow || 'buymeacoffee';

if (checkoutFlow === 'kofi') {
  // Show Ko-fi iframe
  setShowKofiCheckout(true);
} else {
  // Redirect to external link
  setIsRedirecting(true);
  setTimeout(() => {
    window.location.href = product.checkoutLink;
  }, 4000);
}
```

### Ko-fi Component

```typescript
// src/components/KofiCheckout.tsx

<KofiCheckout
  checkoutLink={product.checkoutLink}
  shippingData={shippingData}
  onClose={() => {
    setShowKofiCheckout(false);
    clearCart();
    router.push('/');
  }}
/>
```

---

## Migration Guide

### Applying the Database Migration

Run this SQL in your Supabase SQL Editor:

```bash
# In Supabase Dashboard → SQL Editor
# Run: supabase-add-checkout-flow.sql
```

Or manually:

```sql
-- Add checkout_flow column
ALTER TABLE products ADD COLUMN checkout_flow TEXT DEFAULT 'buymeacoffee';

-- Add constraint
ALTER TABLE products 
ADD CONSTRAINT products_checkout_flow_check 
CHECK (checkout_flow IN ('buymeacoffee', 'kofi', 'external'));

-- Create index
CREATE INDEX idx_products_checkout_flow ON products(checkout_flow);

-- Update existing products
UPDATE products 
SET checkout_flow = 'buymeacoffee' 
WHERE checkout_flow IS NULL;
```

### Updating Existing Products

All existing products will default to `buymeacoffee` flow. To change a product to Ko-fi:

1. Go to **Admin → Products**
2. Click **Edit** on the product
3. Change **Checkout Flow** to **Ko-fi**
4. Update the **Checkout Link** to your Ko-fi URL
5. Save

---

## Ko-fi Setup Guide

### Getting Your Ko-fi Checkout Link

1. Log in to [Ko-fi.com](https://ko-fi.com)
2. Create a product or commission
3. Get the checkout/summary link (format: `https://ko-fi.com/summary/[ID]`)
4. Use this link in your product's `checkoutLink` field
5. Set `checkoutFlow` to `kofi`

### Ko-fi Link Format

```
https://ko-fi.com/summary/488ad3f8-fa7b-4087-b668-862b8a76a287
```

---

## Benefits

### For Merchants

- **Flexibility**: Use different payment providers for different products
- **Better UX**: Ko-fi iframe keeps users on your site
- **Easy Migration**: Existing products continue working with default flow
- **Scalability**: Easy to add new checkout flows in the future

### For Customers

- **Seamless Experience**: Ko-fi users don't leave your site
- **Familiar Interface**: Each payment provider shows its own UI
- **Trust**: Address confirmed before payment
- **Security**: SSL encrypted, secure payment processing

---

## Future Checkout Flows

The system is designed to be extensible. Future flows could include:

- **Stripe**: Embedded Stripe checkout
- **PayPal**: PayPal iframe
- **Custom**: Your own payment processing
- **Crypto**: Cryptocurrency payments

To add a new flow:

1. Add flow type to `Product` interface
2. Update database constraint
3. Create checkout component
4. Add logic to checkout page

---

## Troubleshooting

### Ko-fi Iframe Not Loading

**Issue**: Iframe shows blank or doesn't load

**Solutions**:
- Check that the Ko-fi link is valid
- Ensure the link is a `/summary/` link, not a profile link
- Check browser console for CORS errors
- Verify Ko-fi allows iframe embedding

### Checkout Flow Not Changing

**Issue**: Product still uses old checkout flow

**Solutions**:
- Clear browser cache
- Check database: `SELECT checkout_flow FROM products WHERE slug = 'product-slug'`
- Verify migration ran successfully
- Check that product was saved after changing flow

### Address Not Saving

**Issue**: Address confirmation fails

**Solutions**:
- Check email API is working
- Verify Supabase connection
- Check browser console for errors
- Ensure all required fields are filled

---

## API Reference

### Product Creation

```typescript
POST /api/admin/products

{
  "title": "Product Name",
  "price": 99.99,
  "checkoutLink": "https://ko-fi.com/summary/...",
  "checkout_flow": "kofi",  // or "buymeacoffee" or "external"
  // ... other fields
}
```

### Product Update

```typescript
PATCH /api/admin/products/[slug]

{
  "checkout_flow": "kofi",
  "checkoutLink": "https://ko-fi.com/summary/..."
}
```

---

## Best Practices

1. **Test Each Flow**: Test checkout with each flow type before going live
2. **Consistent Branding**: Ensure payment pages match your brand
3. **Clear Communication**: Tell customers which payment method they'll use
4. **Monitor Performance**: Track which flows convert better
5. **Backup Links**: Always have a working checkout link

---

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the code in `src/app/checkout/page.tsx`
- Check the Ko-fi component in `src/components/KofiCheckout.tsx`
- Verify database schema with `supabase-add-checkout-flow.sql`

---

**Last Updated**: January 26, 2026  
**Version**: 1.0.0  
**Author**: HoodFair Development Team
