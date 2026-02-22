// Vercel serverless function for creating Stripe PaymentIntents
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { amount, currency = 'usd', donorEmail, donorName, donationType } = req.body;

        // Validate amount
        if (!amount || amount < 100) { // Minimum $1.00
            return res.status(400).json({ error: 'Invalid amount. Minimum donation is $1.00' });
        }

        // Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount), // Amount in cents
            currency: currency,
            metadata: {
                donorEmail: donorEmail || 'anonymous',
                donorName: donorName || 'Anonymous',
                donationType: donationType || 'one-time'
            },
            receipt_email: donorEmail,
            automatic_payment_methods: {
                enabled: true
            }
        });

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error('PaymentIntent creation error:', error);
        res.status(500).json({
            error: 'Failed to create payment intent',
            details: error.message
        });
    }
}
