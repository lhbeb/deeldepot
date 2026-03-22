# 🚀 HoodFair - Quick Reference Guide

**Last Updated:** February 11, 2026

---

## 📦 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev

# Open browser
http://localhost:3000
```

---

## 🔑 Key Files & Locations

### Core Application
```
src/app/page.tsx              # Homepage
src/app/layout.tsx            # Root layout
src/app/checkout/page.tsx     # Checkout flow
src/middleware.ts             # Auth middleware
```

### Database Layer
```
src/lib/supabase/products.ts  # Product operations
src/lib/supabase/orders.ts    # Order operations
src/lib/supabase/auth.ts      # Authentication
src/lib/supabase/server.ts    # Admin client (service role)
src/lib/supabase/client.ts    # Public client (anon key)
```

### Components
```
src/components/Header.tsx           # Main navigation
src/components/ProductGrid.tsx      # Product listing
src/components/StripeCheckout.tsx   # Payment form
src/components/AdminSidebar.tsx     # Admin navigation
```

### API Routes
```
src/app/api/admin/products/         # Product CRUD
src/app/api/admin/orders/           # Order management
src/app/api/create-stripe-payment-intent/  # Stripe payment
src/app/api/send-shipping-email/    # Order submission
src/app/api/cron/retry-failed-emails/  # Email retry
```

### Database Schemas
```
supabase-schema.sql                 # Main schema
supabase-orders-schema.sql          # Orders table
supabase-add-stripe-checkout-flow.sql  # Stripe integration
```

---

## 🔐 Environment Variables

### Required
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Admin
ADMIN_EMAILS=admin@example.com,admin2@example.com

# URLs
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
APP_BASE_URL=https://yourdomain.com
```

### Optional
```bash
# Development
DISABLE_AUTH_IN_DEV=true

# Telegram
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_CHAT_ID=xxx

# Cron
CRON_SECRET=xxx
```

---

## 🛠️ Common Tasks

### Create Admin User
```bash
npm run create-admin
```

### Import Products
```bash
# From JSON file
npm run import-products

# Or use admin dashboard
http://localhost:3000/admin/products/quick-add
```

### Upload Images to Supabase
```bash
npm run upload-images
```

### Test Order Flow
```bash
npm run test-order
```

### Test Admin Login
```bash
npm run test-login
```

---

## 📊 Database Operations

### Get All Products
```typescript
import { getProducts } from '@/lib/supabase/products';

const products = await getProducts();
```

### Get Product by Slug
```typescript
import { getProductBySlug } from '@/lib/supabase/products';

const product = await getProductBySlug('product-slug');
```

### Create Product
```typescript
import { createProduct } from '@/lib/supabase/products';

const product = await createProduct({
  slug: 'new-product',
  title: 'New Product',
  description: 'Product description',
  price: 99.99,
  images: ['https://...'],
  condition: 'New',
  category: 'Electronics',
  brand: 'Brand Name',
  checkout_link: 'https://...',
  checkout_flow: 'stripe'
});
```

### Get All Orders
```typescript
import { getAllOrders } from '@/lib/supabase/orders';

const orders = await getAllOrders();
```

---

## 💳 Stripe Test Cards

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0025 0000 3155` | Requires 3D Secure |
| `4000 0000 0000 9995` | Declined |
| `5555 5555 5555 4444` | Mastercard Success |

**For all test cards:**
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- Postal Code: Any 5 digits (e.g., `12345`)

---

## 🔍 Debugging

### Enable Debug Logging
```typescript
import { debugLog, debugError } from '@/utils/debug';

debugLog('Debug message', { data: 'value' });
debugError('Error message', error);
```

### Check Admin Auth
```bash
# Browser console
localStorage.getItem('admin_token')
document.cookie
```

### Check Database Connection
```bash
# In Supabase dashboard
https://supabase.com/dashboard
```

### View Server Logs
```bash
# Development
npm run dev
# Check terminal output

# Production (Vercel)
# Check Vercel dashboard logs
```

---

## 📱 Admin Dashboard

### Access
```
http://localhost:3000/admin/login
```

### Default Admin
```
Email: elmahboubimehdi@gmail.com
Password: (set in Supabase Auth)
```

### Routes
```
/admin                    # Dashboard home
/admin/products           # Product list
/admin/products/new       # Create product
/admin/products/[slug]/edit  # Edit product
/admin/products/quick-add    # JSON import
/admin/products/bulk-import  # Bulk import
/admin/orders             # Order list
```

---

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Test Production Build
```bash
npm run build
npm run start
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Environment Variables (Vercel)
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add all variables from `.env.local`

---

## 📧 Email Configuration

### Gmail Setup
1. Go to https://myaccount.google.com/apppasswords
2. Generate app password
3. Add to `.env.local`:
```bash
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
```

### Test Email
```bash
npm run test-order
```

---

## 🔄 Cron Jobs

### Email Retry Cron
```
Endpoint: /api/cron/retry-failed-emails
Schedule: Every 5 minutes
Method: GET
Header: Authorization: Bearer YOUR_CRON_SECRET
```

### Vercel Cron Setup
Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/retry-failed-emails",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## 🎨 Customization

### Brand Colors
Edit `tailwind.config.ts`:
```typescript
colors: {
  primary: '#2658A6',      // Main brand color
  secondary: '#1a3d70',    // Darker blue
  accent: '#2658A6',       // Accent color
  text: '#262626',         // Text color
}
```

### Fonts
Edit `src/app/layout.tsx`:
```typescript
import { Roboto } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
});
```

### Stripe Appearance
Edit `src/components/StripeCheckout.tsx`:
```typescript
const appearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#2658A6',
    colorBackground: '#ffffff',
    colorText: '#262626',
    colorDanger: '#df1b41',
    fontFamily: 'Roboto, sans-serif',
    borderRadius: '8px',
  },
};
```

---

## 🐛 Common Issues

### "Stripe has not loaded yet"
```bash
# Check environment variable
echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Restart dev server
npm run dev
```

### "Failed to initialize payment"
```bash
# Check secret key
echo $STRIPE_SECRET_KEY

# Verify API endpoint
curl http://localhost:3000/api/create-stripe-payment-intent
```

### Admin login fails
```bash
# Check admin email in allowlist
echo $ADMIN_EMAILS

# Or bypass auth in development
DISABLE_AUTH_IN_DEV=true
```

### Database connection error
```bash
# Check Supabase credentials
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test connection in Supabase dashboard
```

### Email not sending
```bash
# Check email credentials
echo $EMAIL_USER
echo $EMAIL_PASS

# Check Gmail app password (not regular password!)
# Generate at: https://myaccount.google.com/apppasswords
```

---

## 📚 Documentation

### Main Docs
- `CODEBASE_DEEP_DIVE_2026.md` - Complete codebase overview
- `DEEP_CODEBASE_UNDERSTANDING.md` - Original deep dive
- `COMPREHENSIVE_CODEBASE_UNDERSTANDING.md` - Comprehensive guide

### Feature Guides
- `STRIPE_EMBEDDED_PAYMENT_GUIDE.md` - Stripe integration
- `ADMIN_SETUP_INSTRUCTIONS.md` - Admin setup
- `SUPABASE_SETUP.md` - Database setup
- `EMAIL_SETUP.md` - Email configuration
- `CRON_SETUP.md` - Cron job setup

### Troubleshooting
- `DEBUGGING_STEPS.md` - Debugging guide
- `TROUBLESHOOT_LOGIN.md` - Login issues
- `EMAIL_FAILURE_DIAGNOSIS.md` - Email issues

---

## 🔗 Useful Links

### Project
- **Homepage:** http://localhost:3000
- **Admin:** http://localhost:3000/admin
- **Instagram Tool:** http://localhost:3001

### External Services
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Google Analytics:** https://analytics.google.com

### Documentation
- **Next.js:** https://nextjs.org/docs
- **Supabase:** https://supabase.com/docs
- **Stripe:** https://stripe.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs

---

## 💡 Pro Tips

1. **Always test with Stripe test cards** before going live
2. **Use `DISABLE_AUTH_IN_DEV=true`** for faster development
3. **Monitor Supabase usage** to avoid rate limits
4. **Set up email retry cron** for production
5. **Backup database regularly** via Supabase dashboard
6. **Use TypeScript strict mode** for better type safety
7. **Test on mobile devices** before deploying
8. **Enable Google Analytics** for visitor tracking
9. **Set up Telegram notifications** for order alerts
10. **Keep dependencies updated** with `npm update`

---

## 🎯 Next Steps

### For Development
1. Set up environment variables
2. Create admin user
3. Import sample products
4. Test checkout flow
5. Configure email
6. Set up Stripe test mode

### For Production
1. Switch to Stripe live keys
2. Configure production URLs
3. Set up cron jobs
4. Enable monitoring
5. Test payment flow
6. Deploy to Vercel
7. Configure domain
8. Enable SSL

---

**Need Help?**
- Check documentation files in project root
- Review conversation history for context
- Test with provided scripts
- Monitor server logs for errors

**Status:** ✅ Ready to Use  
**Version:** 3.0.0  
**Last Updated:** February 11, 2026
