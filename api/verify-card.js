/**
 * Card Verification Endpoint
 * 
 * Verifies card validity before processing a payment.
 * This endpoint performs pre-payment checks to help catch issues
 * before the actual donation is attempted.
 * 
 * @endpoint POST /api/verify-card
 * @param {string} [email] - Donor's email address
 * @param {number} [amount] - Amount in cents for verification context
 * @param {Object} [billingAddress] - Billing address for verification
 * 
 * @returns {Object} Verification result with status and any warnings
 */

'use strict';

const {
    getStripeClient,
    setCorsHeaders,
    parseRequestBody,
    handleOptionsRequest,
    logPaymentEvent,
    isValidEmail
} = require('./stripe-config');

/**
 * User-friendly decline code messages
 * NOTE: This is also defined in public/js/config.js and public/js/donate.js.
 * Keep all copies in sync when updating.
 */
const DECLINE_CODE_MESSAGES = {
    'insufficient_funds': 'Your card has insufficient funds for this transaction.',
    'lost_card': 'This card has been reported as lost.',
    'stolen_card': 'This card has been reported as stolen.',
    'expired_card': 'Your card has expired.',
    'incorrect_cvc': 'The security code entered is incorrect.',
    'processing_error': 'A processing error occurred.',
    'card_not_supported': 'This card type is not supported.',
    'do_not_honor': 'Your bank has declined this transaction.',
    'generic_decline': 'Your card was declined.',
    'invalid_card': 'Invalid card number.',
    'invalid_expiry_month': 'Invalid expiration month.',
    'invalid_expiry_year': 'Invalid expiration year.',
    'invalid_number': 'Invalid card number.',
    'invalid_cvc': 'Invalid security code.',
    'card_declined': 'Your card was declined.',
    'authentication_required': 'This transaction requires additional authentication.',
    'approve_with_id': 'Your bank requires identification for this transaction.',
    'call_issuer': 'Your bank requires you to call them to authorize this transaction.',
    'card_velocity_exceeded': 'Your card has exceeded its spending limit.',
    'currency_not_supported': 'This card does not support the selected currency.',
    'duplicate_transaction': 'This appears to be a duplicate transaction.',
    'fraudulent': 'This transaction was flagged as potentially fraudulent.',
    'merchant_blacklist': 'This card cannot be used for this transaction.',
    'new_account_information_available': 'Your bank has updated information about your account.',
    'no_action_taken': 'Your bank could not process this transaction.',
    'not_permitted': 'This transaction is not permitted on your card.',
    'pickup_card': 'Your card has been flagged.',
    'pin_try_exceeded': 'Too many PIN attempts.',
    'reenter_transaction': 'Please try your transaction again.',
    'restricted_card': 'This card is restricted.',
    'revocation_of_all_authorizations': 'Your bank has revoked authorization for this card.',
    'revocation_of_authorization': 'Your bank has revoked authorization for this transaction.',
    'security_violation': 'A security violation was detected.',
    'service_not_allowed': 'This service is not allowed on your card.',
    'stop_payment_order': 'A stop payment has been placed on this transaction.',
    'testmode_decline': 'This is a test card that always declines.',
    'transaction_not_allowed': 'This transaction is not allowed on your card.',
    'try_again_later': 'Please wait a moment and try again.',
    'withdrawal_count_limit_exceeded': 'Your card has reached its withdrawal limit.'
};

/**
 * Get user-friendly message for a decline code
 * @param {string} code - Decline code from Stripe
 * @returns {string} User-friendly message
 */
function getDeclineMessage(code) {
    return DECLINE_CODE_MESSAGES[code] || 'Your card was declined. Please try a different card.';
}

/**
 * Perform basic validation checks
 * @param {Object} data - Data to validate
 * @returns {Object} Validation result
 */
function performBasicValidation(data) {
    const warnings = [];
    const errors = [];

    // Validate email if provided
    if (data.email && !isValidEmail(data.email)) {
        errors.push('Invalid email format');
    }

    // Validate amount if provided
    if (data.amount !== undefined) {
        const numAmount = Number(data.amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            errors.push('Invalid amount');
        } else if (numAmount < 100) {
            warnings.push('Amount below minimum ($1.00)');
        } else if (numAmount > 1000000) {
            warnings.push('Amount above maximum ($10,000)');
        }
    }

    // Validate billing address if provided
    if (data.billingAddress) {
        const addr = data.billingAddress;

        // Check postal code format for known countries
        if (addr.postal_code && addr.country) {
            const postalPatterns = {
                'US': /^\d{5}(-\d{4})?$/,
                'CA': /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
                'GB': /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i
            };

            const pattern = postalPatterns[addr.country];
            if (pattern && !pattern.test(addr.postal_code)) {
                warnings.push('Postal code format may be incorrect');
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Check for suspicious patterns
 * @param {Object} data - Data to check
 * @returns {Object} Check result with risk indicators
 */
function checkSuspiciousPatterns(data) {
    const indicators = [];
    let riskLevel = 'low';

    // Check email for suspicious patterns
    if (data.email) {
        const email = data.email.toLowerCase();

        // Known temporary email domains
        const tempDomains = ['tempmail', 'guerrillamail', '10minutemail', 'throwaway', 'mailinator', 'fakeinbox'];
        if (tempDomains.some(domain => email.includes(domain))) {
            indicators.push('temporary_email');
            riskLevel = 'medium';
        }

        // Suspiciously long local part
        if (email.split('@')[0].length > 30) {
            indicators.push('suspicious_email_length');
        }

        // Random character patterns
        if (email.match(/^[a-z]{15,}\d{3,}@/)) {
            indicators.push('random_email_pattern');
            riskLevel = 'medium';
        }
    }

    // Check amount patterns
    if (data.amount) {
        // Very small amounts might indicate card testing
        if (data.amount <= 100) {
            indicators.push('small_amount');
        }
    }

    return {
        riskLevel,
        indicators
    };
}

/**
 * Main handler function
 */
module.exports = async (req, res) => {
    // Set CORS headers
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
            message: 'Please set STRIPE_SECRET_KEY in environment variables.',
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

        const {
            email,
            amount,
            billingAddress,
            paymentMethodId // Optional: if client has already created a payment method
        } = body;

        // Perform basic validation
        const validation = performBasicValidation({ email, amount, billingAddress });

        if (!validation.valid) {
            return res.status(400).json({
                valid: false,
                errors: validation.errors,
                warnings: validation.warnings,
                code: 'VALIDATION_FAILED'
            });
        }

        // Check for suspicious patterns
        const suspiciousCheck = checkSuspiciousPatterns({ email, amount });

        // Log verification attempt
        logPaymentEvent('card_verification', {
            email: email || 'anonymous',
            amount: amount || 0,
            riskLevel: suspiciousCheck.riskLevel,
            indicators: suspiciousCheck.indicators,
            ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
        });

        // If a payment method ID is provided, we can do a more thorough check
        if (paymentMethodId) {
            try {
                // Retrieve the payment method to check its details
                const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

                // Check card details
                const cardCheck = {
                    brand: paymentMethod.card?.brand || 'unknown',
                    country: paymentMethod.card?.country || 'unknown',
                    funding: paymentMethod.card?.funding || 'unknown',
                    last4: paymentMethod.card?.last4 || '****',
                    expMonth: paymentMethod.card?.exp_month,
                    expYear: paymentMethod.card?.exp_year
                };

                // Check if card is expired
                const now = new Date();
                // Card is valid until the END of the expiration month
                // Using day 0 of the next month gives us the last day of the expiration month
                const expDate = new Date(cardCheck.expYear, cardCheck.expMonth, 0);
                // Set to end of that day
                expDate.setHours(23, 59, 59, 999);
                if (expDate < now) {
                    return res.status(200).json({
                        valid: false,
                        message: 'Your card has expired.',
                        code: 'EXPIRED_CARD',
                        cardDetails: {
                            brand: cardCheck.brand,
                            last4: cardCheck.last4
                        }
                    });
                }

                // Card looks valid
                return res.status(200).json({
                    valid: true,
                    message: 'Card verification successful',
                    cardDetails: {
                        brand: cardCheck.brand,
                        last4: cardCheck.last4,
                        funding: cardCheck.funding
                    },
                    warnings: validation.warnings,
                    riskLevel: suspiciousCheck.riskLevel
                });

            } catch (pmError) {
                console.error('[PAYMENT_METHOD_ERROR]', pmError);

                // Handle specific errors
                if (pmError.code === 'resource_missing') {
                    return res.status(400).json({
                        valid: false,
                        message: 'Invalid payment method',
                        code: 'INVALID_PAYMENT_METHOD'
                    });
                }

                // For other errors, continue with basic verification
            }
        }

        // Basic verification result (no payment method provided)
        const result = {
            valid: true,
            message: 'Basic verification passed',
            warnings: validation.warnings,
            riskLevel: suspiciousCheck.riskLevel
        };

        // Add recommendations based on checks
        if (suspiciousCheck.indicators.length > 0) {
            result.recommendations = [
                'Consider using 3D Secure for additional security',
                'Verify billing address matches card details'
            ];
        }

        // If there are warnings but no errors, still return valid
        if (validation.warnings.length > 0) {
            result.message = 'Verification passed with warnings';
        }

        return res.status(200).json(result);

    } catch (error) {
        console.error('[VERIFY_CARD_ERROR]', {
            message: error.message,
            type: error.type,
            code: error.code
        });

        // Handle Stripe-specific errors
        if (error.type === 'StripeAuthenticationError') {
            return res.status(503).json({
                valid: false,
                error: 'Invalid Stripe API key',
                code: 'STRIPE_AUTH_ERROR'
            });
        }

        if (error.type === 'StripeRateLimitError') {
            return res.status(429).json({
                valid: false,
                error: 'Too many requests',
                message: 'Please wait a moment and try again.',
                code: 'RATE_LIMIT_EXCEEDED'
            });
        }

        // Generic error response
        return res.status(500).json({
            valid: false,
            error: 'Verification failed',
            message: process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred. Please try again.'
                : error.message,
            code: 'INTERNAL_ERROR'
        });
    }
};

// Export decline messages for use by other modules
module.exports.DECLINE_CODE_MESSAGES = DECLINE_CODE_MESSAGES;
module.exports.getDeclineMessage = getDeclineMessage;
