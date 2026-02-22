// ============================================
// VOLUNTEER PAGE - Multi-Step Application Form
// Form Validation & Supabase Integration
// ============================================

// Global state
let currentStep = 1;
let volunteerData = {
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    // Interests & Skills
    volunteerAreas: [],
    skills: '',
    availability: '',
    languages: '',
    // Experience & Motivation
    experience: '',
    motivation: '',
    referral: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    // Agreements
    termsAgreement: false,
    privacyAgreement: false,
    backgroundCheck: false,
    newsletter: false
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    initializeMultiStepForm();
    initializeFormValidation();
    initializeEditButtons();
});

// ============================================
// MULTI-STEP FORM NAVIGATION
// ============================================

function initializeMultiStepForm() {
    // Next buttons
    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', function () {
            const nextStep = parseInt(this.dataset.next);
            if (validateStep(currentStep)) {
                collectStepData(currentStep);
                goToStep(nextStep);
            }
        });
    });

    // Back buttons
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', function () {
            const backStep = parseInt(this.dataset.back);
            collectStepData(currentStep);
            goToStep(backStep);
        });
    });

    // Form submission
    const form = document.getElementById('volunteerForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

function goToStep(stepNumber) {
    // Update current step
    currentStep = stepNumber;

    // Hide all steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });

    // Show target step
    const targetStep = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
    if (targetStep) {
        targetStep.classList.add('active');
    }

    // Update progress indicator
    updateProgressIndicator(stepNumber);

    // Update review summary if on step 4
    if (stepNumber === 4) {
        updateReviewSummary();
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
        case 4:
            return validateStep4();
        default:
            return true;
    }
}

function validateStep1() {
    const firstName = document.getElementById('firstName')?.value.trim();
    const lastName = document.getElementById('lastName')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const dob = document.getElementById('dob')?.value;
    const street = document.getElementById('street')?.value.trim();
    const city = document.getElementById('city')?.value.trim();
    const state = document.getElementById('state')?.value.trim();
    const zip = document.getElementById('zip')?.value.trim();

    let isValid = true;
    let errorMessages = [];

    // Validate first name
    if (!firstName) {
        showFieldError('firstName', 'First name is required');
        isValid = false;
    } else {
        clearFieldError('firstName');
    }

    // Validate last name
    if (!lastName) {
        showFieldError('lastName', 'Last name is required');
        isValid = false;
    } else {
        clearFieldError('lastName');
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
    }

    // Validate phone
    if (!phone) {
        showFieldError('phone', 'Phone number is required');
        isValid = false;
    } else {
        clearFieldError('phone');
    }

    // Validate date of birth
    if (!dob) {
        showFieldError('dob', 'Date of birth is required');
        isValid = false;
    } else if (!validateAge(dob)) {
        showFieldError('dob', 'You must be 18 years or older to volunteer');
        isValid = false;
    } else {
        clearFieldError('dob');
    }

    // Validate address fields
    if (!street) {
        showFieldError('street', 'Street address is required');
        isValid = false;
    } else {
        clearFieldError('street');
    }

    if (!city) {
        showFieldError('city', 'City is required');
        isValid = false;
    } else {
        clearFieldError('city');
    }

    if (!state) {
        showFieldError('state', 'State/Province is required');
        isValid = false;
    } else {
        clearFieldError('state');
    }

    if (!zip) {
        showFieldError('zip', 'ZIP/Postal code is required');
        isValid = false;
    } else {
        clearFieldError('zip');
    }

    if (!isValid) {
        showStepError(1, 'Please fill in all required fields.');
    }

    return isValid;
}

function validateStep2() {
    const volunteerAreas = document.querySelectorAll('input[name="volunteerAreas"]:checked');
    const availability = document.getElementById('availability')?.value;

    let isValid = true;

    // Validate at least one volunteer area is selected
    if (volunteerAreas.length === 0) {
        showStepError(2, 'Please select at least one volunteer area.');
        isValid = false;
    }

    // Validate availability
    if (!availability) {
        showFieldError('availability', 'Please select your availability');
        isValid = false;
    } else {
        clearFieldError('availability');
    }

    return isValid;
}

function validateStep3() {
    const emergencyName = document.getElementById('emergencyName')?.value.trim();
    const emergencyPhone = document.getElementById('emergencyPhone')?.value.trim();

    let isValid = true;

    // Validate emergency contact name
    if (!emergencyName) {
        showFieldError('emergencyName', 'Emergency contact name is required');
        isValid = false;
    } else {
        clearFieldError('emergencyName');
    }

    // Validate emergency contact phone
    if (!emergencyPhone) {
        showFieldError('emergencyPhone', 'Emergency contact phone is required');
        isValid = false;
    } else {
        clearFieldError('emergencyPhone');
    }

    if (!isValid) {
        showStepError(3, 'Please provide emergency contact information.');
    }

    return isValid;
}

function validateStep4() {
    const termsAgreement = document.getElementById('termsAgreement')?.checked;
    const privacyAgreement = document.getElementById('privacyAgreement')?.checked;

    let isValid = true;

    // Validate terms agreement
    if (!termsAgreement) {
        showStepError(4, 'You must agree to the Terms and Conditions.');
        isValid = false;
    }

    // Validate privacy agreement
    if (!privacyAgreement) {
        showStepError(4, 'You must agree to the Privacy Policy.');
        isValid = false;
    }

    return isValid;
}

// ============================================
// AGE VALIDATION
// ============================================

function validateAge(dob) {
    const today = new Date();
    const birthDate = new Date(dob);
    const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
    return age >= 18;
}

// ============================================
// DATA COLLECTION
// ============================================

function collectStepData(step) {
    switch (step) {
        case 1:
            collectStep1Data();
            break;
        case 2:
            collectStep2Data();
            break;
        case 3:
            collectStep3Data();
            break;
        case 4:
            collectStep4Data();
            break;
    }
}

function collectStep1Data() {
    volunteerData.firstName = document.getElementById('firstName')?.value.trim() || '';
    volunteerData.lastName = document.getElementById('lastName')?.value.trim() || '';
    volunteerData.email = document.getElementById('email')?.value.trim() || '';
    volunteerData.phone = document.getElementById('phone')?.value.trim() || '';
    volunteerData.dob = document.getElementById('dob')?.value || '';
    volunteerData.street = document.getElementById('street')?.value.trim() || '';
    volunteerData.city = document.getElementById('city')?.value.trim() || '';
    volunteerData.state = document.getElementById('state')?.value.trim() || '';
    volunteerData.zip = document.getElementById('zip')?.value.trim() || '';
    volunteerData.country = document.getElementById('country')?.value || 'US';
}

function collectStep2Data() {
    const volunteerAreas = [];
    document.querySelectorAll('input[name="volunteerAreas"]:checked').forEach(checkbox => {
        volunteerAreas.push(checkbox.value);
    });
    volunteerData.volunteerAreas = volunteerAreas;
    volunteerData.skills = document.getElementById('skills')?.value.trim() || '';
    volunteerData.availability = document.getElementById('availability')?.value || '';
    volunteerData.languages = document.getElementById('languages')?.value.trim() || '';
}

function collectStep3Data() {
    volunteerData.experience = document.getElementById('experience')?.value.trim() || '';
    volunteerData.motivation = document.getElementById('motivation')?.value.trim() || '';
    volunteerData.referral = document.getElementById('referral')?.value || '';
    volunteerData.emergencyName = document.getElementById('emergencyName')?.value.trim() || '';
    volunteerData.emergencyPhone = document.getElementById('emergencyPhone')?.value.trim() || '';
    volunteerData.emergencyRelation = document.getElementById('emergencyRelation')?.value.trim() || '';
}

function collectStep4Data() {
    volunteerData.termsAgreement = document.getElementById('termsAgreement')?.checked || false;
    volunteerData.privacyAgreement = document.getElementById('privacyAgreement')?.checked || false;
    volunteerData.backgroundCheck = document.getElementById('backgroundCheck')?.checked || false;
    volunteerData.newsletter = document.getElementById('newsletter')?.checked || false;
}

// ============================================
// REVIEW SUMMARY
// ============================================

function updateReviewSummary() {
    // Collect all data before updating summary
    collectStep1Data();
    collectStep2Data();
    collectStep3Data();

    // Personal Information Summary
    const personalSummary = document.getElementById('reviewPersonal');
    if (personalSummary) {
        personalSummary.innerHTML = `
            <div class="review-item"><strong>Name:</strong> ${volunteerData.firstName} ${volunteerData.lastName}</div>
            <div class="review-item"><strong>Email:</strong> ${volunteerData.email}</div>
            <div class="review-item"><strong>Phone:</strong> ${volunteerData.phone}</div>
            <div class="review-item"><strong>Date of Birth:</strong> ${formatDate(volunteerData.dob)}</div>
            <div class="review-item"><strong>Address:</strong> ${volunteerData.street}, ${volunteerData.city}, ${volunteerData.state} ${volunteerData.zip}, ${volunteerData.country}</div>
        `;
    }

    // Interests & Skills Summary
    const interestsSummary = document.getElementById('reviewInterests');
    if (interestsSummary) {
        const areasFormatted = volunteerData.volunteerAreas.map(area => formatVolunteerArea(area)).join(', ') || 'None selected';
        interestsSummary.innerHTML = `
            <div class="review-item"><strong>Volunteer Areas:</strong> ${areasFormatted}</div>
            <div class="review-item"><strong>Skills:</strong> ${volunteerData.skills || 'Not specified'}</div>
            <div class="review-item"><strong>Availability:</strong> ${formatAvailability(volunteerData.availability)}</div>
            <div class="review-item"><strong>Languages:</strong> ${volunteerData.languages || 'Not specified'}</div>
        `;
    }

    // Experience Summary
    const experienceSummary = document.getElementById('reviewExperience');
    if (experienceSummary) {
        experienceSummary.innerHTML = `
            <div class="review-item"><strong>Previous Experience:</strong> ${volunteerData.experience || 'Not specified'}</div>
            <div class="review-item"><strong>Motivation:</strong> ${volunteerData.motivation || 'Not specified'}</div>
            <div class="review-item"><strong>Referral Source:</strong> ${formatReferral(volunteerData.referral)}</div>
            <div class="review-item"><strong>Emergency Contact:</strong> ${volunteerData.emergencyName} (${volunteerData.emergencyRelation || 'Not specified'}) - ${volunteerData.emergencyPhone}</div>
        `;
    }
}

// ============================================
// EDIT BUTTONS
// ============================================

function initializeEditButtons() {
    document.querySelectorAll('.edit-section').forEach(btn => {
        btn.addEventListener('click', function () {
            const editStep = parseInt(this.dataset.edit);
            goToStep(editStep);
        });
    });
}

// ============================================
// FORM SUBMISSION
// ============================================

async function handleFormSubmit(e) {
    e.preventDefault();

    // Validate step 4
    if (!validateStep(4)) {
        return;
    }

    // Collect final data
    collectStepData(4);

    // Show loading state
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <span class="spinner"></span>
        Submitting...
    `;

    try {
        // Submit to Supabase
        const result = await submitToSupabase();

        if (result.success) {
            // Show confirmation step
            showConfirmation(result.referenceNumber);
        } else {
            showStepError(4, result.error || 'Failed to submit application. Please try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    } catch (error) {
        console.error('Submission error:', error);
        showStepError(4, 'An error occurred. Please try again later.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

async function submitToSupabase() {
    try {
        // Get Supabase client from global scope
        const supabase = window.supabaseClient;

        if (!supabase) {
            // If no Supabase client, simulate success for demo
            console.warn('Supabase client not available, simulating submission');
            return {
                success: true,
                referenceNumber: generateReferenceNumber()
            };
        }

        // Generate reference number
        const referenceNumber = generateReferenceNumber();

        // Prepare data for insertion
        const applicationData = {
            reference_number: referenceNumber,
            first_name: volunteerData.firstName,
            last_name: volunteerData.lastName,
            email: volunteerData.email,
            phone: volunteerData.phone,
            date_of_birth: volunteerData.dob,
            street_address: volunteerData.street,
            city: volunteerData.city,
            state: volunteerData.state,
            zip_code: volunteerData.zip,
            country: volunteerData.country,
            volunteer_areas: volunteerData.volunteerAreas,
            skills: volunteerData.skills,
            availability: volunteerData.availability,
            languages: volunteerData.languages,
            experience: volunteerData.experience,
            motivation: volunteerData.motivation,
            referral_source: volunteerData.referral,
            emergency_contact_name: volunteerData.emergencyName,
            emergency_contact_phone: volunteerData.emergencyPhone,
            emergency_contact_relation: volunteerData.emergencyRelation,
            terms_agreed: volunteerData.termsAgreement,
            privacy_agreed: volunteerData.privacyAgreement,
            background_check_consent: volunteerData.backgroundCheck,
            newsletter_opt_in: volunteerData.newsletter,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        // Insert into volunteer_applications table
        const { data, error } = await supabase
            .from('volunteer_applications')
            .insert([applicationData])
            .select();

        if (error) {
            console.error('Supabase error:', error);
            return {
                success: false,
                error: error.message || 'Failed to submit application'
            };
        }

        return {
            success: true,
            referenceNumber: referenceNumber,
            data: data
        };
    } catch (error) {
        console.error('Submission error:', error);
        return {
            success: false,
            error: 'An unexpected error occurred'
        };
    }
}

// ============================================
// REFERENCE NUMBER GENERATION
// ============================================

function generateReferenceNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `VOL-${timestamp}-${random}`;
}

// ============================================
// CONFIRMATION
// ============================================

function showConfirmation(referenceNumber) {
    // Update reference number
    const refNumberEl = document.getElementById('referenceNumber');
    if (refNumberEl) {
        refNumberEl.textContent = referenceNumber;
    }

    // Update confirmation email
    const confirmEmailEl = document.getElementById('confirmEmail');
    if (confirmEmailEl) {
        confirmEmailEl.textContent = volunteerData.email;
    }

    // Go to confirmation step
    goToStep(5);
}

// ============================================
// FORM VALIDATION UTILITIES
// ============================================

function initializeFormValidation() {
    // Real-time email validation
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

    // Real-time phone formatting
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function () {
            // Basic phone formatting
            let value = this.value.replace(/\D/g, '');
            if (value.length >= 10) {
                value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
            }
            this.value = value;
        });
    }

    // Emergency phone formatting
    const emergencyPhoneInput = document.getElementById('emergencyPhone');
    if (emergencyPhoneInput) {
        emergencyPhoneInput.addEventListener('input', function () {
            let value = this.value.replace(/\D/g, '');
            if (value.length >= 10) {
                value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
            }
            this.value = value;
        });
    }

    // Date of birth max date (must be 18+)
    const dobInput = document.getElementById('dob');
    if (dobInput) {
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() - 18);
        dobInput.max = maxDate.toISOString().split('T')[0];
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ============================================
// ERROR HANDLING
// ============================================

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.add('error');

        // Remove existing error message
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        field.parentElement.appendChild(errorDiv);
    }
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.remove('error');
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
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

// ============================================
// FORMATTING UTILITIES
// ============================================

function formatDate(dateString) {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatVolunteerArea(area) {
    const areaMap = {
        'event-support': 'Event Support',
        'administrative': 'Administrative Support',
        'mentorship': 'Mentorship Programs',
        'fundraising': 'Fundraising',
        'marketing': 'Marketing & Social Media',
        'technical': 'Technical Support',
        'outreach': 'Community Outreach'
    };
    return areaMap[area] || area;
}

function formatAvailability(availability) {
    const availabilityMap = {
        'weekdays': 'Weekdays',
        'weekends': 'Weekends',
        'evenings': 'Evenings',
        'flexible': 'Flexible'
    };
    return availabilityMap[availability] || 'Not specified';
}

function formatReferral(referral) {
    const referralMap = {
        'friend': 'Friend or Family',
        'social': 'Social Media',
        'web': 'Website',
        'event': 'Community Event',
        'church': 'Church/Religious Organization',
        'news': 'News Article',
        'other': 'Other'
    };
    return referralMap[referral] || 'Not specified';
}

// ============================================
// EXPORT FOR TESTING
// ============================================

window.volunteerForm = {
    validateStep,
    validateAge,
    collectStepData,
    goToStep,
    generateReferenceNumber,
    getVolunteerData: () => ({ ...volunteerData })
};
