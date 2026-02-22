// Vercel serverless function for creating Stripe PaymentIntents
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    // Set headers first - before any other operations
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed',
            message: 'Only POST requests are accepted'
        });
    }

    try {
        // Check if Stripe key is configured
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error('STRIPE_SECRET_KEY is not configured');
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'Payment processing is not configured. Please contact support.'
            });
        }

        // Parse body if it's a string (Vercel sometimes sends it as string)
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (parseError) {
                return res.status(400).json({
                    error: 'Invalid JSON',
                    message: 'Request body contains invalid JSON'
                });
            }
        }

        // Ensure body exists
        if (!body) {
            body = {};
        }

        const { amount, currency = 'usd', donorEmail, donorName, donationType } = body;

        // Validate amount - must be a positive integer (cents)
        const parsedAmount = parseInt(amount, 10);
        if (!parsedAmount || parsedAmount < 100 || isNaN(parsedAmount)) {
            return res.status(400).json({
                error: 'Invalid amount',
                message: 'Amount must be at least $1.00 (100 cents)'
            });
        }

        // Create PaymentIntent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: parsedAmount,
            currency: currency,
            metadata: {
                donorEmail: donorEmail || 'anonymous',
                donorName: donorName || 'Anonymous',
                donationType: donationType || 'one-time'
            },
            receipt_email: donorEmail || undefined,
            automatic_payment_methods: {
                enabled: true
            }
        });

        // Return success response
        return res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });

    } catch (error) {
        console.error('PaymentIntent creation error:', error);

        // Handle specific Stripe errors
        if (error.type === 'StripeAuthenticationError') {
            return res.status(500).json({
                error: 'Authentication error',
                message: 'Payment processor authentication failed. Please contact support.'
            });
        }

        if (error.type === 'StripeInvalidRequestError') {
            return res.status(400).json({
                error: 'Invalid request',
                message: error.message
            });
        }

        // Generic error response
        return res.status(500).json({
            error: 'Payment processing error',
            message: error.message || 'An unexpected error occurred'
        });
    }
};
