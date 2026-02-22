# Stripe Payment Integration - Setup Guide

## What Was Implemented

### Frontend (donate.html & donate.js)
✅ **Stripe Card Element**
- Real-time card input validation using Stripe Elements
- Real-time card brand detection (Visa, Mastercard, Amex, etc.) with visual brand icon
- Clear error messages for invalid cards
- Custom styling matching your foundation's color scheme

✅ **Card Holder Name Field**
- Required input for cardholder name before payment submission

✅ **Save Card Option**
- Checkbox to save card for future donations (secure tokenization via Stripe)
- When enabled, allows Stripe to set up the card for off-session use

✅ **Secure Key Injection**
- Publishable key loaded via `/api/stripe-keys` endpoint (secure server-side injection)
- Fallback to DOM data attribute for testing: `data-stripe-publishable-key="pk_test_..."`
- Fallback to window.STRIPE_PUBLIC_KEY for direct window injection
- Graceful error handling with setup instructions if Stripe isn't configured

✅ **Multi-Step Form with Confirmation**
- Step 1: Donation amount & frequency
- Step 2: Donor information (name, email, address)
- Step 3: Payment details (card entry, billing address toggle)
- Step 4: Confirmation receipt with transaction ID

### Backend (api/*)
✅ **Payment Intent Creation** (`create-payment-intent.js`)
- Creates Stripe PaymentIntent securely on backend
- Validates donor info, amount, currency, donation type
- Returns clientSecret for frontend card confirmation

✅ **Stripe Keys Endpoint** (`stripe-keys.js`)
- Safely returns publishable key to frontend
- Reads from `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` environment variable
- Only allows GET requests, caches response for 1 hour

✅ **Confirma Payment Status** (`confirm-payment.js`)
- Retrieves PaymentIntent status from Stripe
- Returns user-friendly status messages
- Includes charge & receipt details for succeeded payments

✅ **Webhook Handler** (`webhook.js`)
- Securely verifies Stripe webhook signature
- Idempotent event processing (prevents duplicate processing)
- Handles: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded, charge.disputed

✅ **Security Hardening** (`stripe-config.js`)
- CORS headers with Origin validation (respects ALLOWED_ORIGIN)
- Varies: Origin header for proper caching
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Strict-Transport-Security: max-age=31536000
- Comprehensive input validation for amounts, emails, phone, names

## Setup Instructions

### 1. Get Stripe Keys
Visit: https://dashboard.stripe.com/apikeys

### 2. Set Environment Variables in Vercel

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Add the following:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_... (optional, for webhooks)
ALLOWED_ORIGIN=https://yourdomain.com
NODE_ENV=production
```

### 3. Deploy to Vercel

Push to your repo - Vercel will automatically redeploy:
```bash
git add .
git commit -m "Add Stripe integration environment vars"
git push
```

### 4. Test the Flow

1. Visit your `/donate.html` page
2. Enter a test donation amount (e.g., $25)
3. Fill in your information
4. On payment step, enter a Stripe test card:
   - **Visa**: `4242 4242 4242 4242`
   - **Mastercard**: `5555 5555 5555 4444`
   - **Amex**: `3782 822463 10005`
   - **Exp**: Any future date (e.g., 12/25)
   - **CVC**: Any 3 digits (e.g., 123)

5. Click "Complete Donation"
6. You should see the confirmation receipt with transaction ID

## Security Checklist

✅ Stripe secret key never exposed to frontend (only on backend)
✅ Publishable key injected via secure `/api/stripe-keys` endpoint
✅ Card data never touches your servers (Stripe Elements handles this)
✅ CSP headers configured to only allow Stripe scripts
✅ CORS properly restricted with Origin validation
✅ Webhook signature verification for secure event handling
✅ All inputs validated (amounts, emails, phone numbers, names)
✅ Error messages safe and user-friendly (don't expose sensitive system info)

## Environment Variables Checklist

| Variable | Type | Required | Notes |
|----------|------|----------|-------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public | Yes | Stripe publishable key (can be seen in client JS) |
| `STRIPE_SECRET_KEY` | Secret | Yes | Stripe secret key (backend only) |
| `STRIPE_WEBHOOK_SECRET` | Secret | No | For Stripe webhook verification |
| `ALLOWED_ORIGIN` | String | No | Restricts CORS to specific origin (e.g., https://example.com) |

## Next Steps

1. **Webhook Setup**: Configure Stripe webhooks to point to `https://your-domain.com/api/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `charge.disputed`

2. **Email Receipts**: In production, send donation receipts via email (integrate SendGrid, Mailgun, etc.)

3. **Database**: Store donation records in Supabase or another database

4. **Analytics**: Track donation metrics and donor info

## Testing Stripe Webhooks Locally (Optional)

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to http://localhost:3000/api/webhook
stripe trigger payment_intent.succeeded
```

---
**Documentation generated**: February 22, 2026
**Last updated by**: GitHub Copilot
