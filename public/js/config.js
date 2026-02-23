// Configuration for Supabase
// In production, these values should be injected via environment variables
// For Vercel, use: https://vercel.com/docs/environment-variables
const SUPABASE_URL = window.SUPABASE_URL || "https://sdcyqjnkathygshzilqa.supabase.co";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkY3lxam5rYXRoeWdzaHppbHFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTgyNjQsImV4cCI6MjA4NzI3NDI2NH0.TN7aVuVOkN18DRYWPA4-k3nE6g5HeyOypNP4h_vua6s";

// Stripe public key - configurable via environment variables
// Get your publishable key from: https://dashboard.stripe.com/apikeys
const STRIPE_PUBLIC_KEY = window.STRIPE_PUBLIC_KEY || '';

// Access control configuration
// Update this to the single Gmail that should own admin access.
const ADMIN_BOOTSTRAP_EMAIL = (window.ADMIN_BOOTSTRAP_EMAIL || 'mustafaclienttechfin@gmail.com').trim().toLowerCase();
const USER_STATUS_ACTIVE = 'active';
const USER_STATUS_PENDING = 'pending';

// API Endpoint URLs
const API_ENDPOINTS = {
    // Payment endpoints
    CREATE_PAYMENT_INTENT: '/api/create-payment-intent',
    CONFIRM_PAYMENT: '/api/confirm-payment',
    WEBHOOK: '/api/webhook',
    VERIFY_CARD: '/api/verify-card',

    // Base API path
    BASE_URL: window.location.origin
};

// Payment configuration
const PAYMENT_CONFIG = {
    // Minimum donation amount in cents ($1.00)
    MIN_AMOUNT: 100,

    // Maximum donation amount in cents ($10,000.00)
    MAX_AMOUNT: 1000000,

    // Default currency
    DEFAULT_CURRENCY: 'usd',

    // Supported currencies
    SUPPORTED_CURRENCIES: ['usd', 'cad', 'gbp', 'eur'],

    // Stripe Elements appearance configuration
    ELEMENTS_STYLE: {
        base: {
            color: '#1a3a5c',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': {
                color: '#94a3b8'
            }
        },
        invalid: {
            color: '#ef4444',
            iconColor: '#ef4444'
        },
        complete: {
            color: '#10b981',
            iconColor: '#10b981'
        }
    },

    // Card element options
    CARD_ELEMENT_OPTIONS: {
        hidePostalCode: true,
        disableLink: true,
        iconStyle: 'default'
    }
};

// Error messages for user display
const PAYMENT_ERRORS = {
    // Card errors
    CARD_DECLINED: 'Your card was declined. Please try a different card.',
    INSUFFICIENT_FUNDS: 'Insufficient funds. Please try a different card.',
    INVALID_CARD: 'Invalid card number. Please check and try again.',
    EXPIRED_CARD: 'Your card has expired. Please use a different card.',
    INCORRECT_CVC: 'Your card\'s security code is incorrect.',
    PROCESSING_ERROR: 'An error occurred while processing your card. Please try again.',
    LOST_CARD: 'This card has been reported as lost. Please contact your bank.',
    STOLEN_CARD: 'This card has been reported as stolen. Please contact your bank immediately.',
    CARD_NOT_SUPPORTED: 'This card type is not supported. Please try a different card.',
    DO_NOT_HONOR: 'Your bank has declined this transaction. Please contact your bank or try a different card.',

    // Network errors
    NETWORK_ERROR: 'Unable to connect to the payment service. Please check your internet connection and try again.',
    SERVER_ERROR: 'An error occurred processing your donation. Please try again.',

    // 3D Secure errors
    AUTHENTICATION_FAILED: 'Card authentication failed. Please try again.',
    AUTHENTICATION_REQUIRED: 'Please complete the authentication to proceed.',
    AUTHENTICATION_TIMEOUT: 'Authentication timed out. Please try again and complete the verification within 5 minutes.',

    // Validation errors
    INVALID_AMOUNT: 'Please enter a valid donation amount.',
    MIN_AMOUNT: 'Minimum donation amount is $1.00.',
    MAX_AMOUNT: 'Maximum single donation is $10,000.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    INVALID_POSTAL_CODE: 'Please enter a valid postal code.',

    // Configuration errors
    STRIPE_NOT_CONFIGURED: 'Payment system is not properly configured. Please contact support.',

    // Generic error
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
};

// Decline code to user-friendly message mapping
// NOTE: This is also defined in donate.js (non-ES module) and api/verify-card.js (backend).
// Keep all copies in sync when updating.
const DECLINE_CODE_MESSAGES = {
    'insufficient_funds': 'Your card has insufficient funds for this transaction. Please try a different card or add funds to your account.',
    'lost_card': 'This card has been reported as lost. Please contact your bank or use a different card.',
    'stolen_card': 'This card has been reported as stolen. Please contact your bank immediately.',
    'expired_card': 'Your card has expired. Please use a different card with a valid expiration date.',
    'incorrect_cvc': 'The security code (CVC) you entered is incorrect. Please check the 3-digit code on the back of your card (4 digits on the front for American Express).',
    'processing_error': 'A processing error occurred. Please wait a moment and try again.',
    'card_not_supported': 'This card type is not supported. Please try a different card (Visa, Mastercard, Amex, or Discover).',
    'do_not_honor': 'Your bank has declined this transaction. Please contact your bank or try a different card.',
    'generic_decline': 'Your card was declined. Please try a different card or contact your bank.',
    'invalid_card': 'Invalid card number. Please check your card number and try again.',
    'invalid_expiry_month': 'Invalid expiration month. Please check your card\'s expiration date.',
    'invalid_expiry_year': 'Invalid expiration year. Please check your card\'s expiration date.',
    'invalid_number': 'Invalid card number. Please check your card number and try again.',
    'invalid_cvc': 'Invalid security code. Please check the CVC on your card.',
    'card_declined': 'Your card was declined. Please try a different card.',
    'authentication_required': 'This transaction requires additional authentication. Please complete the verification process.',
    'approve_with_id': 'Your bank requires identification for this transaction. Please contact your bank.',
    'call_issuer': 'Your bank requires you to call them to authorize this transaction.',
    'card_velocity_exceeded': 'Your card has exceeded its spending limit. Please try a smaller amount or different card.',
    'currency_not_supported': 'This card does not support the selected currency. Please try a different card.',
    'duplicate_transaction': 'This appears to be a duplicate transaction. If this was intentional, please wait a moment and try again.',
    'fraudulent': 'This transaction was flagged as potentially fraudulent. Please contact your bank.',
    'merchant_blacklist': 'This card cannot be used for donations at this time. Please try a different card.',
    'new_account_information_available': 'Your bank has updated information about your account. Please contact your bank.',
    'no_action_taken': 'Your bank could not process this transaction. Please try again or use a different card.',
    'not_permitted': 'This transaction is not permitted on your card. Please contact your bank or try a different card.',
    'pickup_card': 'Your card has been flagged. Please contact your bank immediately.',
    'pin_try_exceeded': 'Too many PIN attempts. Please contact your bank or try a different card.',
    'reenter_transaction': 'Please try your transaction again.',
    'restricted_card': 'This card is restricted. Please contact your bank or try a different card.',
    'revocation_of_all_authorizations': 'Your bank has revoked authorization for this card. Please contact your bank.',
    'revocation_of_authorization': 'Your bank has revoked authorization for this transaction. Please contact your bank.',
    'security_violation': 'A security violation was detected. Please contact your bank.',
    'service_not_allowed': 'This service is not allowed on your card. Please contact your bank.',
    'stop_payment_order': 'A stop payment has been placed on this transaction. Please contact your bank.',
    'testmode_decline': 'This is a test card that always declines. Please use a real card.',
    'transaction_not_allowed': 'This transaction is not allowed on your card. Please contact your bank.',
    'try_again_later': 'Please wait a moment and try your transaction again.',
    'withdrawal_count_limit_exceeded': 'Your card has reached its withdrawal limit. Please try a different card.'
};

// Export configuration
export {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    STRIPE_PUBLIC_KEY,
    ADMIN_BOOTSTRAP_EMAIL,
    USER_STATUS_ACTIVE,
    USER_STATUS_PENDING,
    API_ENDPOINTS,
    PAYMENT_CONFIG,
    PAYMENT_ERRORS,
    DECLINE_CODE_MESSAGES
};
