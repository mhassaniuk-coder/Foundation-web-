# Stripe Payment Integration Setup Guide

This guide explains how to properly configure Stripe for the Restored Kings Foundation donation system.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Access to Stripe Dashboard (https://dashboard.stripe.com)

## Step 1: Get Your API Keys

1. Log in to your Stripe Dashboard
2. Navigate to **Developers** → **API Keys**
3. You'll see two types of keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### Test Mode vs Live Mode

- **Test Mode**: Use keys starting with `pk_test_` and `sk_test_` for development
- **Live Mode**: Use keys starting with `pk_live_` and `sk_live_` for production

## Step 2: Configure Environment Variables

### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### For Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the following values in `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   ```

## Step 3: Set Up Webhooks (Production)

Webhooks are essential for receiving payment events from Stripe.

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL:
   ```
   https://your-domain.com/api/webhook
   ```
4. Select these events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
   - `charge.dispute.created`

5. After creating, copy the **Signing secret** (starts with `whsec_`)
6. Add it to your environment variables as `STRIPE_WEBHOOK_SECRET`

### Local Webhook Testing

For local development, use Stripe CLI:

```bash
# Install Stripe CLI, then:
stripe login
stripe listen --forward-to localhost:3000/api/webhook
```

This will give you a webhook signing secret for local testing.

## Step 4: Test Your Integration

### Test Card Numbers

Use these test card numbers with any future expiry date and any 3-digit CVC:

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Decline |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0000 0000 0069 | Expired card |
| 4000 0000 0000 0127 | Incorrect CVC |

### Test the Donation Flow

1. Go to your donation page: `/donate.html`
2. Select an amount and fill in donor information
3. Use a test card number
4. Complete the donation
5. Verify the confirmation page shows

## Step 5: Go Live

Before going live:

1. **Complete Stripe verification** in your Stripe Dashboard
2. **Switch to live mode** in Stripe Dashboard
3. **Update environment variables** with live keys:
   ```
   STRIPE_SECRET_KEY=sk_live_your_live_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
   STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
   ```
4. **Update webhook endpoint** to use your production URL
5. **Test with a real card** (you can refund it immediately)

## Security Best Practices

1. **Never expose your secret key** in frontend code
2. **Always use HTTPS** in production
3. **Verify webhook signatures** to prevent fraud
4. **Keep your keys secure** and rotate them periodically
5. **Monitor your Stripe Dashboard** for suspicious activity

## Troubleshooting

### "Stripe is not configured" Error

- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set in Vercel
- Redeploy after adding environment variables
- Check browser console for specific errors

### Payment Fails with "Invalid request"

- Ensure `STRIPE_SECRET_KEY` is correctly set
- Verify the key is valid and not expired
- Check Stripe Dashboard for API errors

### Webhook Not Working

- Verify webhook URL is accessible from internet
- Check webhook secret matches
- Review Stripe Dashboard → Webhooks for delivery attempts

### Card Element Not Loading

- Check if Stripe.js is loaded (should see in Network tab)
- Verify publishable key format (should start with `pk_`)
- Check browser console for errors

## API Endpoints

The donation system uses these API endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/stripe-keys` | GET | Returns publishable key |
| `/api/create-payment-intent` | POST | Creates payment intent |
| `/api/confirm-payment` | POST | Confirms payment status |
| `/api/webhook` | POST | Handles Stripe events |

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- For issues with this integration, check the project's GitHub issues
