/**
 * Create Payment Intent Endpoint
 * 
 * Creates a Stripe PaymentIntent for processing donations.
 * This endpoint handles the server-side creation of payment intents
 * with proper validation, metadata, and error handling.
 * 
 * @endpoint POST /api/create-payment-intent
 * @param {number} amount - Amount in cents (minimum 100 = $1.00)
 * @param {string} [currency=usd] - Currency code
 * @param {string} [donorEmail] - Donor's email address
 * @param {string} [donorName] - Donor's full name
 * @param {string} [donationType=one-time] - Type of donation
 * @param {boolean} [saveCard=false] - Whether to save card for future use
 * @param {Object} [donorInfo] - Additional donor information
 */

'use strict';

const {
    getStripeClient,
    setCorsHeaders,
    validateAmount,
    validateDonorInfo,
    validateCurrency,
    validateDonationType,
    parseRequestBody,
    handleOptionsRequest,
    logPaymentEvent
} = require('./stripe-config');

/**
 * Main handler function
 */
module.exports = async (req, res) => {
    // Set CORS and security headers for all responses (use request origin when available)
    setCorsHeaders(res, req);

    // Handle OPTIONS preflight request
    if (handleOptionsRequest(req, res)) {
        return;
    }

    // Only allow POST method
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed',
            message: 'Only POST requests are accepted',
            code: 'METHOD_NOT_ALLOWED'
        });
    }

    // Check if Stripe is configured
    let stripe;
    try {
        stripe = getStripeClient();
    } catch (configError) {
        console.error('[CONFIG_ERROR]', configError.message);
        return res.status(503).json({
            error: 'Payment processing is not configured',
            message: 'Please set STRIPE_SECRET_KEY in Vercel Environment Variables. Go to Project Settings → Environment Variables and add your Stripe secret key.',
            code: 'STRIPE_NOT_CONFIGURED',
            docs: 'https://dashboard.stripe.com/apikeys'
        });
    }

    try {
        // Parse request body
        const body = parseRequestBody(req.body);

        if (!body) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Request body must be valid JSON',
                code: 'INVALID_BODY'
            });
        }

        const {
            amount,
            currency,
            donorEmail,
            donorName,
            donationType,
            saveCard,
            donorInfo
        } = body;

        // Validate amount
        const amountValidation = validateAmount(amount);
        if (!amountValidation.valid) {
            return res.status(400).json({
                error: 'Invalid amount',
                message: amountValidation.error,
                code: 'INVALID_AMOUNT'
            });
        }

        // Validate currency
        const currencyValidation = validateCurrency(currency);
        if (!currencyValidation.valid) {
            return res.status(400).json({
                error: 'Invalid currency',
                message: currencyValidation.error,
                code: 'INVALID_CURRENCY'
            });
        }

        // Validate donation type
        const donationTypeValidation = validateDonationType(donationType);
        if (!donationTypeValidation.valid) {
            return res.status(400).json({
                error: 'Invalid donation type',
                message: donationTypeValidation.error,
                code: 'INVALID_DONATION_TYPE'
            });
        }

        // Validate donor info if provided
        const fullDonorInfo = {
            email: donorEmail,
            name: donorName,
            ...(donorInfo || {})
        };

        const donorValidation = validateDonorInfo(fullDonorInfo);
        if (!donorValidation.valid) {
            return res.status(400).json({
                error: 'Invalid donor information',
                message: donorValidation.errors.join(', '),
                code: 'INVALID_DONOR_INFO'
            });
        }

        // Build PaymentIntent parameters
        const paymentIntentParams = {
            amount: amountValidation.amount,
            currency: currencyValidation.currency,
            metadata: {
                donorEmail: donorEmail || 'anonymous',
                donorName: donorName || 'Anonymous',
                donationType: donationTypeValidation.donationType,
                integration: 'restored-kings-foundation',
                createdAt: new Date().toISOString()
            },
            automatic_payment_methods: {
                enabled: true
            }
        };

        // Add receipt email if provided and valid
        if (donorEmail && fullDonorInfo.email) {
            paymentIntentParams.receipt_email = donorEmail;
        }

        // Add description for better tracking
        const formattedAmount = (amountValidation.amount / 100).toFixed(2);
        paymentIntentParams.description = `${donationTypeValidation.donationType === 'monthly' ? 'Monthly ' : ''}Donation to Restored Kings Foundation - $${formattedAmount}`;

        // Set up future usage for saved cards
        if (saveCard) {
            paymentIntentParams.setup_future_usage = 'off_session';
        }

        // Add additional metadata from donorInfo
        if (donorInfo) {
            if (donorInfo.phone) {
                paymentIntentParams.metadata.donorPhone = donorInfo.phone;
            }
            if (donorInfo.address) {
                paymentIntentParams.metadata.donorCity = donorInfo.address.city || '';
                paymentIntentParams.metadata.donorState = donorInfo.address.state || '';
                paymentIntentParams.metadata.donorCountry = donorInfo.address.country || 'US';
            }
            if (donorInfo.dedication) {
                paymentIntentParams.metadata.dedication = donorInfo.dedication;
            }
        }

        // Create the PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

        // Log successful creation
        logPaymentEvent('payment_intent_created', {
            paymentIntentId: paymentIntent.id,
            amount: amountValidation.amount,
            currency: currencyValidation.currency,
            donationType: donationTypeValidation.donationType,
            donorEmail: donorEmail || 'anonymous'
        });

        // Return success response
        return res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status
        });

    } catch (error) {
        // Log error for debugging
        console.error('[PAYMENT_INTENT_ERROR]', {
            message: error.message,
            type: error.type,
            code: error.code,
            stack: error.stack
        });

        // Handle specific Stripe errors
        if (error.type === 'StripeAuthenticationError') {
            return res.status(503).json({
                error: 'Invalid Stripe API key',
                message: 'Your Stripe secret key is invalid. Please check your Vercel environment variables.',
                code: 'STRIPE_AUTH_ERROR'
            });
        }

        if (error.type === 'StripeInvalidRequestError') {
            return res.status(400).json({
                error: 'Invalid payment request',
                message: error.message,
                code: 'INVALID_REQUEST'
            });
        }

        if (error.type === 'StripeRateLimitError') {
            return res.status(429).json({
                error: 'Too many requests',
                message: 'Please wait a moment and try again.',
                code: 'RATE_LIMIT_EXCEEDED'
            });
        }

        if (error.type === 'StripeConnectionError') {
            return res.status(503).json({
                error: 'Payment service unavailable',
                message: 'Unable to connect to payment processor. Please try again.',
                code: 'SERVICE_UNAVAILABLE'
            });
        }

        // Generic error response
        return res.status(500).json({
            error: 'Failed to create payment intent',
            message: process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred. Please try again.'
                : error.message,
            code: 'INTERNAL_ERROR'
        });
    }
};
