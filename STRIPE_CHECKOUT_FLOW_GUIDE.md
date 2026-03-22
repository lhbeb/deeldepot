# Stripe Checkout Flow Implementation Guide

## Overview

This guide explains how to set up and use the **Stripe checkout flow** in HoodFair. Stripe is the 4th checkout flow option, joining:
1. **BuyMeACoffee** - External redirect (default)
2. **Ko-fi** - Embedded iframe
3. **External** - Custom external redirect
4. **Stripe** - Stripe Checkout (NEW)

---

## 🚀 Setup Instructions

### Step 1: Get Your Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign in or create an account
3. Navigate to **Developers → API keys**
4. Copy your **Publishable key** and **Secret key**

⚠️ **Important**: Use **Test keys** for development, **Live keys** for production

### Step 2: Add Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

**For Production (Vercel):**
Add the same variables in your Vercel project settings:
- Go to **Project Settings → Environment Variables**
- Add both keys
- Redeploy your app

### Step 3: Run Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Drop the existing constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_checkout_flow_check;

-- Add new constraint with stripe included
ALTER TABLE products 
ADD CONSTRAINT products_checkout_flow_check 
CHECK (checkout_flow IN ('buymeacoffee', 'kofi', 'external', 'stripe'));
```

Or use the provided migration file:
```bash
# In Supabase Dashboard → SQL Editor
# Run: supabase-add-stripe-checkout-flow.sql
```

---

## 📝 How to Use

### Creating a Product with Stripe Checkout

When creating or editing a product in the admin dashboard:

1. **Checkout Link**: Leave empty or add a fallback URL (optional for Stripe)
2. **Checkout Flow**: Select **Stripe** from the dropdown

Example product data:

```json
{
  "title": "Premium Camera",
  "price": 299.99,
  "currency": "USD",
  "checkoutFlow": "stripe",
  "checkoutLink": "" // Optional - not used for Stripe
}
```

### Checkout Flow Behavior

When a customer checks out with a Stripe product:

1. ✅ **Customer fills shipping address**
2. ✅ **Address is confirmed and saved to database**
3. ✅ **Order email is sent to admin**
4. 💳 **Stripe Checkout component appears**
5. 💳 **Customer clicks "Continue to Stripe Checkout"**
6. 💳 **Redirected to Stripe's hosted checkout page**
7. ✅ **After payment, redirected to thank you page**

---

## 🎨 User Experience

### Address Confirmation Screen

Shows:
- ✅ Confirmed delivery address
- 📧 Customer email
- 📦 Product summary with image and price
- 💳 "Continue to Stripe Checkout" button
- 🔒 Trust badges (Secure Payment, SSL Encrypted, Powered by Stripe)

### Stripe Checkout Page

Stripe's hosted checkout page includes:
- Credit card payment form
- Apple Pay / Google Pay (if available)
- Secure payment processing
- Automatic receipt emails
- Mobile-optimized design

---

## 🔧 Technical Implementation

### Files Created/Modified

**New Files:**
1. `src/components/StripeCheckout.tsx` - Stripe checkout component
2. `src/app/api/create-stripe-checkout/route.ts` - API to create Stripe session
3. `supabase-add-stripe-checkout-flow.sql` - Database migration

**Modified Files:**
1. `src/types/product.ts` - Added 'stripe' to checkoutFlow type
2. `src/app/checkout/page.tsx` - Added Stripe flow handling
3. `package.json` - Added Stripe dependencies

### How It Works

```
┌─────────────────────────────────────────────────────────┐
│              STRIPE CHECKOUT FLOW                       │
└─────────────────────────────────────────────────────────┘

1. User fills shipping form
   └─> Validates all required fields

2. Form submitted
   └─> POST /api/send-shipping-email
   └─> Save order to database
   └─> Send email to admin

3. Checkout flow detection
   └─> if (checkoutFlow === 'stripe')
   └─> Show StripeCheckout component

4. StripeCheckout component
   └─> Display address confirmation
   └─> Show product summary
   └─> "Continue to Stripe Checkout" button

5. Button clicked
   └─> POST /api/create-stripe-checkout
   └─> Create Stripe Checkout Session
   └─> Return session ID

6. Redirect to Stripe
   └─> stripe.redirectToCheckout({ sessionId })
   └─> Customer completes payment on Stripe

7. After payment
   └─> success_url: /thankyou?session_id={CHECKOUT_SESSION_ID}
   └─> cancel_url: /checkout
```

### API Endpoint: `/api/create-stripe-checkout`

**Request:**
```json
{
  "product": {
    "id": "product-123",
    "slug": "premium-camera",
    "title": "Premium Camera",
    "price": 299.99,
    "currency": "USD",
    "images": ["https://..."]
  },
  "shippingData": {
    "email": "customer@example.com",
    "streetAddress": "123 Main St",
    "city": "New York",
    "state": "New York",
    "zipCode": "10001"
  }
}
```

**Response:**
```json
{
  "sessionId": "cs_test_..."
}
```

---

## 🔒 Security Features

✅ **Implemented:**
- Stripe API keys stored in environment variables
- Secret key only used on server-side
- Publishable key safe for client-side
- Stripe handles all payment processing (PCI compliant)
- SSL encrypted checkout
- Shipping address collected before payment
- Order saved to database before payment

---

## 💰 Pricing

Stripe charges:
- **2.9% + $0.30** per successful card charge (US)
- No monthly fees
- No setup fees
- Rates vary by country

[View Stripe Pricing](https://stripe.com/pricing)

---

## 🧪 Testing

### Test Mode

Use Stripe's test cards for testing:

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Declined Payment:**
- Card: `4000 0000 0000 0002`

[More test cards](https://stripe.com/docs/testing)

### Testing Checklist

- [ ] Product with `checkoutFlow: 'stripe'` created
- [ ] Shipping form submits successfully
- [ ] Address confirmation shows correctly
- [ ] Stripe Checkout button appears
- [ ] Clicking button redirects to Stripe
- [ ] Test payment completes successfully
- [ ] Redirects to thank you page
- [ ] Order saved in database
- [ ] Admin receives email notification

---

## 🎯 Comparison: All Checkout Flows

| Feature | BuyMeACoffee | Ko-fi | External | **Stripe** |
|---------|--------------|-------|----------|------------|
| **Type** | External redirect | Embedded iframe | External redirect | Stripe Checkout |
| **Stays on site** | ❌ No | ✅ Yes | ❌ No | ❌ No (Stripe hosted) |
| **Payment processor** | BuyMeACoffee | Ko-fi | Custom | Stripe |
| **Setup complexity** | Low | Low | Low | **Medium** |
| **Fees** | Platform fees | Platform fees | Varies | **2.9% + $0.30** |
| **PCI compliance** | Platform handles | Platform handles | Varies | **Stripe handles** |
| **Custom branding** | Limited | Limited | Varies | **Limited** |
| **Best for** | Tips/donations | Tips/donations | Custom solutions | **Professional sales** |

---

## 🔄 Migration from Other Flows

To convert existing products to Stripe:

1. **Via Admin Dashboard:**
   - Go to **Admin → Products**
   - Click **Edit** on the product
   - Change **Checkout Flow** to **Stripe**
   - Save

2. **Via Database:**
   ```sql
   UPDATE products 
   SET checkout_flow = 'stripe' 
   WHERE slug = 'your-product-slug';
   ```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'stripe'"

**Solution:**
```bash
npm install stripe @stripe/stripe-js
```

### Issue: Stripe Checkout button doesn't work

**Solutions:**
1. Check environment variables are set correctly
2. Verify Stripe API keys are valid
3. Check browser console for errors
4. Ensure product has `checkoutFlow: 'stripe'`

### Issue: "Invalid API key"

**Solutions:**
1. Verify you're using the correct key (test vs live)
2. Check for extra spaces in `.env.local`
3. Restart dev server after adding env vars
4. In production, verify Vercel env vars are set

### Issue: Redirect fails after payment

**Solutions:**
1. Check `success_url` and `cancel_url` in API route
2. Verify base URL is correct
3. Check Stripe Dashboard → Logs for errors

---

## 📚 Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

---

## ✅ Summary

You now have **4 checkout flow options**:

1. **BuyMeACoffee** - Simple external redirect (default)
2. **Ko-fi** - Embedded iframe checkout
3. **External** - Custom payment provider
4. **Stripe** - Professional payment processing ⭐ NEW

Each product can use a different checkout flow, giving you maximum flexibility!

---

**Last Updated**: February 2, 2026  
**Version**: 1.0.0  
**Author**: HoodFair Development Team
