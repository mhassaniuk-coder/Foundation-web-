/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events for payment confirmation, failures,
 * and other payment-related events. This endpoint receives webhooks
 * from Stripe and processes them accordingly.
 * 
 * @endpoint POST /api/webhook
 * @header Stripe-Signature - Webhook signature for verification
 * 
 * Supported Events:
 * - payment_intent.succeeded: Payment completed successfully
 * - payment_intent.payment_failed: Payment failed
 * - charge.refunded: Charge was refunded
 * - charge.disputed: Charge was disputed (chargeback)
 * 
 * Security:
 * - Webhook signature verification using STRIPE_WEBHOOK_SECRET
 * - Idempotent event processing using event IDs
 */

'use strict';

const {
    getStripeClient,
    logPaymentEvent
} = require('./stripe-config');

/**
 * In-memory store for processed event IDs (for idempotency)
 * In production, this should be replaced with a persistent store (Redis, database)
 * Events are stored with timestamp and cleaned up after 24 hours
 */
const processedEvents = new Map();
const EVENT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Check if event has already been processed
 * @param {string} eventId - Stripe event ID
 * @returns {boolean} True if already processed
 */
function isEventProcessed(eventId) {
    if (processedEvents.has(eventId)) {
        return true;
    }
    return false;
}

/**
 * Mark event as processed
 * @param {string} eventId - Stripe event ID
 */
function markEventProcessed(eventId) {
    processedEvents.set(eventId, Date.now());

    // Clean up old events (prevent memory leak)
    const now = Date.now();
    for (const [id, timestamp] of processedEvents) {
        if (now - timestamp > EVENT_TTL) {
            processedEvents.delete(id);
        }
    }
}

/**
 * Handle successful payment
 * @param {Object} paymentIntent - Stripe PaymentIntent object
 * @returns {Promise<Object>} Processing result
 */
async function handlePaymentSucceeded(paymentIntent) {
    const logData = {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        donorEmail: paymentIntent.receipt_email || paymentIntent.metadata?.donorEmail,
        donorName: paymentIntent.metadata?.donorName,
        donationType: paymentIntent.metadata?.donationType
    };

    logPaymentEvent('payment_succeeded', logData);

    // In production, you would:
    // 1. Save donation record to database (Supabase)
    // 2. Create or update donor record
    // 3. Send receipt email via SendGrid
    // 4. Update analytics

    console.log('[PAYMENT_SUCCEEDED]', JSON.stringify({
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        email: paymentIntent.receipt_email,
        metadata: paymentIntent.metadata
    }));

    return {
        success: true,
        action: 'donation_recorded',
        paymentIntentId: paymentIntent.id
    };
}

/**
 * Handle failed payment
 * @param {Object} paymentIntent - Stripe PaymentIntent object
 * @returns {Promise<Object>} Processing result
 */
async function handlePaymentFailed(paymentIntent) {
    const logData = {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        donorEmail: paymentIntent.metadata?.donorEmail,
        donorName: paymentIntent.metadata?.donorName,
        lastPaymentError: paymentIntent.last_payment_error?.message
    };

    logPaymentEvent('payment_failed', logData);

    console.log('[PAYMENT_FAILED]', JSON.stringify({
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        error: paymentIntent.last_payment_error,
        metadata: paymentIntent.metadata
    }));

    // In production, you might:
    // 1. Log to error tracking service
    // 2. Send notification to donor if email available
    // 3. Update analytics for failed payments

    return {
        success: true,
        action: 'failure_logged',
        paymentIntentId: paymentIntent.id,
        error: paymentIntent.last_payment_error?.message
    };
}

/**
 * Handle refunded charge
 * @param {Object} charge - Stripe Charge object
 * @returns {Promise<Object>} Processing result
 */
async function handleChargeRefunded(charge) {
    const logData = {
        chargeId: charge.id,
        paymentIntentId: charge.payment_intent,
        amount: charge.amount,
        amountRefunded: charge.amount_refunded,
        currency: charge.currency,
        refundReason: charge.refunded_reason
    };

    logPaymentEvent('charge_refunded', logData);

    console.log('[CHARGE_REFUNDED]', JSON.stringify({
        chargeId: charge.id,
        paymentIntentId: charge.payment_intent,
        amount: charge.amount,
        refunded: charge.amount_refunded
    }));

    // In production, you would:
    // 1. Update donation status in database
    // 2. Send refund confirmation email
    // 3. Update financial records

    return {
        success: true,
        action: 'refund_recorded',
        chargeId: charge.id
    };
}

/**
 * Handle disputed charge (chargeback)
 * @param {Object} dispute - Stripe Dispute object
 * @returns {Promise<Object>} Processing result
 */
async function handleChargeDisputed(dispute) {
    const logData = {
        disputeId: dispute.id,
        chargeId: dispute.charge,
        paymentIntentId: dispute.payment_intent,
        amount: dispute.amount,
        currency: dispute.currency,
        reason: dispute.reason,
        status: dispute.status
    };

    logPaymentEvent('charge_disputed', logData);

    console.log('[CHARGE_DISPUTED]', JSON.stringify({
        disputeId: dispute.id,
        chargeId: dispute.charge,
        amount: dispute.amount,
        reason: dispute.reason,
        status: dispute.status
    }));

    // In production, you would:
    // 1. Alert admin team
    // 2. Update donation status
    // 3. Prepare evidence for dispute if needed

    return {
        success: true,
        action: 'dispute_recorded',
        disputeId: dispute.id
    };
}

/**
 * Main handler function
 */
module.exports = async (req, res) => {
    // Set minimal security headers for webhooks (no CORS required)
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    // Only allow POST method
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed',
            message: 'Only POST requests are accepted'
        });
    }

    // Check if Stripe is configured
    let stripe;
    try {
        stripe = getStripeClient();
    } catch (configError) {
        console.error('[CONFIG_ERROR]', configError.message);
        return res.status(503).json({
            error: 'Payment processing is not configured'
        });
    }

    // Check for webhook secret
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('[CONFIG_ERROR] STRIPE_WEBHOOK_SECRET is not set');
        return res.status(503).json({
            error: 'Webhook processing is not configured',
            message: 'STRIPE_WEBHOOK_SECRET environment variable is not set'
        });
    }

    // Get the signature from headers
    const signature = req.headers['stripe-signature'];
    if (!signature) {
        console.error('[WEBHOOK_ERROR] Missing Stripe signature');
        return res.status(400).json({
            error: 'Missing signature',
            message: 'Stripe-Signature header is required'
        });
    }

    // Get raw body for signature verification
    // Vercel provides raw body as req.body if configured properly
    let rawBody = req.body;

    // If body is already parsed to object, we need to get raw string
    // This requires Vercel to be configured with `bodyParser: false` or similar
    if (typeof rawBody !== 'string' && !Buffer.isBuffer(rawBody)) {
        // Try to stringify if it's an object (fallback)
        rawBody = JSON.stringify(rawBody);
    }

    let event;
    try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        console.log('[WEBHOOK_RECEIVED]', {
            eventId: event.id,
            eventType: event.type,
            created: new Date(event.created * 1000).toISOString()
        });
    } catch (err) {
        console.error('[WEBHOOK_SIGNATURE_ERROR]', err.message);
        return res.status(400).json({
            error: 'Webhook signature verification failed',
            message: err.message
        });
    }

    // Check for idempotency (prevent duplicate processing)
    if (isEventProcessed(event.id)) {
        console.log('[WEBHOOK_DUPLICATE]', {
            eventId: event.id,
            type: event.type,
            message: 'Event already processed, skipping'
        });
        return res.status(200).json({
            received: true,
            message: 'Event already processed'
        });
    }

    // Process the event based on type
    let result;
    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                result = await handlePaymentSucceeded(event.data.object);
                break;

            case 'payment_intent.payment_failed':
                result = await handlePaymentFailed(event.data.object);
                break;

            case 'charge.refunded':
                result = await handleChargeRefunded(event.data.object);
                break;

            case 'charge.disputed':
                result = await handleChargeDisputed(event.data.object);
                break;

            case 'payment_intent.created':
                // Log but don't take action
                console.log('[PAYMENT_INTENT_CREATED]', {
                    id: event.data.object.id,
                    amount: event.data.object.amount
                });
                result = { success: true, action: 'logged' };
                break;

            case 'payment_intent.canceled':
                console.log('[PAYMENT_INTENT_CANCELED]', {
                    id: event.data.object.id
                });
                result = { success: true, action: 'logged' };
                break;

            default:
                console.log('[WEBHOOK_UNHANDLED]', {
                    eventType: event.type,
                    eventId: event.id
                });
                result = { success: true, action: 'unhandled', eventType: event.type };
        }

        // Mark event as processed
        markEventProcessed(event.id);

        // Return success response
        return res.status(200).json({
            received: true,
            eventId: event.id,
            eventType: event.type,
            result
        });

    } catch (processingError) {
        console.error('[WEBHOOK_PROCESSING_ERROR]', {
            eventId: event.id,
            eventType: event.type,
            error: processingError.message,
            stack: processingError.stack
        });

        // Return 500 so Stripe retries
        return res.status(500).json({
            error: 'Event processing failed',
            message: 'An error occurred while processing the event',
            eventId: event.id
        });
    }
};
