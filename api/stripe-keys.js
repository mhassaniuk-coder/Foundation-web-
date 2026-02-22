/**
 * Stripe Keys Endpoint
 * 
 * Returns the Stripe publishable key for frontend initialization.
 * This is called by the frontend to safely inject the publishable key
 * without exposing it via environment variables directly in HTML.
 * 
 * @endpoint GET /api/stripe-keys
 * @returns {Object} { publishableKey: string }
 */

'use strict';

module.exports = async (req, res) => {
    // Set CORS headers for this endpoint
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET
    if (req.method !== 'GET') {
        return res.status(405).json({
            error: 'Method not allowed',
            message: 'Only GET requests are accepted'
        });
    }

    try {
        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

        if (!publishableKey) {
            console.warn('[STRIPE_CONFIG] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
            return res.status(503).json({
                error: 'Stripe not configured',
                message: 'The publishable key is not available. Please configure your Stripe account.'
            });
        }

        // Return publishable key (this is safe to expose publicly)
        return res.status(200).json({
            publishableKey,
            environment: process.env.NODE_ENV || 'development'
        });

    } catch (error) {
        console.error('[STRIPE_KEYS_ERROR]', error.message);
        return res.status(500).json({
            error: 'Failed to retrieve Stripe configuration',
            message: 'An unexpected error occurred.'
        });
    }
};
