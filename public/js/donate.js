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

// Payment status tracking
const PaymentStatus = {
    IDLE: 'idle',
    CREATING_INTENT: 'creating_intent',
    CONFIRMING: 'confirming',
    PROCESSING: 'processing',
    SUCCEEDED: 'succeeded',
    FAILED: 'failed',
    CANCELED: 'canceled'
};

let currentPaymentStatus = PaymentStatus.IDLE;

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

// Card brand symbols for visual display with SVG icons
const cardBrandSymbols = {
    'visa': '<svg viewBox="0 0 48 48" class="card-brand-svg"><path fill="#1A1F71" d="M18.5 32.4l2.1-13h3.4l-2.1 13h-3.4zm14.4-12.7c-.7-.3-1.7-.5-3-.5-3.3 0-5.7 1.8-5.7 4.3 0 1.9 1.7 2.9 2.9 3.5 1.3.6 1.7 1 1.7 1.6 0 .8-1 1.2-2 1.2-1.3 0-2-.2-3.1-.7l-.4-.2-.5 2.9c.8.4 2.2.7 3.7.7 3.5 0 5.8-1.7 5.8-4.4 0-1.5-.9-2.6-2.8-3.5-1.2-.6-1.9-1-1.9-1.6 0-.5.6-1.1 1.9-1.1 1.1 0 1.9.2 2.5.5l.3.1.6-2.8zm8.6-.3h-2.6c-.8 0-1.4.2-1.8 1l-5 12h3.5l.7-1.9h4.3l.4 1.9h3.1l-2.6-13zm-4.1 8.4c.3-.8 1.4-3.7 1.4-3.7s.3-.8.5-1.3l.2 1.2s.7 3.3.8 4h-2.9v-.2zM16.4 19.4l-3.3 8.9-.3-1.8c-.6-2-2.5-4.2-4.6-5.3l3 11.2h3.5l5.3-13h-3.6z"/><path fill="#F9A533" d="M10.3 19.4H5l-.1.3c4.2 1.1 7 3.7 8.1 6.8l-1.2-5.9c-.2-.8-.8-1.1-1.5-1.2z"/></svg>',
    'mastercard': '<svg viewBox="0 0 48 48" class="card-brand-svg"><circle cx="17" cy="24" r="10" fill="#EB001B"/><circle cx="31" cy="24" r="10" fill="#F79E1B"/><path fill="#FF5F00" d="M24 16.5c2.5 2 4 5 4 8.5s-1.5 6.5-4 8.5c-2.5-2-4-5-4-8.5s1.5-6.5 4-8.5z"/></svg>',
    'amex': '<svg viewBox="0 0 48 48" class="card-brand-svg"><rect width="48" height="32" rx="4" fill="#006FCF"/><path fill="white" d="M12 18l-4 8h6l.6-1.5h-3.2l.6-1.5h3.2l.6-1.5h-3.2l.6-1.5H16l-2.5 6h3l2.5-6h-4l-.5 1.5h2l-.5 1.5h-2l-.5 1.5h2l-.5 1.5h-3l2.5-6h-3zm9 0l-3 6h3l.5-1h2l.5 1h3l-3-6h-3zm1.5 1.5l1 2h-2l1-2zm5.5 4.5l-2.5-6h3l1.5 3.5 1.5-3.5h3l-2.5 6h-3l-1-2.5-1 2.5h-3z"/></svg>',
    'discover': '<svg viewBox="0 0 48 48" class="card-brand-svg"><rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd"/><ellipse cx="30" cy="24" rx="10" ry="8" fill="#F47216"/><text x="8" y="26" font-size="8" font-weight="bold" fill="#000">DISCOVER</text></svg>',
    'diners': '<svg viewBox="0 0 48 48" class="card-brand-svg"><rect width="48" height="32" rx="4" fill="#0079BE"/><ellipse cx="24" cy="24" rx="10" ry="12" fill="#fff"/><ellipse cx="20" cy="24" rx="6" ry="8" fill="#0079BE"/><ellipse cx="28" cy="24" rx="6" ry="8" fill="#0079BE"/></svg>',
    'jcb': '<svg viewBox="0 0 48 48" class="card-brand-svg"><rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd"/><rect x="4" y="8" width="12" height="24" rx="2" fill="#0E4C96"/><rect x="18" y="8" width="12" height="24" rx="2" fill="#E00B36"/><rect x="32" y="8" width="12" height="24" rx="2" fill="#00A94F"/></svg>',
    'unionpay': '<svg viewBox="0 0 48 48" class="card-brand-svg"><rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd"/><rect x="4" y="8" width="12" height="24" fill="#E21836"/><rect x="18" y="8" width="12" height="24" fill="#00447C"/><rect x="32" y="8" width="12" height="24" fill="#007B84"/></svg>',
    'unknown': '<svg viewBox="0 0 48 48" class="card-brand-svg"><rect width="48" height="32" rx="4" fill="#f3f4f6" stroke="#d1d5db"/><text x="24" y="26" text-anchor="middle" font-size="12" fill="#6b7280">💳</text></svg>'
};

// Card brand display names
const cardBrandNames = {
    'visa': 'Visa',
    'mastercard': 'Mastercard',
    'amex': 'American Express',
    'discover': 'Discover',
    'diners': 'Diners Club',
    'jcb': 'JCB',
    'unionpay': 'UnionPay',
    'unknown': 'Card'
};

// CVC length requirements by card brand
const cvcLengthRequirements = {
    'visa': 3,
    'mastercard': 3,
    'amex': 4,
    'discover': 3,
    'diners': 3,
    'jcb': 3,
    'unionpay': 3,
    'unknown': 3
};

// User-friendly decline code messages
const declineCodeMessages = {
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

// Initialize Stripe with enhanced card validation
function initializeStripe() {
    if (typeof Stripe !== 'undefined' && STRIPE_PUBLIC_KEY) {
        stripe = Stripe(STRIPE_PUBLIC_KEY);
        const elements = stripe.elements({
            fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap' }]
        });

        // Custom styling for the Card element
        const style = {
            base: {
                color: '#1a3a5c',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '16px',
                '::placeholder': {
                    color: '#94a3b8'
                },
                ':focus': {
                    color: '#1a3a5c'
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
        };

        // Create card element with enhanced options
        cardElement = elements.create('card', {
            style: style,
            hidePostalCode: false, // Show postal code for better validation
            disableLink: true,
            iconStyle: 'default',
            value: {
                postalCode: '' // Will be populated from donor info
            }
        });

        // Mount card element
        const cardElementContainer = document.getElementById('card-element');
        if (cardElementContainer) {
            cardElement.mount('#card-element');

            // Handle real-time validation errors and card brand detection
            cardElement.on('change', function (event) {
                handleCardElementChange(event);
            });

            // Handle focus events for visual feedback
            cardElement.on('focus', function () {
                const cardContainer = document.querySelector('.card-element-container');
                if (cardContainer) {
                    cardContainer.classList.add('focused');
                }
            });

            // Handle blur events
            cardElement.on('blur', function () {
                const cardContainer = document.querySelector('.card-element-container');
                if (cardContainer) {
                    cardContainer.classList.remove('focused');
                }
            });

            // Handle ready state
            cardElement.on('ready', function () {
                const cardContainer = document.querySelector('.card-element-container');
                if (cardContainer) {
                    cardContainer.classList.add('ready');
                }
                updateCardValidationUI({ ready: true });
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

/**
 * Handle card element change events with enhanced validation feedback
 * @param {Object} event - Stripe element change event
 */
function handleCardElementChange(event) {
    // Card brand detection
    const brand = event.brand;
    updateCardBrandDisplay(brand);

    // Update validation UI
    updateCardValidationUI(event);

    // Show validation errors
    const displayError = document.getElementById('card-errors');
    if (displayError) {
        if (event.error) {
            const errorMessage = getEnhancedErrorMessage(event.error);
            displayError.innerHTML = `<span class="error-icon">⚠️</span> ${errorMessage}`;
            displayError.classList.add('visible', 'error');
            displayError.classList.remove('success');
            displayError.style.display = 'block';
        } else if (event.complete) {
            displayError.innerHTML = '<span class="success-icon">✓</span> Card details valid';
            displayError.classList.add('visible', 'success');
            displayError.classList.remove('error');
            displayError.style.display = 'block';
        } else {
            displayError.textContent = '';
            displayError.classList.remove('visible', 'error', 'success');
            displayError.style.display = 'none';
        }
    }

    // Update postal code validation
    if (event.value && event.value.postalCode !== undefined) {
        validatePostalCode(event.value.postalCode);
    }
}

/**
 * Update card brand display with visual indicator
 * @param {string} brand - Card brand identifier
 */
function updateCardBrandDisplay(brand) {
    const brandIcon = document.getElementById('card-brand-icon');
    const brandName = document.getElementById('card-brand-name');

    if (brandIcon) {
        brandIcon.className = `card-brand-icon ${brand || 'unknown'}`;
        brandIcon.innerHTML = getCardBrandSymbol(brand);
    }

    if (brandName) {
        brandName.textContent = cardBrandNames[brand] || 'Card';
        brandName.className = `card-brand-name ${brand || 'unknown'}`;
    }

    // Update CVC placeholder based on card type
    updateCVCPlaceholder(brand);
}

/**
 * Update CVC placeholder text based on card brand
 * @param {string} brand - Card brand identifier
 */
function updateCVCPlaceholder(brand) {
    const cvcHint = document.getElementById('cvc-hint');
    if (cvcHint) {
        const requiredLength = cvcLengthRequirements[brand] || 3;
        if (brand === 'amex') {
            cvcHint.textContent = '4 digits on front of card';
        } else {
            cvcHint.textContent = '3 digits on back of card';
        }
    }
}

/**
 * Update card validation UI with visual indicators
 * @param {Object} event - Stripe element event
 */
function updateCardValidationUI(event) {
    const cardContainer = document.querySelector('.card-element-container');
    const validationIndicator = document.getElementById('card-validation-indicator');

    if (cardContainer) {
        cardContainer.classList.remove('valid', 'invalid', 'processing');

        if (event.complete) {
            cardContainer.classList.add('valid');
        } else if (event.error) {
            cardContainer.classList.add('invalid');
        }
    }

    if (validationIndicator) {
        if (event.complete) {
            validationIndicator.innerHTML = '<span class="validation-check">✓</span>';
            validationIndicator.className = 'card-validation-indicator valid';
        } else if (event.error) {
            validationIndicator.innerHTML = '<span class="validation-x">✗</span>';
            validationIndicator.className = 'card-validation-indicator invalid';
        } else if (event.empty !== false) {
            validationIndicator.innerHTML = '';
            validationIndicator.className = 'card-validation-indicator';
        }
    }
}

/**
 * Validate postal code format
 * @param {string} postalCode - Postal code to validate
 */
function validatePostalCode(postalCode) {
    const postalCodeError = document.getElementById('postal-code-error');
    const postalCodeContainer = document.querySelector('.StripeElement--postal-code')?.parentElement;

    if (!postalCode) {
        if (postalCodeError) {
            postalCodeError.textContent = '';
            postalCodeError.style.display = 'none';
        }
        return;
    }

    // Basic validation - can be enhanced for specific countries
    const isValid = postalCode.length >= 3 && postalCode.length <= 10;

    if (postalCodeError) {
        if (!isValid) {
            postalCodeError.textContent = 'Please enter a valid postal code';
            postalCodeError.style.display = 'block';
        } else {
            postalCodeError.textContent = '';
            postalCodeError.style.display = 'none';
        }
    }
}

/**
 * Get enhanced error message from Stripe error object
 * @param {Object} error - Stripe error object
 * @returns {string} User-friendly error message
 */
function getEnhancedErrorMessage(error) {
    // Check for specific error codes
    if (error.code) {
        const codeMessage = declineCodeMessages[error.code];
        if (codeMessage) return codeMessage;
    }

    // Check for decline code
    if (error.decline_code) {
        const declineMessage = declineCodeMessages[error.decline_code];
        if (declineMessage) return declineMessage;
    }

    // Return the message from Stripe or a generic error
    return error.message || 'An error occurred with your card. Please try again.';
}

// Get card brand symbol for display (returns SVG HTML)
function getCardBrandSymbol(brand) {
    if (!brand) return cardBrandSymbols['unknown'];
    return cardBrandSymbols[brand] || cardBrandSymbols['unknown'];
}

// Get card brand name for display
function getCardBrandName(brand) {
    if (!brand) return cardBrandNames['unknown'];
    return cardBrandNames[brand] || cardBrandNames['unknown'];
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

/**
 * Update payment status and UI
 * @param {string} status - Payment status from PaymentStatus enum
 * @param {string} [message] - Optional status message
 */
function updatePaymentStatus(status, message = '') {
    currentPaymentStatus = status;
    const statusEl = document.getElementById('payment-status');

    if (statusEl) {
        statusEl.dataset.status = status;
        statusEl.style.display = 'flex';

        const messageEl = statusEl.querySelector('.status-message');
        if (messageEl) {
            messageEl.textContent = message;
        } else {
            statusEl.innerHTML = `
                <div class="status-spinner"></div>
                <span class="status-message">${message}</span>
            `;
        }

        // Hide for terminal states
        if (status === PaymentStatus.SUCCEEDED) {
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 2000);
        }
    }

    console.log(`[Payment Status] ${status}: ${message}`);
}

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

    // Update payment status
    updatePaymentStatus(PaymentStatus.CREATING_INTENT, 'Creating payment intent...');

    try {
        // Create payment intent using the helper function
        const data = await createPaymentIntent(donationData.amount * 100, {
            name: donationData.fullName,
            email: donationData.email
        });

        if (data.error) {
            throw new Error(data.error);
        }

        updatePaymentStatus(PaymentStatus.CONFIRMING, 'Confirming payment...');

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

        updatePaymentStatus(PaymentStatus.PROCESSING, 'Processing payment...');

        const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, confirmOptions);

        console.log('[DEBUG] Payment confirmation result:', { error, paymentIntent });

        if (error) {
            console.error('[DEBUG] Payment error:', error);
            await handlePaymentError(error);
            // Reset button state
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
            return;
        }

        // Check payment intent status
        if (paymentIntent.status === 'succeeded') {
            updatePaymentStatus(PaymentStatus.SUCCEEDED, 'Payment successful!');
            console.log('[DEBUG] Payment successful, calling showConfirmation()');
            showConfirmation(paymentIntent);
        } else if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_source_action') {
            // Handle 3D Secure authentication
            updatePaymentStatus(PaymentStatus.PROCESSING, 'Additional authentication required...');
            const actionResult = await handle3DSecure(paymentIntent);

            if (actionResult.error) {
                await handlePaymentError(actionResult.error);
                submitBtn.disabled = false;
                btnText.style.display = 'inline';
                btnLoader.style.display = 'none';
            } else if (actionResult.paymentIntent && actionResult.paymentIntent.status === 'succeeded') {
                updatePaymentStatus(PaymentStatus.SUCCEEDED, 'Payment successful!');
                showConfirmation(actionResult.paymentIntent);
            } else {
                // Payment still processing after 3DS
                updatePaymentStatus(PaymentStatus.PROCESSING, 'Payment is processing...');
                pollPaymentStatus(actionResult.paymentIntent?.id || paymentIntent.id);
            }
        } else if (paymentIntent.status === 'processing') {
            updatePaymentStatus(PaymentStatus.PROCESSING, 'Payment is processing...');
            // Poll for status or wait for webhook
            pollPaymentStatus(paymentIntent.id);
        } else {
            updatePaymentStatus(PaymentStatus.FAILED, `Payment status: ${paymentIntent.status}`);
            throw new Error(`Payment status: ${paymentIntent.status}`);
        }

    } catch (error) {
        console.error('Payment error:', error);
        await handlePaymentError(error);

        // Reset button state
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

/**
 * Handle 3D Secure authentication with timeout
 * @param {Object} paymentIntent - Stripe PaymentIntent
 * @returns {Promise<Object>} Result with paymentIntent or error
 */
async function handle3DSecure(paymentIntent) {
    const THREE_DS_TIMEOUT = 5 * 60 * 1000; // 5 minutes timeout

    return new Promise(async (resolve) => {
        // Set up timeout
        const timeoutId = setTimeout(() => {
            resolve({
                error: {
                    message: 'Authentication timed out. Please try again and complete the verification within 5 minutes.',
                    code: 'authentication_timeout'
                }
            });
        }, THREE_DS_TIMEOUT);

        try {
            const { error, paymentIntent: confirmedIntent } = await stripe.handleCardAction(
                paymentIntent.client_secret
            );

            clearTimeout(timeoutId);

            if (error) {
                resolve({ error });
            } else {
                resolve({ paymentIntent: confirmedIntent });
            }
        } catch (err) {
            clearTimeout(timeoutId);
            resolve({
                error: {
                    message: err.message || 'An error occurred during authentication.',
                    code: 'authentication_error'
                }
            });
        }
    });
}

/**
 * Handle payment errors with user-friendly messages
 * @param {Object|Error} error - Payment error
 */
async function handlePaymentError(error) {
    let userMessage = 'Payment failed. Please try again.';
    let errorCode = 'unknown';
    let declineCode = null;

    // Extract error details
    if (error.decline_code) {
        declineCode = error.decline_code;
    }
    if (error.code) {
        errorCode = error.code;
    }

    // Get user-friendly message
    if (declineCode && declineCodeMessages[declineCode]) {
        userMessage = declineCodeMessages[declineCode];
    } else if (errorCode && declineCodeMessages[errorCode]) {
        userMessage = declineCodeMessages[errorCode];
    } else if (error.message) {
        // Check if the message is already user-friendly
        if (error.message.includes('insufficient') ||
            error.message.includes('declined') ||
            error.message.includes('expired')) {
            userMessage = error.message;
        } else {
            // Map common Stripe error messages
            userMessage = mapStripeErrorMessage(error.message);
        }
    }

    // Show error to user
    showStepError(3, userMessage);
    updatePaymentStatus(PaymentStatus.FAILED, userMessage);

    // Log error for debugging
    console.error('[PAYMENT_ERROR]', {
        code: errorCode,
        decline_code: declineCode,
        message: error.message,
        type: error.type
    });
}

/**
 * Map Stripe error messages to user-friendly messages
 * @param {string} message - Original error message
 * @returns {string} User-friendly message
 */
function mapStripeErrorMessage(message) {
    const messageMap = {
        'Your card number is invalid.': 'Invalid card number. Please check your card and try again.',
        'Your card\'s expiration date is invalid.': 'Invalid expiration date. Please check your card\'s expiry.',
        'Your card\'s security code is invalid.': 'Invalid security code. Please check the CVC on your card.',
        'Your card was declined.': 'Your card was declined. Please try a different card.',
        'Your card does not support this type of purchase.': 'This card type is not supported for donations. Please try a different card.',
        'An error occurred while processing your card.': 'A processing error occurred. Please wait a moment and try again.',
        'Your card has insufficient funds.': 'Insufficient funds. Please try a different card or add funds to your account.',
        'Your card has expired.': 'Your card has expired. Please use a different card.',
        'Your card was declined for an unknown reason.': 'Your card was declined. Please contact your bank or try a different card.'
    };

    return messageMap[message] || message;
}

/**
 * Poll for payment status when processing
 * @param {string} paymentIntentId - The payment intent ID to check
 */
async function pollPaymentStatus(paymentIntentId) {
    const maxAttempts = 10;
    const delay = 2000; // 2 seconds

    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, delay));

        try {
            const response = await fetch('/api/confirm-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentIntentId })
            });

            const data = await response.json();

            if (data.status === 'succeeded') {
                updatePaymentStatus(PaymentStatus.SUCCEEDED, 'Payment successful!');
                showConfirmation({ id: paymentIntentId, amount: data.amount });
                return;
            } else if (data.status === 'failed' || data.status === 'canceled') {
                updatePaymentStatus(PaymentStatus.FAILED, data.message || 'Payment failed');
                showStepError(3, data.message || 'Payment failed');
                return;
            }
        } catch (error) {
            console.error('Error polling payment status:', error);
        }
    }

    // If we get here, payment is still processing
    updatePaymentStatus(PaymentStatus.PROCESSING, 'Payment is still processing. You will receive an email confirmation shortly.');
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

    // Store receipt data for download
    storeReceiptData(paymentIntent);

    // Initialize download receipt button
    initializeDownloadReceipt();
}

/**
 * Store receipt data for download/print
 * @param {Object} paymentIntent - The payment intent object
 */
function storeReceiptData(paymentIntent) {
    const receiptData = {
        transactionId: paymentIntent.id,
        donorName: donationData.fullName,
        donorEmail: donationData.email,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency || 'usd',
        frequency: donationData.frequency,
        date: new Date().toISOString(),
        organization: {
            name: 'Restored Kings Foundation',
            ein: '12-3456789',
            address: '123 Main St, City, ST 12345',
            phone: '(555) 123-4567',
            email: 'donations@restoredkings.org',
            website: 'https://restoredkings.org'
        }
    };

    // Store in session storage for receipt page
    sessionStorage.setItem('donationReceipt', JSON.stringify(receiptData));

    // Also store in window for immediate access
    window.lastDonationReceipt = receiptData;
}

/**
 * Initialize download receipt functionality
 */
function initializeDownloadReceipt() {
    const downloadBtn = document.getElementById('downloadReceiptBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadReceipt);
    }
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Download receipt as PDF (opens print dialog)
 */
function downloadReceipt() {
    const receipt = window.lastDonationReceipt || JSON.parse(sessionStorage.getItem('donationReceipt') || '{}');

    if (!receipt.transactionId) {
        alert('No receipt data available. Please try printing from your browser.');
        return;
    }

    // Create a printable receipt
    const printWindow = window.open('', '_blank');
    const amount = receipt.amount.toFixed(2);
    const date = new Date(receipt.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Escape user-provided data to prevent XSS
    const safeDonorName = escapeHtml(receipt.donorName);
    const safeDonorEmail = escapeHtml(receipt.donorEmail);
    const safeTransactionId = escapeHtml(receipt.transactionId);

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Donation Receipt - ${safeTransactionId}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    color: #1a3a5c;
                }
                .receipt-header {
                    text-align: center;
                    border-bottom: 2px solid #d4a574;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .logo {
                    font-size: 24px;
                    font-weight: bold;
                    color: #1a3a5c;
                }
                .logo span {
                    color: #d4a574;
                }
                h1 {
                    font-size: 28px;
                    margin: 20px 0 10px;
                    color: #1a3a5c;
                }
                .receipt-id {
                    font-size: 14px;
                    color: #64748b;
                }
                .receipt-details {
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #e2e8f0;
                }
                .detail-row:last-child {
                    border-bottom: none;
                }
                .detail-label {
                    color: #64748b;
                }
                .detail-value {
                    font-weight: 600;
                    color: #1a3a5c;
                }
                .amount-section {
                    text-align: center;
                    padding: 30px;
                    background: linear-gradient(135deg, #1a3a5c 0%, #0d2137 100%);
                    color: white;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .amount-label {
                    font-size: 14px;
                    opacity: 0.9;
                }
                .amount-value {
                    font-size: 36px;
                    font-weight: bold;
                    margin: 10px 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                    font-size: 12px;
                    color: #64748b;
                }
                .tax-notice {
                    background: #d1fae5;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                    font-size: 14px;
                    color: #065f46;
                }
                @media print {
                    body { padding: 20px; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="receipt-header">
                <div class="logo">♔ Restored <span>Kings</span> Foundation</div>
                <h1>Donation Receipt</h1>
                <div class="receipt-id">Transaction ID: ${safeTransactionId}</div>
            </div>
            
            <div class="amount-section">
                <div class="amount-label">Donation Amount</div>
                <div class="amount-value">$${amount}</div>
                <div class="amount-label">${receipt.frequency === 'monthly' ? 'Monthly Donation' : 'One-Time Donation'}</div>
            </div>
            
            <div class="receipt-details">
                <div class="detail-row">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${date}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Donor Name</span>
                    <span class="detail-value">${safeDonorName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">${safeDonorEmail}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payment Method</span>
                    <span class="detail-value">Credit/Debit Card via Stripe</span>
                </div>
            </div>
            
            <div class="tax-notice">
                <strong>Tax Deductible:</strong> Restored Kings Foundation is a 501(c)(3) nonprofit organization. 
                Your donation is tax-deductible to the extent allowed by law. EIN: ${receipt.organization.ein}
            </div>
            
            <div class="footer">
                <p><strong>${receipt.organization.name}</strong></p>
                <p>${receipt.organization.address}</p>
                <p>Phone: ${receipt.organization.phone} | Email: ${receipt.organization.email}</p>
                <p>Website: ${receipt.organization.website}</p>
                <br>
                <p>Thank you for your generous support!</p>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 20px;">
                <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
                    Print Receipt
                </button>
            </div>
        </body>
        </html>
    `);

    printWindow.document.close();
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
    getCardBrandSymbol: getCardBrandSymbol,
    getCardBrandName: getCardBrandName,
    declineCodeMessages: declineCodeMessages,
    handlePaymentError: handlePaymentError,
    handle3DSecure: handle3DSecure
};

/**
 * Verify card before payment (optional pre-check)
 * @returns {Promise<Object|null>} Verification result or null if skipped
 */
async function verifyCardBeforePayment() {
    try {
        // Skip verification for small amounts or if not configured
        if (donationData.amount < 100) {
            return { valid: true };
        }

        const response = await fetch('/api/verify-card', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: donationData.email,
                amount: donationData.amount * 100
            })
        });

        if (!response.ok) {
            // Don't block payment on verification failure, just log it
            console.warn('Card verification check failed, proceeding with payment');
            return { valid: true };
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.warn('Card verification error:', error);
        // Don't block payment on verification error
        return { valid: true };
    }
}
