(() => {
    'use strict';

    const MIN_AMOUNT = 1;
    const MAX_AMOUNT = 10000;

    const IMPACT_MESSAGES = [
        { max: 49, text: 'Your gift helps provide hygiene kits and essential daily supplies.' },
        { max: 99, text: 'Your support can help cover one night of emergency shelter access.' },
        { max: 249, text: 'Your donation helps fund meals, case support, and mentorship touchpoints.' },
        { max: 499, text: 'Your gift helps sustain consistent outreach and transition planning.' },
        { max: Infinity, text: 'Your generosity helps expand long-term rebuilding pathways for men and boys.' }
    ];

    const state = {
        step: 1,
        amount: 100,
        frequency: 'one-time',
        fullName: '',
        email: '',
        phone: '',
        street: '',
        city: '',
        stateCode: '',
        zip: '',
        cardHolderName: '',
        saveCard: false,
        paymentIntentId: '',
        paymentReady: false,
        paymentInitError: ''
    };

    let stripe = null;
    let cardElement = null;
    let isCardComplete = false;

    const refs = {};

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        bindNavToggle();
        cacheRefs();

        if (!refs.form) {
            return;
        }

        bindFormEvents();
        applyAmountSelection(String(state.amount));
        applyFrequencySelection(state.frequency);
        updateImpactText();
        updateSummary();
        setStep(1);
        setPaymentStatus('Initializing secure checkout...', 'loading');

        initStripe().catch((error) => {
            state.paymentReady = false;
            state.paymentInitError = error.message || 'Payment setup failed. Please refresh and try again.';
            setPaymentStatus(state.paymentInitError, 'error');
            showStepError(3, state.paymentInitError);
            if (refs.cardErrors) {
                refs.cardErrors.textContent = state.paymentInitError;
            }
            disableSubmit();
        });
    }

    function cacheRefs() {
        refs.form = document.getElementById('donateForm');
        refs.steps = Array.from(document.querySelectorAll('.donate-step'));
        refs.panels = Array.from(document.querySelectorAll('.donate-panel'));
        refs.amountOptions = Array.from(document.querySelectorAll('.amount-option'));
        refs.frequencyInputs = Array.from(document.querySelectorAll('input[name="donationFrequency"]'));

        refs.customAmountWrap = document.getElementById('customAmountWrap');
        refs.customAmount = document.getElementById('customAmount');
        refs.impactText = document.getElementById('impactText');

        refs.summaryAmount = document.getElementById('summaryAmount');
        refs.summaryFrequency = document.getElementById('summaryFrequency');
        refs.summaryDonor = document.getElementById('summaryDonor');

        refs.step1Error = document.getElementById('step1Error');
        refs.step2Error = document.getElementById('step2Error');
        refs.step3Error = document.getElementById('step3Error');
        refs.cardErrors = document.getElementById('cardErrors');
        refs.paymentStatusBanner = document.getElementById('paymentStatusBanner');

        refs.cardSlot = document.querySelector('.card-slot');
        refs.submitButton = document.getElementById('donateSubmit');
        refs.submitLabel = document.querySelector('#donateSubmit .submit-label');
        refs.submitLoading = document.querySelector('#donateSubmit .submit-loading');

        refs.printReceipt = document.getElementById('printReceipt');
        refs.donateAgain = document.getElementById('donateAgain');

        refs.receiptDate = document.getElementById('receiptDate');
        refs.transactionId = document.getElementById('transactionId');
        refs.receiptName = document.getElementById('receiptName');
        refs.receiptEmail = document.getElementById('receiptEmail');
        refs.receiptAmount = document.getElementById('receiptAmount');
        refs.receiptFrequency = document.getElementById('receiptFrequency');
    }

    function bindFormEvents() {
        refs.form.addEventListener('click', handleClickEvents);
        refs.form.addEventListener('submit', handleSubmit);

        refs.frequencyInputs.forEach((input) => {
            input.addEventListener('change', () => {
                state.frequency = input.value;
                applyFrequencySelection(state.frequency);
                updateImpactText();
                updateSummary();
            });
        });

        if (refs.customAmount) {
            refs.customAmount.addEventListener('input', () => {
                const rawValue = Number.parseFloat(refs.customAmount.value);
                if (Number.isFinite(rawValue) && rawValue > 0) {
                    state.amount = rawValue;
                    updateImpactText();
                    updateSummary();
                }
            });
        }

        if (refs.printReceipt) {
            refs.printReceipt.addEventListener('click', () => window.print());
        }

        if (refs.donateAgain) {
            refs.donateAgain.addEventListener('click', resetDonationFlow);
        }
    }

    function bindNavToggle() {
        const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('navLinks');

        if (!hamburger || !navLinks) {
            return;
        }

        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 900) {
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('active');
                }
            });
        });
    }

    function handleClickEvents(event) {
        const amountButton = event.target.closest('.amount-option');
        if (amountButton) {
            applyAmountSelection(amountButton.dataset.amount || '');
            return;
        }

        const nextButton = event.target.closest('.donate-next');
        if (nextButton) {
            const targetStep = Number.parseInt(nextButton.dataset.next || '', 10);
            if (Number.isFinite(targetStep) && validateStep(state.step)) {
                setStep(targetStep);
            }
            return;
        }

        const backButton = event.target.closest('.donate-back');
        if (backButton) {
            const targetStep = Number.parseInt(backButton.dataset.back || '', 10);
            if (Number.isFinite(targetStep)) {
                setStep(targetStep);
            }
        }
    }

    function setStep(nextStep) {
        const step = Math.max(1, Math.min(4, nextStep));
        state.step = step;

        refs.steps.forEach((item) => {
            const itemStep = Number.parseInt(item.dataset.step || '0', 10);
            item.classList.remove('is-active', 'is-complete');

            if (itemStep < step) {
                item.classList.add('is-complete');
            } else if (itemStep === step) {
                item.classList.add('is-active');
            }
        });

        refs.panels.forEach((panel) => {
            const panelStep = Number.parseInt(panel.dataset.stepPanel || '0', 10);
            panel.classList.toggle('is-active', panelStep === step);
        });

        clearStepError(1);
        clearStepError(2);
        clearStepError(3);

        if (step === 3) {
            updateSummary();
            if (!state.paymentReady && state.paymentInitError) {
                setPaymentStatus(state.paymentInitError, 'error');
                showStepError(3, state.paymentInitError);
                if (refs.cardErrors) {
                    refs.cardErrors.textContent = state.paymentInitError;
                }
            } else if (state.paymentReady) {
                setPaymentStatus('Secure checkout is ready. Enter your card details.', 'ready');
            }
        }
    }

    function applyAmountSelection(amountKey) {
        refs.amountOptions.forEach((button) => {
            button.classList.toggle('is-active', button.dataset.amount === amountKey);
        });

        if (amountKey === 'custom') {
            if (refs.customAmountWrap) {
                refs.customAmountWrap.hidden = false;
            }
            if (refs.customAmount) {
                refs.customAmount.focus();
                const customValue = Number.parseFloat(refs.customAmount.value);
                if (Number.isFinite(customValue) && customValue > 0) {
                    state.amount = customValue;
                }
            }
        } else {
            if (refs.customAmountWrap) {
                refs.customAmountWrap.hidden = true;
            }
            if (refs.customAmount) {
                refs.customAmount.value = '';
            }

            const numericAmount = Number.parseFloat(amountKey);
            if (Number.isFinite(numericAmount) && numericAmount >= MIN_AMOUNT) {
                state.amount = numericAmount;
            }
        }

        updateImpactText();
        updateSummary();
    }

    function applyFrequencySelection(value) {
        refs.frequencyInputs.forEach((input) => {
            const selected = input.value === value;
            input.checked = selected;

            const pill = input.closest('.choice-pill');
            if (pill) {
                pill.classList.toggle('is-selected', selected);
            }
        });
    }

    function updateImpactText() {
        if (!refs.impactText) {
            return;
        }

        const amount = Number.isFinite(state.amount) ? state.amount : 0;
        const selectedMessage = IMPACT_MESSAGES.find((entry) => amount <= entry.max) || IMPACT_MESSAGES[IMPACT_MESSAGES.length - 1];
        const frequencyPrefix = state.frequency === 'monthly' ? 'Monthly gift: ' : '';

        refs.impactText.textContent = `${frequencyPrefix}${selectedMessage.text}`;
    }

    function updateSummary() {
        if (refs.summaryAmount) {
            refs.summaryAmount.textContent = formatCurrency(state.amount);
        }

        if (refs.summaryFrequency) {
            refs.summaryFrequency.textContent = state.frequency === 'monthly' ? 'Monthly' : 'One-time';
        }

        if (refs.summaryDonor) {
            const name = getValue('fullName');
            refs.summaryDonor.textContent = name || 'Not set';
        }
    }

    function validateStep(step) {
        if (step === 1) {
            clearStepError(1);

            const value = Number.parseFloat(state.amount);
            if (!Number.isFinite(value) || value < MIN_AMOUNT) {
                showStepError(1, 'Please choose a donation amount of at least $1.');
                return false;
            }

            if (value > MAX_AMOUNT) {
                showStepError(1, 'Maximum single donation is $10,000.');
                return false;
            }

            state.amount = value;
            return true;
        }

        if (step === 2) {
            clearStepError(2);

            const fullName = getValue('fullName');
            const email = getValue('email');

            if (fullName.length < 2) {
                showStepError(2, 'Please enter your full name.');
                return false;
            }

            if (!isValidEmail(email)) {
                showStepError(2, 'Please enter a valid email address.');
                return false;
            }

            state.fullName = fullName;
            state.email = email;
            state.phone = getValue('phone');
            state.street = getValue('street');
            state.city = getValue('city');
            state.stateCode = getValue('state').toUpperCase();
            state.zip = getValue('zip');

            return true;
        }

        if (step === 3) {
            clearStepError(3);

            state.cardHolderName = getValue('cardHolderName') || state.fullName;
            state.saveCard = Boolean(document.getElementById('saveCard')?.checked);

            if (!state.paymentReady) {
                setPaymentStatus(state.paymentInitError || 'Secure checkout is not ready.', 'error');
                showStepError(3, state.paymentInitError || 'Payment is not ready. Please refresh the page and try again.');
                return false;
            }

            if (!state.cardHolderName) {
                showStepError(3, 'Please enter the cardholder name.');
                return false;
            }

            if (!stripe || !cardElement) {
                showStepError(3, 'Payment is not ready. Please refresh the page and try again.');
                return false;
            }

            if (!isCardComplete) {
                showStepError(3, 'Please complete your card details.');
                return false;
            }

            return true;
        }

        return true;
    }

    function showStepError(step, message) {
        const target = getStepErrorElement(step);
        if (target) {
            target.textContent = message;
        }
    }

    function clearStepError(step) {
        const target = getStepErrorElement(step);
        if (target) {
            target.textContent = '';
        }

        if (step === 3 && refs.cardErrors) {
            refs.cardErrors.textContent = '';
        }
    }

    function setPaymentStatus(message, tone) {
        if (!refs.paymentStatusBanner) {
            return;
        }

        refs.paymentStatusBanner.textContent = message;
        refs.paymentStatusBanner.classList.remove(
            'payment-status-banner--loading',
            'payment-status-banner--ready',
            'payment-status-banner--error'
        );

        if (tone === 'ready') {
            refs.paymentStatusBanner.classList.add('payment-status-banner--ready');
            return;
        }

        if (tone === 'error') {
            refs.paymentStatusBanner.classList.add('payment-status-banner--error');
            return;
        }

        refs.paymentStatusBanner.classList.add('payment-status-banner--loading');
    }

    function getStepErrorElement(step) {
        if (step === 1) {
            return refs.step1Error;
        }
        if (step === 2) {
            return refs.step2Error;
        }
        return refs.step3Error;
    }

    async function initStripe() {
        if (!window.Stripe) {
            throw new Error('Stripe library did not load. Please refresh this page.');
        }

        const keyResult = await resolveStripeKey();
        const key = keyResult.key;

        if (!key) {
            throw new Error(keyResult.error || 'Stripe is not configured: add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env and restart the server.');
        }

        stripe = window.Stripe(key);

        const elements = stripe.elements({
            appearance: {
                theme: 'stripe',
                variables: {
                    colorPrimary: '#0f766e',
                    colorText: '#0f172a',
                    colorDanger: '#b42318',
                    fontFamily: 'Arial, sans-serif'
                }
            }
        });

        cardElement = elements.create('card', {
            hidePostalCode: true
        });

        cardElement.mount('#card-element');

        cardElement.on('change', (event) => {
            isCardComplete = Boolean(event.complete);
            if (refs.cardErrors) {
                refs.cardErrors.textContent = event.error ? event.error.message : '';
            }
        });

        state.paymentReady = true;
        state.paymentInitError = '';
        setPaymentStatus('Secure checkout is ready. Enter your card details.', 'ready');
    }

    async function resolveStripeKey() {
        const inlineKey = refs.cardSlot?.dataset?.stripePublishableKey || '';
        if (inlineKey) {
            return { key: inlineKey, error: '' };
        }

        try {
            const response = await fetch('/api/stripe-keys', {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            const data = await safeParseJson(response);
            if (!response.ok) {
                return {
                    key: '',
                    error: data.message || data.error || 'Unable to load Stripe publishable key from server.'
                };
            }

            return {
                key: data.publishableKey || '',
                error: data.publishableKey ? '' : 'Stripe publishable key was not returned by server.'
            };
        } catch (_error) {
            return {
                key: '',
                error: 'Could not reach payment configuration endpoint. Please check server status and retry.'
            };
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!validateStep(3)) {
            return;
        }

        toggleSubmitLoading(true);

        try {
            const createIntentResponse = await createPaymentIntent();
            state.paymentIntentId = createIntentResponse.paymentIntentId || '';

            const billingDetails = {
                name: state.cardHolderName,
                email: state.email
            };

            const address = buildBillingAddress();
            if (address) {
                billingDetails.address = address;
            }

            const confirmation = await stripe.confirmCardPayment(createIntentResponse.clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: billingDetails
                }
            });

            if (confirmation.error) {
                throw new Error(confirmation.error.message || 'Payment could not be completed.');
            }

            const paymentIntent = confirmation.paymentIntent;
            if (!paymentIntent || paymentIntent.status !== 'succeeded') {
                throw new Error('Payment is not complete yet. Please try again.');
            }

            state.paymentIntentId = paymentIntent.id;

            try {
                await confirmPaymentIntent(paymentIntent.id);
            } catch (confirmError) {
                console.warn('[DONATE_CONFIRM_WARNING]', confirmError.message);
            }

            renderReceipt(paymentIntent.id);
            setStep(4);
        } catch (error) {
            showStepError(3, error.message || 'Unable to complete donation. Please try again.');
        } finally {
            toggleSubmitLoading(false);
        }
    }

    async function createPaymentIntent() {
        const body = {
            amount: Math.round(state.amount * 100),
            currency: 'usd',
            donorEmail: state.email,
            donorName: state.fullName,
            donationType: state.frequency,
            saveCard: state.saveCard,
            donorInfo: buildDonorInfo()
        };

        const response = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await safeParseJson(response);

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Failed to initialize payment.');
        }

        if (!data.clientSecret) {
            throw new Error('Missing payment authorization from server.');
        }

        return data;
    }

    async function confirmPaymentIntent(paymentIntentId) {
        const body = {
            paymentIntentId,
            donorInfo: {
                name: state.fullName,
                email: state.email,
                address: {
                    city: state.city || '',
                    state: state.stateCode || '',
                    country: 'US'
                }
            }
        };

        const response = await fetch('/api/confirm-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const data = await safeParseJson(response);
            throw new Error(data.message || data.error || 'Payment confirmation check failed.');
        }
    }

    function renderReceipt(transactionId) {
        if (refs.receiptDate) {
            refs.receiptDate.textContent = new Date().toLocaleString();
        }

        if (refs.transactionId) {
            refs.transactionId.textContent = transactionId || '-';
        }

        if (refs.receiptName) {
            refs.receiptName.textContent = state.fullName || '-';
        }

        if (refs.receiptEmail) {
            refs.receiptEmail.textContent = state.email || '-';
        }

        if (refs.receiptAmount) {
            refs.receiptAmount.textContent = formatCurrency(state.amount);
        }

        if (refs.receiptFrequency) {
            refs.receiptFrequency.textContent = state.frequency === 'monthly' ? 'Monthly' : 'One-time';
        }
    }

    function resetDonationFlow() {
        refs.form.reset();

        state.step = 1;
        state.amount = 100;
        state.frequency = 'one-time';
        state.fullName = '';
        state.email = '';
        state.phone = '';
        state.street = '';
        state.city = '';
        state.stateCode = '';
        state.zip = '';
        state.cardHolderName = '';
        state.saveCard = false;
        state.paymentIntentId = '';

        isCardComplete = false;

        if (cardElement) {
            cardElement.clear();
        }

        if (refs.customAmountWrap) {
            refs.customAmountWrap.hidden = true;
        }

        if (refs.customAmount) {
            refs.customAmount.value = '';
        }

        clearStepError(1);
        clearStepError(2);
        clearStepError(3);

        applyFrequencySelection(state.frequency);
        applyAmountSelection(String(state.amount));
        updateImpactText();
        updateSummary();
        setStep(1);

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    function toggleSubmitLoading(isLoading) {
        if (!refs.submitButton) {
            return;
        }

        refs.submitButton.disabled = isLoading;
        if (refs.submitLabel) {
            refs.submitLabel.hidden = isLoading;
        }
        if (refs.submitLoading) {
            refs.submitLoading.hidden = !isLoading;
        }
    }

    function disableSubmit() {
        if (refs.submitButton) {
            refs.submitButton.disabled = true;
        }
    }

    function buildDonorInfo() {
        const donorInfo = {};

        if (state.phone) {
            donorInfo.phone = state.phone;
        }

        const hasAddress = Boolean(state.street || state.city || state.stateCode || state.zip);
        if (hasAddress) {
            donorInfo.address = {
                line1: state.street || '',
                city: state.city || '',
                state: state.stateCode || '',
                postal_code: state.zip || '',
                country: 'US'
            };
        }

        return donorInfo;
    }

    function buildBillingAddress() {
        const hasAddress = Boolean(state.street || state.city || state.stateCode || state.zip);
        if (!hasAddress) {
            return null;
        }

        return {
            line1: state.street || '',
            city: state.city || '',
            state: state.stateCode || '',
            postal_code: state.zip || '',
            country: 'US'
        };
    }

    function getValue(id) {
        return (document.getElementById(id)?.value || '').trim();
    }

    function formatCurrency(value) {
        const normalized = Number.isFinite(value) ? value : 0;
        return `$${normalized.toFixed(2)}`;
    }

    function isValidEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    async function safeParseJson(response) {
        try {
            return await response.json();
        } catch (_error) {
            return {};
        }
    }
})();
