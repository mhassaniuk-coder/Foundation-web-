// Configuration for Supabase
// In production, these values should be injected via environment variables
// For Vercel, use: https://vercel.com/docs/environment-variables
const SUPABASE_URL = window.SUPABASE_URL || "https://sdcyqjnkathygshzilqa.supabase.co";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkY3lxam5rYXRoeWdzaHppbHFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTgyNjQsImV4cCI6MjA4NzI3NDI2NH0.TN7aVuVOkN18DRYWPA4-k3nE6g5HeyOypNP4h_vua6s";

// Stripe public key - configurable via environment variables
// Get your publishable key from: https://dashboard.stripe.com/apikeys
const STRIPE_PUBLIC_KEY = window.STRIPE_PUBLIC_KEY || '';

// API Endpoint URLs
const API_ENDPOINTS = {
    // Payment endpoints
    CREATE_PAYMENT_INTENT: '/api/create-payment-intent',
    CONFIRM_PAYMENT: '/api/confirm-payment',
    WEBHOOK: '/api/webhook',

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

    // Network errors
    NETWORK_ERROR: 'Unable to connect to the payment service. Please check your internet connection and try again.',
    SERVER_ERROR: 'An error occurred processing your donation. Please try again.',

    // 3D Secure errors
    AUTHENTICATION_FAILED: 'Card authentication failed. Please try again.',
    AUTHENTICATION_REQUIRED: 'Please complete the authentication to proceed.',

    // Validation errors
    INVALID_AMOUNT: 'Please enter a valid donation amount.',
    MIN_AMOUNT: 'Minimum donation amount is $1.00.',
    MAX_AMOUNT: 'Maximum single donation is $10,000.',

    // Configuration errors
    STRIPE_NOT_CONFIGURED: 'Payment system is not properly configured. Please contact support.',

    // Generic error
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
};

// Export configuration
export {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    STRIPE_PUBLIC_KEY,
    API_ENDPOINTS,
    PAYMENT_CONFIG,
    PAYMENT_ERRORS
};
