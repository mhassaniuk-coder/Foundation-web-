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
    getStripeSecretKey,
    setCorsHeaders,
    validateAmount,
    validateDonorInfo,
    validateCurrency,
    validateDonationType,
    parseRequestBody,
    handleOptionsRequest,
    logPaymentEvent,
    isValidEmail
} = require('./stripe-config');

/**
 * Fraud detection checks for payment intent creation
 * @param {Object} data - Payment data to check
 * @returns {Object} Fraud check result { passed: boolean, riskLevel: string, flags: string[] }
 */
function performFraudChecks(data) {
    const flags = [];
    let riskLevel = 'low';

    // Check for suspicious email patterns
    if (data.donorEmail) {
        const email = data.donorEmail.toLowerCase();

        // Check for temporary email domains
        const tempEmailDomains = ['tempmail', 'guerrillamail', '10minutemail', 'throwaway', 'mailinator'];
        if (tempEmailDomains.some(domain => email.includes(domain))) {
            flags.push('temporary_email_domain');
            // HIGH risk if using temp email with large amount
            if (data.amount > 100000) { // > $1,000
                riskLevel = 'high';
            } else {
                riskLevel = 'medium';
            }
        }

        // Check for suspicious patterns
        if (email.match(/^[a-z]{20,}@/)) {
            flags.push('suspicious_email_pattern');
            riskLevel = riskLevel === 'high' ? 'high' : 'medium';
        }
    }

    // Check for unusual amounts
    if (data.amount) {
        // Very large amounts
        if (data.amount > 500000) { // > $5,000
            flags.push('high_value_transaction');
            riskLevel = riskLevel === 'high' ? 'high' : 'medium';
        }

        // Round number attacks (testing cards)
        if (data.amount === 100 || data.amount === 50) { // $1.00 or $0.50
            flags.push('potential_card_testing');
            riskLevel = 'medium';
        }
    }

    // Check for mismatched billing/shipping if provided
    if (data.donorInfo && data.donorInfo.billingAddress && data.donorInfo.address) {
        if (data.donorInfo.billingAddress.country !== data.donorInfo.address.country) {
            flags.push('billing_shipping_mismatch');
            // HIGH risk for billing/shipping mismatch with high value
            if (data.amount > 100000) { // > $1,000
                riskLevel = 'high';
            } else {
                riskLevel = riskLevel === 'high' ? 'high' : 'medium';
            }
        }
    }

    // Multiple flags = higher risk
    if (flags.length >= 3) {
        riskLevel = 'high';
    }

    return {
        passed: riskLevel !== 'high',
        riskLevel,
        flags
    };
}

/**
 * Validate billing address if provided
 * @param {Object} address - Address object to validate
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
function validateBillingAddress(address) {
    const errors = [];

    if (!address) {
        return { valid: true, errors: [] };
    }

    // Validate postal code format based on country
    if (address.postal_code) {
        const postalCodePatterns = {
            'US': /^\d{5}(-\d{4})?$/,
            'CA': /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
            'GB': /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
            'AU': /^\d{4}$/,
            'DE': /^\d{5}$/,
            'FR': /^\d{5}$/
        };

        const pattern = postalCodePatterns[address.country];
        if (pattern && !pattern.test(address.postal_code)) {
            errors.push('Invalid postal code format for the selected country');
        }
    }

    // Validate state/province for US/CA
    if (address.country === 'US' && address.state) {
        const usStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];
        if (!usStates.includes(address.state.toUpperCase())) {
            errors.push('Invalid US state code');
        }
    }

    // Validate required fields for certain countries
    if (['US', 'CA', 'GB'].includes(address.country)) {
        if (!address.state && !address.city) {
            errors.push('State/province or city is required');
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Log verification attempt for audit trail
 * @param {Object} data - Verification data
 */
function logVerificationAttempt(data) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'payment_verification',
        email: data.email || 'anonymous',
        amount: data.amount,
        riskLevel: data.riskLevel,
        flags: data.flags,
        ip: data.ip || 'unknown',
        userAgent: data.userAgent || 'unknown'
    };

    console.log('[VERIFICATION_ATTEMPT]', JSON.stringify(logEntry));
}

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
            donorInfo,
            // Dedication fields
            dedication
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

        // Validate billing address if provided
        if (donorInfo && donorInfo.billingAddress) {
            const billingValidation = validateBillingAddress(donorInfo.billingAddress);
            if (!billingValidation.valid) {
                return res.status(400).json({
                    error: 'Invalid billing address',
                    message: billingValidation.errors.join(', '),
                    code: 'INVALID_BILLING_ADDRESS'
                });
            }
        }

        // Perform fraud detection checks
        const fraudCheckResult = performFraudChecks({
            amount: amountValidation.amount,
            donorEmail,
            donorName,
            donorInfo
        });

        // Log verification attempt for audit
        logVerificationAttempt({
            email: donorEmail,
            amount: amountValidation.amount,
            riskLevel: fraudCheckResult.riskLevel,
            flags: fraudCheckResult.flags,
            ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        // Block high-risk transactions
        if (!fraudCheckResult.passed) {
            console.warn('[FRAUD_BLOCK]', {
                email: donorEmail,
                amount: amountValidation.amount,
                flags: fraudCheckResult.flags
            });
            return res.status(403).json({
                error: 'Transaction blocked',
                message: 'This transaction has been flagged for review. Please contact support if you believe this is an error.',
                code: 'TRANSACTION_BLOCKED',
                riskLevel: fraudCheckResult.riskLevel
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
                createdAt: new Date().toISOString(),
                riskLevel: fraudCheckResult.riskLevel,
                fraudFlags: fraudCheckResult.flags.join(',') || 'none',
                // Dedication metadata
                dedicationType: dedication?.type || '',
                honoreeName: dedication?.honoreeName || '',
                recipientName: dedication?.recipientName || '',
                recipientEmail: dedication?.recipientEmail || '',
                dedicationMessage: dedication?.message || ''
            },
            automatic_payment_methods: {
                enabled: true
            },
            // Enable 3D Secure for better security
            payment_method_options: {
                card: {
                    request_three_d_secure: 'automatic' // Automatically trigger 3DS when required
                }
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
