# 🔒 Stripe Webhook Setup Instructions

**Date:** February 12, 2026  
**Priority:** 🟠 **HIGH** (Required for session expiration tracking)

---

## 🎯 What You Need to Do

Your Stripe integration is almost complete, but the **webhook secret is missing**. This is needed for:
- ✅ Tracking expired checkout sessions
- ✅ Confirming successful payments
- ✅ Handling async payment methods
- ✅ Verifying webhook authenticity

---

## 📝 Step-by-Step Setup

### **Step 1: Create Webhook Endpoint in Stripe**

1. Go to: **https://dashboard.stripe.com/webhooks**
2. Click "**Add endpoint**"
3. **Endpoint URL:**
   ```
   https://www.hoodfair.com/api/webhooks/stripe
   ```
4. **Description:** (optional)
   ```
   HoodFair Production Webhook
   ```

---

### **Step 2: Select Events to Listen For**

Select these events (IMPORTANT):

✅ **Checkout Session Events:**
- `checkout.session.completed`
- `checkout.session.expired`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

✅ **Payment Intent Events:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`

**Why these events?**
- `checkout.session.expired` → Tracks abandoned carts (your 15-min expiration)
- `payment_intent.succeeded` → Confirms successful payments
- `payment_intent.payment_failed` → Tracks payment failures

---

### **Step 3: Get Webhook Secret**

After creating the endpoint, Stripe will show you the **Signing secret**:

```
whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Copy this value!** You'll need it for the next step.

---

### **Step 4: Add Secret to Vercel**

1. Go to: **https://vercel.com/your-project/settings/environment-variables**
2. Add new variable:
   - **Name:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (paste your secret)
   - **Environments:** Select all (Production, Preview, Development)
3. Click "**Save**"

---

### **Step 5: Update Local Environment (Optional)**

If you want to test webhooks locally:

1. Open: `.env.local`
2. Find the line: `STRIPE_WEBHOOK_SECRET=`
3. Add your secret:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

**Note:** Local webhook testing requires Stripe CLI or ngrok.

---

### **Step 6: Redeploy Application**

After adding the environment variable to Vercel:

```bash
git add .
git commit -m "docs: Add webhook setup instructions"
git push origin main
```

Vercel will auto-deploy with the new environment variable.

---

## 🧪 Test the Webhook

### **Method 1: Send Test Event from Stripe**

1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your webhook endpoint
3. Click "**Send test webhook**"
4. Select event: `checkout.session.completed`
5. Click "**Send test webhook**"
6. Check **Vercel logs** to see if it was received:
   ```
   ✅ [Stripe Webhook] Event received: checkout.session.completed
   ```

### **Method 2: Make Real Purchase**

1. Go to your website
2. Add product to cart
3. Proceed to Stripe checkout
4. Use test card: `4242 4242 4242 4242`
5. Complete payment
6. Webhook should fire automatically
7. Check Vercel logs for confirmation

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] Selected all required events
- [ ] Copied webhook secret (`whsec_...`)
- [ ] Added secret to Vercel environment variables
- [ ] Redeployed application (or auto-deployed)
- [ ] Sent test webhook (received successfully)
- [ ] Checked Vercel logs (no verification errors)

---

## 🐛 Troubleshooting

### **Problem: "Webhook signature verification failed"**

**Cause:** Wrong webhook secret

**Fix:**
1. Go to Stripe Dashboard → Webhooks
2. Click on your endpoint
3. Click "**Reveal**" next to "Signing secret"
4. Copy the EXACT value (including `whsec_`)
5. Update Vercel environment variable
6. Redeploy

---

### **Problem: "No signature found"**

**Cause:** Webhook not properly configured in Stripe

**Fix:**
1. Verify endpoint URL is exactly: `https://www.hoodfair.com/api/webhooks/stripe`
2. Check that /api/webhooks/stripe/route.ts exists
3. Verify route is deployed to Vercel

---

### **Problem: Webhook never fires**

**Cause:** Events not selected in Stripe

**Fix:**
1. Go to Stripe Dashboard → Webhooks → Your endpoint
2. Click "**Events to send**"
3. Add the events listed in Step 2
4. Save changes

---

## 📊 What Happens After Setup

### **Successful Payment Flow:**
```
1. Customer completes payment
   ↓
2. Stripe sends webhook: payment_intent.succeeded
   ↓
3. Your webhook route receives event
   ↓
4. Signature verified with STRIPE_WEBHOOK_SECRET
   ↓
5. Event processed (log order, send email, etc.)
   ↓
6. Response sent to Stripe (200 OK)
```

### **Expired Session Flow:**
```
1. Customer abandons checkout (15 minutes)
   ↓
2. Stripe automatically expires session
   ↓
3. Stripe sends webhook: checkout.session.expired
   ↓
4. Your webhook route receives event
   ↓
5. Abandoned cart logged (for analytics)
   ↓
6. No incomplete transaction in Stripe Dashboard ✅
```

---

## 🔒 Security Notes

### **Why Webhook Secret is Important:**

Without verification:
❌ Anyone could send fake webhook events
❌ Could trigger fraudulent order processing
❌ Security vulnerability

With verification:
✅ Only authentic Stripe events processed
✅ Prevents spoofing attacks
✅ Secure webhook handling

### **Where to Store:**

✅ **Production:** Vercel environment variables ONLY
✅ **Development:** `.env.local` (never committed to git)
❌ **NEVER:** Hardcode in source code
❌ **NEVER:** Commit to git repository

---

## 📝 Current Status

**What's Already Done:**
- ✅ Webhook route created (`/api/webhooks/stripe/route.ts`)
- ✅ Signature verification logic implemented
- ✅ Event handlers written
- ✅ Stripe API keys configured

**What's Missing:**
- ⏳ **Webhook secret needs to be added to Vercel**

**Estimated Time:** 5-10 minutes

---

## 🎯 Quick Setup Commands

```bash
# 1. Create webhook in Stripe Dashboard
# → https://dashboard.stripe.com/webhooks

# 2. Copy webhook secret (starts with whsec_)

# 3. Add to Vercel
# → https://vercel.com/your-project/settings/environment-variables

# 4. Redeploy (if needed)
git add .
git commit -m "docs: Add webhook instructions"
git push origin main

# 5. Test webhook
# → https://dashboard.stripe.com/webhooks → Send test webhook
```

---

## ✅ Success Indicators

You'll know it's working when:

1. **Stripe Dashboard shows:**
   - Endpoint status: "**Active**"
   - Last response: "**200 OK**"
   - Test events: "**Succeeded**"

2. **Vercel Logs show:**
   ```
   ✅ [Stripe Webhook] Event received: checkout.session.completed
   ✅ [Stripe Webhook] Checkout completed: cs_test_xxx
   ```

3. **No errors like:**
   ```
   ❌ [Stripe Webhook] Signature verification failed
   ❌ No signature found
   ```

---

## 📞 Need Help?

If you encounter issues:

1. **Check Stripe Dashboard:**
   - Webhooks → Your endpoint → "Recent deliveries"
   - Look for failed attempts

2. **Check Vercel Logs:**
   ```bash
   vercel logs --follow
   ```

3. **Verify environment variable:**
   - Vercel → Settings → Environment Variables
   - Confirm `STRIPE_WEBHOOK_SECRET` is set

---

**Setup Status:** ⏳ **READY TO CONFIGURE**  
**Estimated Time:** 5-10 minutes  
**Difficulty:** Easy (just copy/paste)

---

**Once completed, your Stripe integration will be 100% functional!** 🎉
