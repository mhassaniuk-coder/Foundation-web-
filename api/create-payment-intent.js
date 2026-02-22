// Vercel serverless function for creating Stripe PaymentIntents
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error('STRIPE_SECRET_KEY is not set in environment variables');
        return res.status(503).json({
            error: 'Payment processing is not configured.',
            message: 'Please set STRIPE_SECRET_KEY in Vercel Environment Variables. Go to Project Settings → Environment Variables and add your Stripe secret key.',
            code: 'STRIPE_NOT_CONFIGURED',
            docs: 'https://dashboard.stripe.com/apikeys'
        });
    }

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                return res.status(400).json({ error: 'Invalid JSON body' });
            }
        }

        const { amount, donorEmail, donorName, donationType, saveCard } = body || {};

        if (!amount || amount < 100) {
            return res.status(400).json({
                error: 'Invalid amount',
                message: 'Minimum donation is $1.00 (100 cents)'
            });
        }

        const paymentIntentParams = {
            amount: Math.round(amount),
            currency: 'usd',
            metadata: {
                donorEmail: donorEmail || 'anonymous',
                donorName: donorName || 'Anonymous',
                donationType: donationType || 'one-time'
            },
            automatic_payment_methods: { enabled: true }
        };

        if (donorEmail) {
            paymentIntentParams.receipt_email = donorEmail;
        }

        if (saveCard) {
            paymentIntentParams.setup_future_usage = 'off_session';
        }

        const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

        return res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error('PaymentIntent error:', error);

        if (error.type === 'StripeAuthenticationError') {
            return res.status(503).json({
                error: 'Invalid Stripe API key',
                message: 'Your Stripe secret key is invalid. Please check your Vercel environment variables.',
                code: 'STRIPE_AUTH_ERROR'
            });
        }

        return res.status(500).json({
            error: 'Failed to process payment',
            message: error.message,
            code: 'PAYMENT_ERROR'
        });
    }
};
