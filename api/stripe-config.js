/**
 * Stripe Configuration and Utility Module
 * 
 * This module provides a centralized Stripe client initialization
 * and common helper functions for Stripe operations.
 * 
 * @module api/stripe-config
 */

'use strict';

// Initialize Stripe client
let stripeClient = null;
let stripeSecretCache = null;

/**
 * Resolve Stripe secret key from supported environment variable names.
 * This helps recover from common naming mismatches across deployments.
 * @returns {string} Stripe secret key or empty string
 */
function getStripeSecretKey() {
    if (stripeSecretCache) {
        return stripeSecretCache;
    }

    const candidates = [
        process.env.STRIPE_SECRET_KEY,
        process.env.STRIPE_SECRET,
        process.env.STRIPE_API_KEY,
        process.env.STRIPE_PRIVATE_KEY,
        process.env.STRIPE_LIVE_SECRET_KEY,
        process.env.STRIPE_TEST_SECRET_KEY
    ];

    for (const rawCandidate of candidates) {
        if (typeof rawCandidate !== 'string') {
            continue;
        }

        // Normalize accidental whitespace/quotes from env entry.
        const normalized = rawCandidate.trim().replace(/^['"]|['"]$/g, '');
        if (!normalized) {
            continue;
        }

        stripeSecretCache = normalized;
        return stripeSecretCache;
    }

    return '';
}

/**
 * Get or initialize the Stripe client
 * @returns {Object} Stripe client instance
 * @throws {Error} If STRIPE_SECRET_KEY is not configured
 */
function getStripeClient() {
    if (!stripeClient) {
        const stripeSecretKey = getStripeSecretKey();

        if (!stripeSecretKey) {
            throw new Error('Stripe secret key is not configured');
        }

        stripeClient = require('stripe')(stripeSecretKey);
    }
    return stripeClient;
}

/**
 * Common CORS headers for API responses
 * @param {string} origin - Allowed origin (defaults to '*')
 * @returns {Object} Headers object
 */
function getCorsHeaders(origin = '*') {
    // Allow explicit ALLOWED_ORIGIN from environment for strict enforcement
    const envAllowed = process.env.ALLOWED_ORIGIN && process.env.ALLOWED_ORIGIN.trim();
    const allowedOrigin = envAllowed || origin || 'null';

    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Stripe-Signature',
        'Vary': 'Origin',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    };
}

/**
 * Set CORS and security headers on response object.
 * When available, prefer the request's `Origin` header but restrict to `ALLOWED_ORIGIN` if set.
 * @param {Object} res - Response object
 * @param {Object} [req] - Optional request object to read origin header
 */
function setCorsHeaders(res, req) {
    const originHeader = req && req.headers && req.headers.origin ? req.headers.origin : '*';
    const headers = getCorsHeaders(originHeader);
    Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
    });
}

/**
 * Validate amount for Stripe payments
 * Amount must be a positive integer in smallest currency unit (cents)
 * 
 * @param {any} amount - Amount to validate
 * @param {Object} options - Validation options
 * @param {number} options.minAmount - Minimum amount in cents (default: 100 = $1.00)
 * @param {number} options.maxAmount - Maximum amount in cents (default: 1000000 = $10,000)
 * @returns {Object} Validation result { valid: boolean, amount?: number, error?: string }
 */
function validateAmount(amount, options = {}) {
    const minAmount = options.minAmount || 100; // $1.00 minimum
    const maxAmount = options.maxAmount || 1000000; // $10,000 maximum

    // Check if amount exists
    if (amount === undefined || amount === null) {
        return {
            valid: false,
            error: 'Amount is required'
        };
    }

    // Convert to number if string
    const numAmount = Number(amount);

    // Check if it's a valid number
    if (isNaN(numAmount)) {
        return {
            valid: false,
            error: 'Amount must be a valid number'
        };
    }

    // Check if positive
    if (numAmount <= 0) {
        return {
            valid: false,
            error: 'Amount must be greater than zero'
        };
    }

    // Round to integer (Stripe requires integer cents)
    const intAmount = Math.round(numAmount);

    // Check minimum
    if (intAmount < minAmount) {
        return {
            valid: false,
            error: `Minimum donation is $${(minAmount / 100).toFixed(2)}`
        };
    }

    // Check maximum
    if (intAmount > maxAmount) {
        return {
            valid: false,
            error: `Maximum single donation is $${(maxAmount / 100).toFixed(2)}`
        };
    }

    return {
        valid: true,
        amount: intAmount
    };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate donor information
 * @param {Object} donorInfo - Donor information object
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
function validateDonorInfo(donorInfo) {
    const errors = [];

    if (!donorInfo) {
        return { valid: true, errors: [] }; // Donor info is optional
    }

    // Validate email if provided
    if (donorInfo.email && !isValidEmail(donorInfo.email)) {
        errors.push('Invalid email format');
    }

    // Validate name length if provided
    if (donorInfo.name && donorInfo.name.length > 255) {
        errors.push('Name must be less than 255 characters');
    }

    // Validate phone format if provided
    if (donorInfo.phone) {
        const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/;
        if (!phoneRegex.test(donorInfo.phone)) {
            errors.push('Invalid phone number format');
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate currency code
 * @param {string} currency - Currency code to validate
 * @returns {Object} Validation result { valid: boolean, currency?: string, error?: string }
 */
function validateCurrency(currency) {
    const supportedCurrencies = ['usd', 'eur', 'gbp', 'cad', 'aud'];

    if (!currency) {
        return { valid: true, currency: 'usd' }; // Default to USD
    }

    const lowerCurrency = currency.toLowerCase();

    if (!supportedCurrencies.includes(lowerCurrency)) {
        return {
            valid: false,
            error: `Unsupported currency: ${currency}. Supported: ${supportedCurrencies.join(', ')}`
        };
    }

    return { valid: true, currency: lowerCurrency };
}

/**
 * Validate donation type
 * @param {string} donationType - Donation type to validate
 * @returns {Object} Validation result { valid: boolean, donationType?: string }
 */
function validateDonationType(donationType) {
    const validTypes = ['one-time', 'monthly'];

    if (!donationType) {
        return { valid: true, donationType: 'one-time' };
    }

    if (!validTypes.includes(donationType)) {
        return {
            valid: false,
            error: `Invalid donation type. Must be one of: ${validTypes.join(', ')}`
        };
    }

    return { valid: true, donationType };
}

/**
 * Create standardized API error response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Error response object
 */
function createErrorResponse(message, code = 'ERROR', statusCode = 400) {
    return {
        statusCode,
        body: {
            error: message,
            code,
            timestamp: new Date().toISOString()
        }
    };
}

/**
 * Create standardized API success response
 * @param {Object} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Success response object
 */
function createSuccessResponse(data, statusCode = 200) {
    return {
        statusCode,
        body: {
            ...data,
            timestamp: new Date().toISOString()
        }
    };
}

/**
 * Parse request body safely
 * @param {any} body - Request body (could be string or object)
 * @returns {Object|null} Parsed body or null if invalid
 */
function parseRequestBody(body) {
    if (!body) return null;

    if (typeof body === 'object') {
        return body;
    }

    if (typeof body === 'string') {
        try {
            return JSON.parse(body);
        } catch (e) {
            return null;
        }
    }

    return null;
}

/**
 * Handle OPTIONS preflight request
 * @param {Object} res - Response object
 * @returns {boolean} True if OPTIONS was handled
 */
function handleOptionsRequest(req, res) {
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        res.status(200).end();
        return true;
    }
    return false;
}

/**
 * Log payment event for audit trail
 * @param {string} eventType - Type of event
 * @param {Object} data - Event data
 */
function logPaymentEvent(eventType, data) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        eventType,
        ...data
    };

    // In production, this would go to a proper logging service
    console.log('[PAYMENT_EVENT]', JSON.stringify(logEntry));
}

/**
 * Payment status mapping for client-friendly messages
 */
const PAYMENT_STATUS_MESSAGES = {
    'succeeded': 'Payment completed successfully',
    'processing': 'Payment is being processed',
    'requires_payment_method': 'Payment requires a valid payment method',
    'requires_confirmation': 'Payment requires confirmation',
    'requires_action': 'Payment requires additional authentication',
    'canceled': 'Payment was canceled',
    'requires_capture': 'Payment requires capture'
};

/**
 * Get user-friendly payment status message
 * @param {string} status - Stripe PaymentIntent status
 * @returns {string} User-friendly message
 */
function getPaymentStatusMessage(status) {
    return PAYMENT_STATUS_MESSAGES[status] || 'Unknown payment status';
}

// Export all functions and constants
module.exports = {
    // Stripe client
    getStripeClient,
    getStripeSecretKey,

    // CORS helpers
    getCorsHeaders,
    setCorsHeaders,

    // Validation functions
    validateAmount,
    validateDonorInfo,
    validateCurrency,
    validateDonationType,
    isValidEmail,

    // Response helpers
    createErrorResponse,
    createSuccessResponse,
    parseRequestBody,

    // Request handling
    handleOptionsRequest,

    // Logging
    logPaymentEvent,

    // Constants
    PAYMENT_STATUS_MESSAGES,
    getPaymentStatusMessage
};
