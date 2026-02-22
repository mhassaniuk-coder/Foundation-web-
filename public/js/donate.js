// ============================================
// DONATION PAGE - Multi-Step Payment Processing
// Stripe Integration & Form Validation
// ============================================

// Stripe public key - read from DOM or environment, fallback to empty
// If empty, Stripe will not initialize and user will see helpful error message
const getStripePublicKey = () => {
    // Try reading from data attribute on card container
    const cardElementContainer = document.querySelector('.card-element-container');
    if (cardElementContainer && cardElementContainer.dataset.stripePublishableKey) {
        return cardElementContainer.dataset.stripePublishableKey;
    }
    // Try reading from window object (script injection from server)
    if (window.STRIPE_PUBLIC_KEY) {
        return window.STRIPE_PUBLIC_KEY;
    }
    return '';
};

const STRIPE_PUBLIC_KEY = getStripePublicKey();

// Global state
let stripe = null;
let cardElement = null;
let currentStep = 1;
let donationData = {
    amount: 100,
    frequency: 'one-time',
    fullName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    cardHolderName: '',
    billingDifferent: false,
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    billingCountry: 'US',
    saveCard: false
};

// Impact messages based on amount
const impactMessages = {
    25: "Your $25 donation provides a hot meal and essential supplies for a man in need.",
    50: "Your $50 donation provides a night of safe shelter for someone experiencing homelessness.",
    100: "Your $100 donation can provide a week of meals and shelter for a man in need.",
    250: "Your $250 donation funds a month of mentorship sessions for at-risk youth.",
    500: "Your $500 donation provides emergency housing assistance for a family in crisis."
};

// Card brand symbols for visual display
const cardBrandSymbols = {
    'visa': '💳 VISA',
    'mastercard': '💳 Mastercard',
    'amex': '💳 Amex',
    'discover': '💳 Discover',
    'diners': '💳 Diners',
    'jcb': '💳 JCB',
    'unionpay': '💳 UnionPay',
    'unknown': '💳'
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    // Try to load Stripe publishable key from API if not already set
    loadStripePublicKey().then(() => {
        initializeStripe();
        initializeMultiStepForm();
        initializeAmountButtons();
        initializeFrequencyToggle();
        initializeBillingToggle();
        initializeFormValidation();
        initializeSaveCardOption();
        initializeShareButtons();
        initializePrintButton();
    }).catch(error => {
        console.error('Failed to initialize donation form:', error);
        showConfigurationError(
            'Unable to initialize payment processing. Please refresh the page and try again.',
            'https://stripe.com/docs'
        );
    });
});

/**
 * Load Stripe publishable key from API endpoint
 * Falls back to DOM data attribute if already set
 */
async function loadStripePublicKey() {
    // Check if already set
    const cardElementContainer = document.querySelector('.card-element-container');
    if (cardElementContainer?.dataset.stripePublishableKey) {
        return Promise.resolve();
    }

    // Try to fetch from API
    try {
        const response = await fetch('/api/stripe-keys', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            console.warn('Failed to fetch Stripe publishable key from API:', response.status);
            return Promise.reject(new Error('API endpoint returned ' + response.status));
        }

        const data = await response.json();
        if (data.publishableKey) {
            // Set the key in the DOM for initializeStripe to find
            if (cardElementContainer) {
                cardElementContainer.dataset.stripePublishableKey = data.publishableKey;
            } else {
                window.STRIPE_PUBLIC_KEY = data.publishableKey;
            }
            return Promise.resolve();
        } else {
            return Promise.reject(new Error('No publishable key in response'));
        }
    } catch (error) {
        console.warn('Could not load Stripe key from API, will check DOM:', error.message);
        // If API fails, that's okay—initializeStripe will check DOM and env vars
        return Promise.resolve();
    }
}

// Initialize Stripe
function initializeStripe() {
    if (typeof Stripe !== 'undefined' && STRIPE_PUBLIC_KEY) {
        stripe = Stripe(STRIPE_PUBLIC_KEY);
        const elements = stripe.elements();

        // Custom styling for the Card element
        const style = {
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
            }
        };

        // Create card element
        cardElement = elements.create('card', {
            style: style,
            hidePostalCode: true
        });

        // Mount card element
        const cardElementContainer = document.getElementById('card-element');
        if (cardElementContainer) {
            cardElement.mount('#card-element');

            // Handle real-time validation errors and card brand detection
            cardElement.on('change', function (event) {
                // Card brand detection
                const brand = event.brand;
                const brandIcon = document.getElementById('card-brand-icon');
                if (brandIcon) {
                    brandIcon.className = `card-brand-icon ${brand || ''}`;
                    brandIcon.textContent = getCardBrandSymbol(brand);
                }

                // Show validation errors
                const displayError = document.getElementById('card-errors');
                if (displayError) {
                    if (event.error) {
                        displayError.textContent = event.error.message;
                        displayError.classList.add('visible');
                        displayError.style.display = 'block';
                    } else {
                        displayError.textContent = '';
                        displayError.classList.remove('visible');
                        displayError.style.display = 'none';
                    }
                }

                // Update card complete status
                if (event.complete) {
                    displayError.textContent = '';
                    displayError.classList.remove('visible');
                    displayError.style.display = 'none';
                }
            });
        }
    } else if (typeof Stripe === 'undefined') {
        console.error('Stripe.js library not loaded. Ensure <script src="https://js.stripe.com/v3/"></script> is in <head>.');
        showConfigurationError('Stripe library failed to load', 'https://stripe.com/docs/js');
    } else if (!STRIPE_PUBLIC_KEY) {
        console.error('STRIPE_PUBLIC_KEY is not configured. Set it via data-stripe-publishable-key on .card-element-container or window.STRIPE_PUBLIC_KEY');
        showConfigurationError(
            'Stripe is not configured. Please set your Stripe publishable key in the server configuration.',
            'https://dashboard.stripe.com/apikeys'
        );
    }
}

// Get card brand symbol for display
function getCardBrandSymbol(brand) {
    if (!brand) return cardBrandSymbols['unknown'];
    return cardBrandSymbols[brand] || cardBrandSymbols['unknown'];
}

// Initialize save card option
function initializeSaveCardOption() {
    const saveCardCheckbox = document.getElementById('saveCard');
    if (saveCardCheckbox) {
        saveCardCheckbox.addEventListener('change', function () {
            donationData.saveCard = this.checked;
        });
    }
}

// ============================================
// MULTI-STEP FORM NAVIGATION
// ============================================

function initializeMultiStepForm() {
    // Next buttons
    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', function () {
            const nextStep = parseInt(this.dataset.next);
            if (validateStep(currentStep)) {
                goToStep(nextStep);
            }
        });
    });

    // Back buttons
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', function () {
            const backStep = parseInt(this.dataset.back);
            goToStep(backStep);
        });
    });

    // Form submission
    const form = document.getElementById('donationForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

function goToStep(stepNumber) {
    // Update current step
    currentStep = stepNumber;
    const allSteps = document.querySelectorAll('.form-step');
    allSteps.forEach(step => step.classList.remove('active'));

    // Show target step
    let targetStep = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
    if (!targetStep && allSteps.length >= stepNumber) {
        targetStep = allSteps[stepNumber - 1];
    }
    if (!targetStep && stepNumber === 4) {
        const confirmationContainer = document.querySelector('.confirmation-container');
        if (confirmationContainer) targetStep = confirmationContainer.closest('.form-step');
    }

    if (targetStep) {
        targetStep.classList.add('active');
    } else {
        console.error('Could not find step element with data-step="' + stepNumber + '"');
    }

    // Update progress indicator
    updateProgressIndicator(stepNumber);

    // Update summary if on payment step
    if (stepNumber === 3) {
        updatePaymentSummary();
    }

    // Scroll to top of form
    const formContainer = document.querySelector('.donation-form-container');
    if (formContainer) {
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function updateProgressIndicator(stepNumber) {
    document.querySelectorAll('.progress-steps .step').forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');

        if (stepNum < stepNumber) {
            step.classList.add('completed');
        } else if (stepNum === stepNumber) {
            step.classList.add('active');
        }
    });

    // Update step lines
    document.querySelectorAll('.step-line').forEach((line, index) => {
        if (index < stepNumber - 1) {
            line.classList.add('completed');
        } else {
            line.classList.remove('completed');
        }
    });
}

// ============================================
// STEP VALIDATION
// ============================================

function validateStep(step) {
    clearStepError(step);

    switch (step) {
        case 1:
            return validateStep1();
        case 2:
            return validateStep2();
        case 3:
            return validateStep3();
        default:
            return true;
    }
}

function validateStep1() {
    const amount = donationData.amount;

    if (!amount || amount < 1) {
        showStepError(1, 'Please select or enter a donation amount of at least $1.');
        return false;
    }

    return true;
}

function validateStep2() {
    const fullName = document.getElementById('fullName')?.value.trim();
    const email = document.getElementById('email')?.value.trim();

    let isValid = true;
    let errorMessages = [];

    // Validate full name
    if (!fullName) {
        showFieldError('fullName', 'Full name is required');
        isValid = false;
    } else {
        clearFieldError('fullName');
        donationData.fullName = fullName;
    }

    // Validate email
    if (!email) {
        showFieldError('email', 'Email address is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showFieldError('email', 'Please enter a valid email address');
        isValid = false;
    } else {
        clearFieldError('email');
        donationData.email = email;
    }

    // Collect optional fields
    donationData.phone = document.getElementById('phone')?.value.trim() || '';
    donationData.street = document.getElementById('street')?.value.trim() || '';
    donationData.city = document.getElementById('city')?.value.trim() || '';
    donationData.state = document.getElementById('state')?.value.trim() || '';
    donationData.zip = document.getElementById('zip')?.value.trim() || '';
    donationData.country = document.getElementById('country')?.value || 'US';

    if (!isValid) {
        showStepError(2, 'Please fill in all required fields.');
    }

    return isValid;
}

function validateStep3() {
    const cardHolderName = document.getElementById('cardHolderName')?.value.trim();

    let isValid = true;

    // Validate card holder name
    if (!cardHolderName) {
        showFieldError('cardHolderName', 'Cardholder name is required');
        isValid = false;
    } else {
        clearFieldError('cardHolderName');
        donationData.cardHolderName = cardHolderName;
    }

    // Check if card element is valid
    if (cardElement) {
        // Card validation is handled by Stripe's element
        // We'll do additional validation during submission
    }

    // Collect billing address if different
    if (document.getElementById('differentBilling')?.checked) {
        donationData.billingDifferent = true;
        donationData.billingStreet = document.getElementById('billingStreet')?.value.trim() || '';
        donationData.billingCity = document.getElementById('billingCity')?.value.trim() || '';
        donationData.billingState = document.getElementById('billingState')?.value.trim() || '';
        donationData.billingZip = document.getElementById('billingZip')?.value.trim() || '';
        donationData.billingCountry = document.getElementById('billingCountry')?.value || 'US';
    } else {
        donationData.billingDifferent = false;
    }

    return isValid;
}

// ============================================
// AMOUNT SELECTION
// ============================================

function initializeAmountButtons() {
    const amountBtns = document.querySelectorAll('.amount-btn');
    const customAmountGroup = document.getElementById('customAmountGroup');
    const customAmountInput = document.getElementById('customAmount');

    amountBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            // Remove active from all buttons
            amountBtns.forEach(b => b.classList.remove('active'));
            // Add active to clicked button
            this.classList.add('active');

            const amount = this.dataset.amount;

            if (amount === 'custom') {
                // Show custom amount input
                if (customAmountGroup) {
                    customAmountGroup.style.display = 'block';
                    customAmountInput?.focus();
                }
            } else {
                // Hide custom amount input
                if (customAmountGroup) {
                    customAmountGroup.style.display = 'none';
                }
                // Set amount
                donationData.amount = parseInt(amount);
                updateImpactPreview(parseInt(amount));
            }
        });
    });

    // Custom amount input
    if (customAmountInput) {
        customAmountInput.addEventListener('input', function () {
            const value = parseFloat(this.value);
            if (value && value > 0) {
                donationData.amount = value;
                updateImpactPreview(value);
            }
        });
    }
}

function initializeFrequencyToggle() {
    const frequencyInputs = document.querySelectorAll('input[name="donationFrequency"]');

    frequencyInputs.forEach(input => {
        input.addEventListener('change', function () {
            // Update active state
            document.querySelectorAll('.frequency-option').forEach(opt => {
                opt.classList.remove('active');
            });
            this.closest('.frequency-option').classList.add('active');

            // Store frequency
            donationData.frequency = this.value;
        });
    });
}

function updateImpactPreview(amount) {
    const impactText = document.getElementById('impactText');
    if (!impactText) return;

    // Find the closest impact message
    let message = impactMessages[500]; // Default for amounts >= 500

    for (const threshold of [500, 250, 100, 50, 25]) {
        if (amount >= threshold) {
            message = impactMessages[threshold];
            break;
        }
    }

    // Custom message for amounts not matching presets
    if (amount < 25) {
        message = `Your $${amount} donation helps provide essential support to men and boys in need.`;
    } else if (amount > 500) {
        message = `Your generous $${amount} donation can transform lives through our comprehensive support programs.`;
    }

    impactText.textContent = message;
}

// ============================================
// BILLING ADDRESS TOGGLE
// ============================================

function initializeBillingToggle() {
    const differentBilling = document.getElementById('differentBilling');
    const billingSection = document.getElementById('billingAddressSection');

    if (differentBilling && billingSection) {
        differentBilling.addEventListener('change', function () {
            billingSection.style.display = this.checked ? 'block' : 'none';
        });
    }
}

// ============================================
// FORM VALIDATION HELPERS
// ============================================

function initializeFormValidation() {
    // Real-time validation for email
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function () {
            if (this.value && !isValidEmail(this.value)) {
                showFieldError('email', 'Please enter a valid email address');
            } else {
                clearFieldError('email');
            }
        });
    }

    // Real-time validation for name
    const nameInput = document.getElementById('fullName');
    if (nameInput) {
        nameInput.addEventListener('input', function () {
            if (this.value.trim()) {
                clearFieldError('fullName');
            }
        });
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showFieldError(fieldId, message) {
    const errorEl = document.getElementById(`${fieldId}Error`);
    const inputEl = document.getElementById(fieldId);

    if (errorEl) {
        errorEl.textContent = message;
    }

    if (inputEl) {
        inputEl.classList.add('error');
    }
}

function clearFieldError(fieldId) {
    const errorEl = document.getElementById(`${fieldId}Error`);
    const inputEl = document.getElementById(fieldId);

    if (errorEl) {
        errorEl.textContent = '';
    }

    if (inputEl) {
        inputEl.classList.remove('error');
    }
}

function showStepError(step, message) {
    const errorEl = document.getElementById(`step${step}Error`);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

function clearStepError(step) {
    const errorEl = document.getElementById(`step${step}Error`);
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    }
}

// Show configuration error with setup instructions
function showConfigurationError(message, docsUrl) {
    const statusEl = document.getElementById('payment-status') || createConfigErrorContainer();
    if (statusEl) {
        statusEl.innerHTML = `
            <div class="config-error">
                <h3>⚠️ Payment Setup Required</h3>
                <p>${message}</p>
                <ol>
                    <li>Go to <a href="https://dashboard.stripe.com/register" target="_blank">Stripe Dashboard</a></li>
                    <li>Get your <strong>Publishable Key</strong> from Settings → API Keys</li>
                    <li>In production: Set <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> in your Vercel environment variables</li>
                    <li>Redeploy your application</li>
                </ol>
                <p style="margin-top:1rem;font-size:0.9rem;color:#666;">
                    Or for testing: Add <code>data-stripe-publishable-key="pk_test_..."</code> to the card-element-container div.
                </p>
            </div>
        `;
        statusEl.className = 'payment-status error';
        statusEl.style.display = 'block';
    }

    // Hide the form to prevent submission attempts
    const formContainer = document.querySelector('.donation-form-container');
    if (formContainer) {
        formContainer.style.display = 'none';
    }
}

function createConfigErrorContainer() {
    let statusEl = document.getElementById('payment-status');
    if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.id = 'payment-status';
        const section = document.querySelector('.donation-section');
        if (section) {
            section.insertBefore(statusEl, section.firstChild);
        }
    }
    return statusEl;
}

// ============================================
// PAYMENT SUMMARY
// ============================================

function updatePaymentSummary() {
    const summaryAmount = document.getElementById('summaryAmount');
    const summaryFrequency = document.getElementById('summaryFrequency');
    const summaryTotal = document.getElementById('summaryTotal');

    if (summaryAmount) {
        summaryAmount.textContent = `$${donationData.amount}`;
    }

    if (summaryFrequency) {
        summaryFrequency.textContent = donationData.frequency === 'monthly' ? 'Monthly' : 'One-Time';
    }

    if (summaryTotal) {
        summaryTotal.textContent = `$${donationData.amount.toFixed(2)}`;
    }
}

// ============================================
// API HELPER FUNCTIONS
// ============================================

/**
 * Create a payment intent by calling the API
 * @param {number} amount - Amount in cents
 * @param {object} donorInfo - Donor information
 * @returns {Promise<object>} - Payment intent data
 */
async function createPaymentIntent(amount, donorInfo) {
    try {
        const response = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                amount: Math.round(amount),
                currency: 'usd',
                donorEmail: donorInfo.email,
                donorName: donorInfo.name,
                donationType: donationData.frequency || 'one-time'
            })
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text.substring(0, 500));

            // Provide helpful error message based on response
            if (text.includes('<!DOCTYPE') || text.includes('<html')) {
                throw new Error('Server configuration error. The API endpoint is not properly deployed. Please ensure STRIPE_SECRET_KEY is set in Vercel environment variables.');
            }
            throw new Error('Server returned an invalid response. Please try again later.');
        }

        const data = await response.json();

        if (!response.ok) {
            // Check for specific configuration errors
            if (data.code === 'STRIPE_NOT_CONFIGURED' || data.code === 'STRIPE_AUTH_ERROR') {
                showConfigurationError(data.message, data.docs);
                throw new Error(data.message);
            }
            // Use the message from API if available, otherwise use error
            throw new Error(data.message || data.error || data.details || 'Failed to create payment intent');
        }

        return data;
    } catch (error) {
        console.error('Payment intent error:', error);

        // Re-throw with more context if it's a network error
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
        }

        throw error;
    }
}

// ============================================
// FORM SUBMISSION & STRIPE PAYMENT
// ============================================

async function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateStep(3)) {
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    // Show loading state
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-flex';

    try {
        // Create payment intent using the helper function
        const data = await createPaymentIntent(donationData.amount * 100, {
            name: donationData.fullName,
            email: donationData.email
        });

        if (data.error) {
            throw new Error(data.error);
        }

        // Confirm card payment
        const billingDetails = {
            name: donationData.cardHolderName,
            email: donationData.email,
        };

        // Add address if provided
        if (donationData.billingDifferent) {
            billingDetails.address = {
                line1: donationData.billingStreet,
                city: donationData.billingCity,
                state: donationData.billingState,
                postal_code: donationData.billingZip,
                country: donationData.billingCountry
            };
        } else if (donationData.street) {
            billingDetails.address = {
                line1: donationData.street,
                city: donationData.city,
                state: donationData.state,
                postal_code: donationData.zip,
                country: donationData.country
            };
        }

        // Payment method options
        const paymentMethodOptions = {
            card: cardElement,
            billing_details: billingDetails
        };

        // Setup future usage if save card is checked
        const confirmOptions = {
            payment_method: paymentMethodOptions
        };

        if (donationData.saveCard) {
            confirmOptions.setup_future_usage = 'off_session';
        }

        const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, confirmOptions);

        console.log('[DEBUG] Payment confirmation result:', { error, paymentIntent });

        if (error) {
            console.error('[DEBUG] Payment error:', error);
            throw new Error(error.message);
        }

        // Payment successful - show confirmation
        console.log('[DEBUG] Payment successful, calling showConfirmation()');
        showConfirmation(paymentIntent);

    } catch (error) {
        console.error('Payment error:', error);
        showStepError(3, error.message || 'Payment failed. Please try again.');

        // Reset button state
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

// ============================================
// CONFIRMATION / RECEIPT
// ============================================

function showConfirmation(paymentIntent) {
    // Hide all form steps first
    const allSteps = document.querySelectorAll('.form-step');
    allSteps.forEach(step => step.classList.remove('active'));

    // Find Step 4
    let step4 = document.querySelector('.form-step[data-step="4"]');
    if (!step4) {
        const confirmationContainer = document.querySelector('.confirmation-container');
        if (confirmationContainer) step4 = confirmationContainer.closest('.form-step');
    }
    if (!step4 && allSteps.length >= 4) step4 = allSteps[3];
    if (step4) step4.classList.add('active'); else console.error('Could not find Step 4 element!');

    // Update progress indicator
    updateProgressIndicator(4);

    // Update current step
    currentStep = 4;

    // Scroll to top of form to show confirmation
    const formContainer = document.querySelector('.donation-form-container');
    if (formContainer) {
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Populate receipt data
    const transactionId = document.getElementById('transactionId');
    const receiptDonor = document.getElementById('receiptDonor');
    const receiptEmail = document.getElementById('receiptEmail');
    const receiptAmount = document.getElementById('receiptAmount');
    const receiptFrequency = document.getElementById('receiptFrequency');
    const receiptDate = document.getElementById('receiptDate');

    if (transactionId) {
        transactionId.textContent = paymentIntent.id;
    }

    if (receiptDonor) {
        receiptDonor.textContent = donationData.fullName;
    }

    if (receiptEmail) {
        receiptEmail.textContent = donationData.email;
    }

    if (receiptAmount) {
        const amount = paymentIntent.amount / 100;
        receiptAmount.textContent = `$${amount.toFixed(2)}`;
    }

    if (receiptFrequency) {
        receiptFrequency.textContent = donationData.frequency === 'monthly' ? 'Monthly' : 'One-Time';
    }

    if (receiptDate) {
        const date = new Date();
        receiptDate.textContent = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// ============================================
// SOCIAL SHARING
// ============================================

function initializeShareButtons() {
    document.querySelectorAll('.share-btn[data-share]').forEach(btn => {
        btn.addEventListener('click', function (event) {
            event.preventDefault();
            const share = this.dataset.share;
            const url = encodeURIComponent(window.location.origin);
            if (share === 'facebook') {
                const text = encodeURIComponent('I just donated to Restored Kings Foundation! Help restore dignity and rebuild lives.');
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'width=600,height=400');
            } else if (share === 'twitter') {
                const text = encodeURIComponent('I just donated to @RestoredKings! Help restore dignity and rebuild lives. #RestoredKings #GiveBack');
                window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
            } else if (share === 'linkedin') {
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=400');
            }
        });
    });
}

function initializePrintButton() {
    const printBtn = document.getElementById('printReceiptBtn');
    if (printBtn) printBtn.addEventListener('click', function () { window.print(); });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export for external use
window.DonationPage = {
    getDonationData: () => donationData,
    getCurrentStep: () => currentStep,
    goToStep: goToStep,
    getCardBrandSymbol: getCardBrandSymbol
};
