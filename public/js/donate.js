// ============================================
// DONATION PAGE - Payment Processing
// Stripe Integration & Premium Features Engine
// ============================================

// Stripe public key - configurable via environment variables
const STRIPE_PUBLIC_KEY = window.STRIPE_PUBLIC_KEY || '';

let stripe;
let cardElement;

document.addEventListener('DOMContentLoaded', function () {
    // Initialize Stripe
    if (typeof Stripe !== 'undefined') {
        stripe = Stripe(STRIPE_PUBLIC_KEY);
        const elements = stripe.elements();

        // Custom styling for the Card element
        const style = {
            base: {
                color: '#ffffff',
                fontFamily: '"Outfit", sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '16px',
                '::placeholder': {
                    color: 'rgba(255, 255, 255, 0.4)'
                }
            },
            invalid: {
                color: '#fa755a',
                iconColor: '#fa755a'
            }
        };

        // Create an instance of the card Element
        cardElement = elements.create('card', { style: style });

        // Add an instance of the card Element into the `card-element` <div>
        const cardElementContainer = document.getElementById('card-element');
        if (cardElementContainer) {
            cardElement.mount('#card-element');

            // Handle real-time validation errors from the card Element
            cardElement.on('change', function (event) {
                const displayError = document.getElementById('card-errors');
                if (displayError) {
                    if (event.error) {
                        displayError.textContent = event.error.message;
                    } else {
                        displayError.textContent = '';
                    }
                }
            });
        }

        // Handle form submission
        const donateForm = document.getElementById('donate-form');
        if (donateForm) {
            donateForm.addEventListener('submit', handleDonationSubmit);
        }
    }

    // Initialize all donation page features
    initializeDonationPage();
});

// ============================================
// DONATION FORM HANDLING
// ============================================

async function handleDonationSubmit(event) {
    event.preventDefault();

    const submitBtn = document.querySelector('.donate-submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    try {
        // Get donation amount
        const amount = getSelectedAmount();
        const donationType = document.querySelector('input[name="donation-type"]:checked')?.value || 'one-time';

        // Create payment intent
        const response = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amount,
                currency: 'usd',
                donationType: donationType
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Confirm card payment
        const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: {
                    name: document.getElementById('donor-name')?.value || 'Anonymous',
                    email: document.getElementById('donor-email')?.value || '',
                }
            }
        });

        if (error) {
            throw new Error(error.message);
        }

        // Payment successful
        showSuccessMessage(paymentIntent);

        // Record donation in database
        await recordDonation(paymentIntent, amount, donationType);

    } catch (error) {
        console.error('Payment error:', error);
        showErrorMessage(error.message || 'Payment failed. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function getSelectedAmount() {
    const selectedBtn = document.querySelector('.amount-btn.selected');
    if (selectedBtn) {
        return parseInt(selectedBtn.dataset.amount);
    }
    const customAmount = document.getElementById('custom-amount');
    if (customAmount && customAmount.value) {
        return parseInt(customAmount.value);
    }
    return 25; // Default amount
}

function showSuccessMessage(paymentIntent) {
    const form = document.getElementById('donate-form');
    if (form) {
        form.innerHTML = `
            <div class="success-message">
                <div class="success-icon">✓</div>
                <h3>Thank You for Your Donation!</h3>
                <p>Your contribution of $${(paymentIntent.amount / 100).toFixed(2)} has been processed successfully.</p>
                <p class="transaction-id">Transaction ID: ${paymentIntent.id}</p>
                <button onclick="location.reload()" class="donate-submit-btn">Make Another Donation</button>
            </div>
        `;
    }
}

function showErrorMessage(message) {
    const errorDiv = document.getElementById('card-errors');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

async function recordDonation(paymentIntent, amount, donationType) {
    try {
        // This would typically call your backend to record the donation
        console.log('Recording donation:', {
            paymentIntentId: paymentIntent.id,
            amount: amount,
            type: donationType
        });
    } catch (error) {
        console.error('Error recording donation:', error);
    }
}

// ============================================
// DONATION PAGE INITIALIZATION
// ============================================

function initializeDonationPage() {
    initializeAmountButtons();
    initializeCustomAmount();
    initializeDonationTypeToggle();
    initializeDonationBenefits();
    initializeRecurringOptions();
    initializeTributeOptions();
    initializeCorporateMatching();
    initializeProgressIndicator();
}

// Amount button selection
function initializeAmountButtons() {
    const amountBtns = document.querySelectorAll('.amount-btn');
    const customAmountInput = document.getElementById('custom-amount');

    amountBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            // Remove selected from all buttons
            amountBtns.forEach(b => b.classList.remove('selected'));
            // Add selected to clicked button
            this.classList.add('selected');
            // Clear custom amount
            if (customAmountInput) {
                customAmountInput.value = '';
            }
            // Update summary
            updateDonationSummary();
        });
    });
}

// Custom amount input
function initializeCustomAmount() {
    const customAmountInput = document.getElementById('custom-amount');
    if (customAmountInput) {
        customAmountInput.addEventListener('input', function () {
            // Remove selected from preset buttons
            document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
            updateDonationSummary();
        });
    }
}

// Donation type toggle (one-time vs recurring)
function initializeDonationTypeToggle() {
    const typeInputs = document.querySelectorAll('input[name="donation-type"]');
    typeInputs.forEach(input => {
        input.addEventListener('change', function () {
            updateDonationSummary();
            toggleRecurringOptions(this.value === 'recurring');
        });
    });
}

function toggleRecurringOptions(show) {
    const recurringOptions = document.getElementById('recurring-options');
    if (recurringOptions) {
        recurringOptions.style.display = show ? 'block' : 'none';
    }
}

// Update donation summary
function updateDonationSummary() {
    const amount = getSelectedAmount();
    const donationType = document.querySelector('input[name="donation-type"]:checked')?.value || 'one-time';

    const summaryAmount = document.getElementById('summary-amount');
    const summaryType = document.getElementById('summary-type');

    if (summaryAmount) {
        summaryAmount.textContent = `$${amount}`;
    }

    if (summaryType) {
        summaryType.textContent = donationType === 'recurring' ? 'Monthly' : 'One-time';
    }
}

// Donation benefits display
function initializeDonationBenefits() {
    const amountBtns = document.querySelectorAll('.amount-btn');
    amountBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            updateBenefitsDisplay(parseInt(this.dataset.amount));
        });
    });
}

function updateBenefitsDisplay(amount) {
    const benefitsContainer = document.getElementById('donation-benefits');
    if (!benefitsContainer) return;

    let benefits = [];

    if (amount >= 10) {
        benefits = ['Personal thank you email', 'Name on our donors page'];
    }
    if (amount >= 25) {
        benefits = [...benefits, 'Exclusive newsletter updates', 'Digital certificate of appreciation'];
    }
    if (amount >= 50) {
        benefits = [...benefits, 'Restored Kings Foundation sticker', 'Early access to events'];
    }
    if (amount >= 100) {
        benefits = [...benefits, 'Restored Kings Foundation t-shirt', 'VIP event invitations'];
    }
    if (amount >= 250) {
        benefits = [...benefits, 'Personal video message from leadership', 'Annual report hardcopy'];
    }
    if (amount >= 500) {
        benefits = [...benefits, 'Private dinner invitation', 'Named program sponsorship'];
    }

    benefitsContainer.innerHTML = benefits.length > 0
        ? `<h4>Your Impact</h4><ul>${benefits.map(b => `<li>${b}</li>`).join('')}</ul>`
        : '';
}

// Recurring options
function initializeRecurringOptions() {
    const frequencySelect = document.getElementById('recurring-frequency');
    if (frequencySelect) {
        frequencySelect.addEventListener('change', updateDonationSummary);
    }
}

// Tribute/gift options
function initializeTributeOptions() {
    const tributeCheckbox = document.getElementById('tribute-donation');
    const tributeForm = document.getElementById('tribute-form');

    if (tributeCheckbox && tributeForm) {
        tributeCheckbox.addEventListener('change', function () {
            tributeForm.style.display = this.checked ? 'block' : 'none';
        });
    }
}

// Corporate matching
function initializeCorporateMatching() {
    const matchingSearch = document.getElementById('employer-search');
    if (matchingSearch) {
        matchingSearch.addEventListener('input', debounce(async function () {
            const query = this.value;
            if (query.length >= 2) {
                // Search for matching employers
                const results = await searchMatchingEmployers(query);
                displayMatchingResults(results);
            }
        }, 300));
    }
}

async function searchMatchingEmployers(query) {
    // This would typically call your backend API
    // For now, return mock data
    const employers = [
        { name: 'Google', ratio: '3:1', max: 15000 },
        { name: 'Microsoft', ratio: '1:1', max: 15000 },
        { name: 'Apple', ratio: '1:1', max: 10000 },
        { name: 'Amazon', ratio: '1:1', max: 5000 }
    ];

    return employers.filter(e =>
        e.name.toLowerCase().includes(query.toLowerCase())
    );
}

function displayMatchingResults(results) {
    const resultsContainer = document.getElementById('matching-results');
    if (!resultsContainer) return;

    if (results.length === 0) {
        resultsContainer.innerHTML = '<p>No matching employers found</p>';
        return;
    }

    resultsContainer.innerHTML = results.map(employer => `
        <div class="matching-employer" onclick="selectEmployer('${employer.name}', '${employer.ratio}', ${employer.max})">
            <strong>${employer.name}</strong>
            <span>Match: ${employer.ratio} up to $${employer.max.toLocaleString()}</span>
        </div>
    `).join('');
}

function selectEmployer(name, ratio, max) {
    const selectedEmployer = document.getElementById('selected-employer');
    if (selectedEmployer) {
        selectedEmployer.value = name;
        selectedEmployer.dataset.ratio = ratio;
        selectedEmployer.dataset.max = max;

        // Update summary with matching info
        showMatchingInfo(ratio, max);
    }
}

function showMatchingInfo(ratio, max) {
    const amount = getSelectedAmount();
    const matchAmount = calculateMatch(amount, ratio, max);

    const matchingInfo = document.getElementById('matching-info');
    if (matchingInfo) {
        matchingInfo.innerHTML = `
            <div class="match-alert">
                <strong>Great news!</strong> Your employer will match $${matchAmount} of your donation.
                <br>Total impact: $${amount + matchAmount}
            </div>
        `;
        matchingInfo.style.display = 'block';
    }
}

function calculateMatch(amount, ratio, max) {
    const [multiplier, divisor] = ratio.split(':').map(Number);
    const match = Math.floor(amount * multiplier / divisor);
    return Math.min(match, max);
}

// Progress indicator for fundraising goals
function initializeProgressIndicator() {
    const progressBar = document.getElementById('fundraising-progress');
    if (!progressBar) return;

    // This would typically fetch from your backend
    const currentAmount = 15750;
    const goalAmount = 25000;
    const percentage = (currentAmount / goalAmount) * 100;

    progressBar.innerHTML = `
        <div class="progress-container">
            <div class="progress-bar" style="width: ${percentage}%"></div>
        </div>
        <div class="progress-text">
            <span>$${currentAmount.toLocaleString()} raised</span>
            <span>Goal: $${goalAmount.toLocaleString()}</span>
        </div>
    `;
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

// Export functions for external use
window.DonationPage = {
    getSelectedAmount,
    updateDonationSummary,
    selectEmployer
};
