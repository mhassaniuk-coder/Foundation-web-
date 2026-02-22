# Payment Flow Testing Guide

This comprehensive guide covers testing the Stripe payment integration for the Restored Kings Foundation donation system.

## Table of Contents

1. [Test Card Numbers](#test-card-numbers)
2. [Local Testing Setup](#local-testing-setup)
3. [Testing the Payment Flow](#testing-the-payment-flow)
4. [Testing Webhooks with Stripe CLI](#testing-webhooks-with-stripe-cli)
5. [Common Error Scenarios](#common-error-scenarios)
6. [API Endpoint Testing](#api-endpoint-testing)
7. [Troubleshooting](#troubleshooting)

---

## Test Card Numbers

Stripe provides a comprehensive set of test card numbers for different scenarios. Use these with any future expiry date and any 3-digit CVC (4 digits for Amex).

### Successful Payments

| Card Number | Scenario | Expected Behavior |
|-------------|----------|-------------------|
| `4242 4242 4242 4242` | Standard Visa - Success | Payment succeeds immediately |
| `5555 5555 5555 4444` | Standard Mastercard - Success | Payment succeeds immediately |
| `3782 822463 10005` | American Express - Success | Payment succeeds immediately |
| `6011 1111 1111 1117` | Discover - Success | Payment succeeds immediately |

### 3D Secure Authentication

| Card Number | Scenario | Expected Behavior |
|-------------|----------|-------------------|
| `4000 0025 0000 3155` | Requires 3D Secure | Triggers 3DS authentication modal |
| `4000 0027 6000 3184` | 3D Secure with authentication | 3DS modal appears, authenticate to complete |
| `4000 0027 6000 3184` | 3D Secure optional | May or may not trigger 3DS |

### Declined Cards

| Card Number | Scenario | Expected Behavior |
|-------------|----------|-------------------|
| `4000 0000 0000 0002` | Generic decline | "Your card was declined" |
| `4000 0000 0000 9995` | Insufficient funds | "Insufficient funds" message |
| `4000 0000 0000 9987` | Lost card | "This card has been reported as lost" |
| `4000 0000 0000 0069` | Expired card | "Your card has expired" |
| `4000 0000 0000 0127` | Incorrect CVC | "The security code is incorrect" |
| `4000 0000 0000 0119` | Processing error | "A processing error occurred" |
| `4000 0000 0000 3220` | 3D Secure failed | 3DS authentication fails |
| `4000 0000 0000 9995` | Insufficient funds | "Insufficient funds for this transaction" |

### Special Test Scenarios

| Card Number | Scenario | Expected Behavior |
|-------------|----------|-------------------|
| `4000 0000 0000 0341` | Attaching card succeeds | Card attach works, first payment fails |
| `4000 0000 0000 9235` | Decline after attach | Card attaches but payment declines |
| `4000 0000 0000 3220` | 3D Secure required | Must complete 3DS to proceed |

### International Cards

| Card Number | Country | Expected Behavior |
|-------------|---------|-------------------|
| `4000 0000 0000 0077` | Brazil | Succeeds, may require authentication |
| `4000 0000 0000 0615` | Mexico | Succeeds, may require authentication |
| `4000 0000 0000 4954` | India | Requires authentication (RBI regulations) |

---

## Local Testing Setup

### Prerequisites

1. Node.js 18.x installed
2. Stripe account (test mode)
3. Stripe CLI (for webhook testing)

### Step 1: Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Stripe test keys:
   ```env
   # Stripe Test Keys (from https://dashboard.stripe.com/test/apikeys)
   STRIPE_SECRET_KEY=sk_test_your_test_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key
   STRIPE_WEBHOOK_SECRET=whsec_from_stripe_cli
   ```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Start Local Development Server

Option A - Using the built-in server:
```bash
npm run serve
```

Option B - Using Vercel Dev (recommended for full API support):
```bash
npx vercel dev
```

### Step 4: Verify Configuration

1. Navigate to `http://localhost:8080/donate.html` (or the port shown)
2. Open browser developer tools (F12)
3. Check the Console for any Stripe initialization errors
4. Verify the card element loads properly

---

## Testing the Payment Flow

### Manual Testing Checklist

#### Step 1: Amount Selection
- [ ] Click preset amount buttons ($25, $50, $100, $250, $500)
- [ ] Verify amount updates in the UI
- [ ] Test custom amount input
- [ ] Verify impact message updates based on amount
- [ ] Test minimum amount validation ($1.00)

#### Step 2: Donor Information
- [ ] Enter valid name and email
- [ ] Test email validation (invalid format should show error)
- [ ] Test optional fields (phone, address)
- [ ] Verify form navigation (back/next buttons)

#### Step 3: Payment Details
- [ ] Verify card element loads
- [ ] Test card brand detection (Visa, Mastercard, Amex)
- [ ] Enter test card number: `4242 4242 4242 4242`
- [ ] Use any future expiry date (e.g., 12/34)
- [ ] Use any CVC (e.g., 123)
- [ ] Verify card validation indicator shows success

#### Step 4: Complete Payment
- [ ] Click "Complete Donation"
- [ ] Verify loading state shows
- [ ] Wait for payment processing
- [ ] Verify success page shows with receipt details

### Testing 3D Secure Flow

1. Use card number: `4000 0025 0000 3155`
2. Complete the form and submit
3. A 3D Secure modal should appear
4. Click "Complete" in the modal to authenticate
5. Verify payment completes successfully

### Testing Payment Failures

1. Use a decline test card (e.g., `4000 0000 0000 0002`)
2. Complete the form and submit
3. Verify appropriate error message displays
4. Verify user can try again with a different card

---

## Testing Webhooks with Stripe CLI

### Install Stripe CLI

**Windows:**
```powershell
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**
```bash
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

### Login to Stripe

```bash
stripe login
```

This will open a browser window to authenticate with your Stripe account.

### Forward Webhooks to Local Server

Start the webhook forwarder in a separate terminal:

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

Or for Vercel Dev:
```bash
stripe listen --forward-to localhost:3000/api/webhook
```

The CLI will display a webhook signing secret (starts with `whsec_`). Copy this and use it as your `STRIPE_WEBHOOK_SECRET` environment variable.

### Trigger Test Events

Stripe CLI can trigger test webhook events:

```bash
# Successful payment
stripe trigger payment_intent.succeeded

# Failed payment
stripe trigger payment_intent.payment_failed

# Charge refunded
stripe trigger charge.refunded

# Dispute created
stripe trigger charge.dispute.created
```

### Verify Webhook Handling

1. Watch the terminal running `stripe listen` for event delivery status
2. Check your server logs for webhook processing messages
3. Verify the event appears in Stripe Dashboard → Developers → Webhooks

---

## Common Error Scenarios

### Scenario 1: "Stripe is not configured"

**Symptoms:**
- Error message on donation page
- Card element doesn't load

**Possible Causes:**
1. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` not set
2. Environment variable not loaded (restart server)
3. Key format is incorrect

**Solution:**
```bash
# Verify environment variable is set
echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Or check in Node.js console
console.log(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
```

### Scenario 2: "Invalid request" Error

**Symptoms:**
- Payment fails with generic error
- Server logs show Stripe error

**Possible Causes:**
1. `STRIPE_SECRET_KEY` is invalid or expired
2. Using test key in live mode (or vice versa)
3. API version mismatch

**Solution:**
1. Verify secret key in Stripe Dashboard
2. Ensure keys match (test/live)
3. Check API version compatibility

### Scenario 3: Webhook Signature Verification Failed

**Symptoms:**
- Webhook returns 400 error
- Logs show signature mismatch

**Possible Causes:**
1. `STRIPE_WEBHOOK_SECRET` is incorrect
2. Using wrong secret (test vs live)
3. Request body modified before verification

**Solution:**
```bash
# Get correct webhook secret from Stripe CLI
stripe listen --forward-to localhost:3000/api/webhook

# Or from Stripe Dashboard → Webhooks → Your Endpoint → Signing secret
```

### Scenario 4: 3D Secure Timeout

**Symptoms:**
- Payment hangs after 3DS modal
- User sees timeout error

**Possible Causes:**
1. User didn't complete authentication within 5 minutes
2. Network issues during authentication

**Solution:**
- User should retry and complete authentication promptly
- Check network connectivity

### Scenario 5: CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- API requests blocked

**Possible Causes:**
1. Making requests from different origin
2. `ALLOWED_ORIGIN` not configured correctly

**Solution:**
Set `ALLOWED_ORIGIN` in environment variables:
```env
ALLOWED_ORIGIN=https://your-domain.com
```

---

## API Endpoint Testing

### Test stripe-keys Endpoint

```bash
curl -X GET http://localhost:3000/api/stripe-keys \
  -H "Accept: application/json"
```

Expected response:
```json
{
  "publishableKey": "pk_test_...",
  "environment": "development"
}
```

### Test create-payment-intent Endpoint

```bash
curl -X POST http://localhost:3000/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "usd",
    "donorEmail": "test@example.com",
    "donorName": "Test Donor",
    "donationType": "one-time"
  }'
```

Expected response:
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 1000,
  "currency": "usd",
  "status": "requires_payment_method"
}
```

### Test confirm-payment Endpoint

```bash
curl -X POST http://localhost:3000/api/confirm-payment \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_xxx"
  }'
```

Expected response:
```json
{
  "paymentIntentId": "pi_xxx",
  "status": "succeeded",
  "statusMessage": "Payment completed successfully",
  "amount": 1000,
  "currency": "usd",
  "action": "complete"
}
```

### Test verify-card Endpoint

```bash
curl -X POST http://localhost:3000/api/verify-card \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "amount": 1000
  }'
```

Expected response:
```json
{
  "valid": true,
  "message": "Basic verification passed",
  "warnings": [],
  "riskLevel": "low"
}
```

---

## Troubleshooting

### Debug Mode

Enable detailed logging by setting:
```env
DEBUG=true
NODE_ENV=development
```

### Check Server Logs

Look for these log patterns:
- `[PAYMENT_EVENT]` - Payment lifecycle events
- `[PAYMENT_INTENT_ERROR]` - Payment creation errors
- `[WEBHOOK_RECEIVED]` - Webhook events
- `[CONFIG_ERROR]` - Configuration issues

### Browser DevTools

1. **Network Tab:**
   - Check API request/response
   - Look for failed requests
   - Verify request payloads

2. **Console Tab:**
   - Look for JavaScript errors
   - Check Stripe.js loading
   - Review error messages

3. **Application Tab:**
   - Check localStorage for cached data
   - Verify cookies are set correctly

### Stripe Dashboard

1. **Payments Section:**
   - View all payment attempts
   - See detailed error messages
   - Check payment status

2. **Webhooks Section:**
   - View webhook delivery attempts
   - See response codes
   - Retry failed webhooks

3. **Logs Section:**
   - View API requests
   - Check for errors
   - Debug request/response data

### Common Fixes

| Issue | Fix |
|-------|-----|
| Card element not loading | Check Stripe.js is loaded, verify publishable key |
| Payment intent creation fails | Verify secret key, check amount format (cents) |
| 3DS not triggering | Use correct test card, verify 3DS is enabled |
| Webhook not received | Check CLI forwarding, verify endpoint URL |
| CORS errors | Configure ALLOWED_ORIGIN environment variable |

---

## Test Automation

### Using Playwright or Cypress

Example Cypress test for payment flow:

```javascript
describe('Donation Flow', () => {
  it('completes a successful donation', () => {
    cy.visit('/donate.html');
    
    // Select amount
    cy.get('[data-amount="100"]').click();
    
    // Go to step 2
    cy.get('.btn-next').click();
    
    // Fill donor info
    cy.get('#fullName').type('Test Donor');
    cy.get('#email').type('test@example.com');
    
    // Go to step 3
    cy.get('.btn-next').click();
    
    // Fill card details (using Stripe test helpers)
    cy.get('#cardHolderName').type('Test Donor');
    // ... Stripe Elements requires special handling
    
    // Submit payment
    cy.get('#submitBtn').click();
    
    // Verify success
    cy.get('.confirmation-container', { timeout: 30000 }).should('be.visible');
  });
});
```

---

## Production Checklist

Before going live:

- [ ] Switch to live Stripe keys
- [ ] Update webhook endpoint to production URL
- [ ] Test with real card (can refund immediately)
- [ ] Verify receipt emails are sent
- [ ] Check webhook delivery in Stripe Dashboard
- [ ] Monitor first few transactions closely
- [ ] Set up Stripe Radar for fraud prevention
- [ ] Configure backup webhook endpoint

---

## Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe CLI Reference](https://stripe.com/docs/stripe-cli)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Support](https://support.stripe.com)
