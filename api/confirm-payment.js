/**
 * Confirm Payment Endpoint
 * 
 * Retrieves and confirms the status of a Stripe PaymentIntent.
 * This endpoint allows the frontend to check payment status
 * and handle various payment states appropriately.
 * 
 * @endpoint POST /api/confirm-payment
 * @param {string} paymentIntentId - The Stripe PaymentIntent ID
 * @param {Object} [donorInfo] - Additional donor information to update
 */

'use strict';

const {
    getStripeClient,
    getStripeSecretKey,
    setCorsHeaders,
    parseRequestBody,
    handleOptionsRequest,
    logPaymentEvent,
    getPaymentStatusMessage
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
        const vercelEnv = process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown';
        const isVercelRuntime = Boolean(process.env.VERCEL);
        const runtimeLabel = isVercelRuntime ? vercelEnv : 'local';
        const hasAliasKey = Boolean(getStripeSecretKey());
        const scopeMessage = isVercelRuntime
            ? `Set STRIPE_SECRET_KEY in Vercel Environment Variables for the same scope (${vercelEnv}), then redeploy.`
            : 'Set STRIPE_SECRET_KEY in your local .env file and restart the server.';
        return res.status(503).json({
            error: 'Payment processing is not configured',
            message: `Missing Stripe secret key for this runtime (${runtimeLabel}). ${scopeMessage}`,
            details: hasAliasKey
                ? 'An alternate Stripe key variable was detected, but STRIPE_SECRET_KEY is recommended for consistency.'
                : 'No supported Stripe secret key variable was detected (STRIPE_SECRET_KEY / STRIPE_SECRET / STRIPE_API_KEY / STRIPE_PRIVATE_KEY / STRIPE_LIVE_SECRET_KEY / STRIPE_TEST_SECRET_KEY).',
            code: 'STRIPE_NOT_CONFIGURED'
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

        const { paymentIntentId, donorInfo } = body;

        // Validate paymentIntentId
        if (!paymentIntentId) {
            return res.status(400).json({
                error: 'Missing payment intent ID',
                message: 'paymentIntentId is required',
                code: 'MISSING_PAYMENT_INTENT_ID'
            });
        }

        // Validate format (Stripe PaymentIntent IDs start with 'pi_')
        if (!paymentIntentId.startsWith('pi_')) {
            return res.status(400).json({
                error: 'Invalid payment intent ID',
                message: 'Invalid PaymentIntent ID format',
                code: 'INVALID_PAYMENT_INTENT_ID'
            });
        }

        // Retrieve the PaymentIntent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        // If donor info provided and payment is still processing, update metadata
        if (donorInfo && paymentIntent.status !== 'succeeded') {
            const updateParams = {};

            // Update receipt email if provided
            if (donorInfo.email && donorInfo.email !== paymentIntent.receipt_email) {
                updateParams.receipt_email = donorInfo.email;
            }

            // Update metadata with additional donor info
            if (donorInfo.name || donorInfo.address) {
                updateParams.metadata = {
                    ...paymentIntent.metadata,
                    donorName: donorInfo.name || paymentIntent.metadata.donorName,
                    donorEmail: donorInfo.email || paymentIntent.metadata.donorEmail
                };

                if (donorInfo.address) {
                    updateParams.metadata.donorCity = donorInfo.address.city || '';
                    updateParams.metadata.donorState = donorInfo.address.state || '';
                    updateParams.metadata.donorCountry = donorInfo.address.country || 'US';
                }
            }

            // Only update if there are changes
            if (Object.keys(updateParams).length > 0) {
                await stripe.paymentIntents.update(paymentIntentId, updateParams);
            }
        }

        // Build response based on payment status
        const response = {
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
            statusMessage: getPaymentStatusMessage(paymentIntent.status),
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            created: new Date(paymentIntent.created * 1000).toISOString(),
            metadata: paymentIntent.metadata
        };

        // Add additional info for succeeded payments
        if (paymentIntent.status === 'succeeded') {
            response.receiptEmail = paymentIntent.receipt_email;
            response.description = paymentIntent.description;

            // Get charge information if available
            if (paymentIntent.latest_charge) {
                try {
                    const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
                    response.charge = {
                        id: charge.id,
                        receiptUrl: charge.receipt_url,
                        receiptNumber: charge.receipt_number,
                        brand: charge.payment_method_details?.card?.brand,
                        last4: charge.payment_method_details?.card?.last4
                    };
                } catch (chargeError) {
                    // Non-critical error, continue without charge details
                    console.warn('[CHARGE_RETRIEVE_WARNING]', chargeError.message);
                }
            }

            // Log successful payment confirmation
            logPaymentEvent('payment_confirmed', {
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                donorEmail: paymentIntent.receipt_email || paymentIntent.metadata.donorEmail
            });
        }

        // Handle specific payment states
        switch (paymentIntent.status) {
            case 'requires_payment_method':
                response.action = 'retry';
                response.message = 'Payment failed. Please try again with a different payment method.';
                break;

            case 'requires_action':
                response.action = 'authenticate';
                response.message = 'Additional authentication required.';
                break;

            case 'processing':
                response.action = 'wait';
                response.message = 'Payment is being processed. Please wait.';
                break;

            case 'succeeded':
                response.action = 'complete';
                response.message = 'Payment completed successfully.';
                break;

            case 'canceled':
                response.action = 'canceled';
                response.message = 'Payment was canceled.';
                break;

            default:
                response.action = 'unknown';
                response.message = `Payment status: ${paymentIntent.status}`;
        }

        return res.status(200).json(response);

    } catch (error) {
        // Log error for debugging
        console.error('[CONFIRM_PAYMENT_ERROR]', {
            message: error.message,
            type: error.type,
            code: error.code
        });

        // Handle specific Stripe errors
        if (error.type === 'StripeInvalidRequestError') {
            if (error.code === 'resource_missing') {
                return res.status(404).json({
                    error: 'Payment not found',
                    message: 'The specified payment intent does not exist.',
                    code: 'PAYMENT_NOT_FOUND'
                });
            }

            return res.status(400).json({
                error: 'Invalid request',
                message: error.message,
                code: 'INVALID_REQUEST'
            });
        }

        if (error.type === 'StripeAuthenticationError') {
            return res.status(503).json({
                error: 'Invalid Stripe API key',
                message: 'Your Stripe secret key is invalid.',
                code: 'STRIPE_AUTH_ERROR'
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
            error: 'Failed to confirm payment',
            message: process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred. Please try again.'
                : error.message,
            code: 'INTERNAL_ERROR'
        });
    }
};
