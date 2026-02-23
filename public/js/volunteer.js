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
    // Interests & Skills
    volunteerAreas: [],
    skills: '',
    availability: '',
    languages: '',
    // Experience & Motivation
    experience: '',
    motivation: '',
    emergencyName: '',
    emergencyPhone: '',
    // Agreements
    termsAgreement: false,
    backgroundCheck: false
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
        const offset = 100; // Header offset
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = formContainer.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
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

    if (!firstName) { showFieldError('firstName', 'Identity requires a name'); isValid = false; } else { clearFieldError('firstName'); }
    if (!lastName) { showFieldError('lastName', 'Family name is essential'); isValid = false; } else { clearFieldError('lastName'); }
    if (!email || !isValidEmail(email)) { showFieldError('email', 'A valid digital seal (email) is required'); isValid = false; } else { clearFieldError('email'); }
    if (!phone) { showFieldError('phone', 'Transmission line (phone) is required'); isValid = false; } else { clearFieldError('phone'); }
    if (!dob || !validateAge(dob)) { showFieldError('dob', 'Candidates must be 18+ orbits old'); isValid = false; } else { clearFieldError('dob'); }
    if (!street || !city || !state || !zip) { showStepError(1, 'Full coordinates (address) are required for the registry.'); isValid = false; }

    return isValid;
}

function validateStep2() {
    const volunteerAreas = document.querySelectorAll('input[name="volunteerAreas"]:checked');
    const availability = document.getElementById('availability')?.value;

    let isValid = true;

    if (volunteerAreas.length === 0) {
        showStepError(2, 'Please select at least one sphere of influence.');
        isValid = false;
    }

    if (!availability) {
        showFieldError('availability', 'We must know when you can serve');
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

    if (!emergencyName) { showFieldError('emergencyName', 'An emergency contact name is required'); isValid = false; } else { clearFieldError('emergencyName'); }
    if (!emergencyPhone) { showFieldError('emergencyPhone', 'An emergency contact phone is required'); isValid = false; } else { clearFieldError('emergencyPhone'); }

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
            volunteerData.firstName = document.getElementById('firstName')?.value.trim() || '';
            volunteerData.lastName = document.getElementById('lastName')?.value.trim() || '';
            volunteerData.email = document.getElementById('email')?.value.trim() || '';
            volunteerData.phone = document.getElementById('phone')?.value.trim() || '';
            volunteerData.dob = document.getElementById('dob')?.value || '';
            volunteerData.street = document.getElementById('street')?.value.trim() || '';
            volunteerData.city = document.getElementById('city')?.value.trim() || '';
            volunteerData.state = document.getElementById('state')?.value.trim() || '';
            volunteerData.zip = document.getElementById('zip')?.value.trim() || '';
            break;
        case 2:
            const volunteerAreas = [];
            document.querySelectorAll('input[name="volunteerAreas"]:checked').forEach(checkbox => {
                volunteerAreas.push(checkbox.value);
            });
            volunteerData.volunteerAreas = volunteerAreas;
            volunteerData.skills = document.getElementById('skills')?.value.trim() || '';
            volunteerData.availability = document.getElementById('availability')?.value || '';
            volunteerData.languages = document.getElementById('languages')?.value.trim() || '';
            break;
        case 3:
            volunteerData.experience = document.getElementById('experience')?.value.trim() || '';
            volunteerData.motivation = document.getElementById('motivation')?.value.trim() || '';
            volunteerData.emergencyName = document.getElementById('emergencyName')?.value.trim() || '';
            volunteerData.emergencyPhone = document.getElementById('emergencyPhone')?.value.trim() || '';
            break;
    }
}

// ============================================
// REVIEW SUMMARY
// ============================================

function updateReviewSummary() {
    // Personal Information Summary
    const personalSummary = document.getElementById('reviewPersonal');
    if (personalSummary) {
        personalSummary.innerHTML = `
            <div class="review-item"><strong>Identity:</strong> ${volunteerData.firstName} ${volunteerData.lastName}</div>
            <div class="review-item"><strong>Digital Seal:</strong> ${volunteerData.email}</div>
            <div class="review-item"><strong>Transmission:</strong> ${volunteerData.phone}</div>
            <div class="review-item"><strong>Registry:</strong> ${volunteerData.street}, ${volunteerData.city}, ${volunteerData.state} ${volunteerData.zip}</div>
        `;
    }

    // Interests & Skills Summary
    const interestsSummary = document.getElementById('reviewInterests');
    if (interestsSummary) {
        const areasFormatted = volunteerData.volunteerAreas.map(area => formatVolunteerArea(area)).join(', ') || 'None selected';
        interestsSummary.innerHTML = `
            <div class="review-item"><strong>Spheres:</strong> ${areasFormatted}</div>
            <div class="review-item"><strong>Availability:</strong> ${formatAvailability(volunteerData.availability)}</div>
            <div class="review-item"><strong>Talents:</strong> ${volunteerData.skills || 'Self-taught Master'}</div>
        `;
    }

    // Experience Summary
    const experienceSummary = document.getElementById('reviewExperience');
    if (experienceSummary) {
        experienceSummary.innerHTML = `
            <div class="review-item"><strong>Manifesto:</strong> ${volunteerData.motivation || 'Driven by Purpose'}</div>
            <div class="review-item"><strong>Kinship (Emergency):</strong> ${volunteerData.emergencyName} - ${volunteerData.emergencyPhone}</div>
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

    const termsAgreement = document.getElementById('termsAgreement')?.checked;
    if (!termsAgreement) {
        showStepError(4, 'The Vow of Confidentiality must be accepted.');
        return;
    }

    // Collect final data
    volunteerData.termsAgreement = termsAgreement;
    volunteerData.backgroundCheck = document.getElementById('backgroundCheck')?.checked || false;

    // Show loading state
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `Submitting Manifesto...`;

    try {
        const result = await submitToSupabase();

        if (result.success) {
            showConfirmation(result.referenceNumber);
        } else {
            showStepError(4, result.error || 'The transmission failed. Try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    } catch (error) {
        console.error('Submission error:', error);
        showStepError(4, 'An cosmic interference occurred. Try again later.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

async function submitToSupabase() {
    try {
        const supabase = window.supabaseClient;
        const referenceNumber = generateReferenceNumber();

        if (!supabase) {
            console.warn('Supabase client not available, simulating success');
            return { success: true, referenceNumber: referenceNumber };
        }

        const { data, error } = await supabase
            .from('volunteer_applications')
            .insert([{
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
                volunteer_areas: volunteerData.volunteerAreas,
                skills: volunteerData.skills,
                availability: volunteerData.availability,
                experience: volunteerData.experience,
                motivation: volunteerData.motivation,
                emergency_contact_name: volunteerData.emergencyName,
                emergency_contact_phone: volunteerData.emergencyPhone,
                status: 'pending',
                created_at: new Date().toISOString()
            }]);

        if (error) throw error;
        return { success: true, referenceNumber: referenceNumber };
    } catch (error) {
        console.error('Supabase error:', error);
        return { success: false, error: error.message };
    }
}

function generateReferenceNumber() {
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `RKF-VOW-${timestamp}-${random}`;
}

function showConfirmation(referenceNumber) {
    const refNumberEl = document.getElementById('referenceNumber');
    if (refNumberEl) refNumberEl.textContent = referenceNumber;
    goToStep(5);
}

// ============================================
// FORM VALIDATION UTILITIES
// ============================================

function initializeFormValidation() {
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function () {
            if (this.value && !isValidEmail(this.value)) {
                showFieldError('email', 'Digital seal is invalid');
            } else {
                clearFieldError('email');
            }
        });
    }

    const phoneInputs = ['phone', 'emergencyPhone'];
    phoneInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function () {
                let value = this.value.replace(/\D/g, '');
                if (value.length >= 10) {
                    value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
                }
                this.value = value;
            });
        }
    });

    const dobInput = document.getElementById('dob');
    if (dobInput) {
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() - 18);
        dobInput.max = maxDate.toISOString().split('T')[0];
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================
// ERROR HANDLING
// ============================================

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.add('error');
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) existingError.remove();
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
        if (existingError) existingError.remove();
    }
}

function showStepError(step, message) {
    const errorEl = document.getElementById(`step${step}Error`);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        errorEl.style.padding = '0.75rem';
        errorEl.style.background = 'rgba(239, 68, 68, 0.1)';
        errorEl.style.color = '#ef4444';
        errorEl.style.borderRadius = 'var(--radius-md)';
        errorEl.style.marginTop = '1rem';
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

function formatVolunteerArea(area) {
    const areaMap = {
        'mentorship': 'Mentor Elite',
        'outreach': 'Street Outreach',
        'education': 'Education Architect',
        'technical': 'Technical Aid'
    };
    return areaMap[area] || area;
}

function formatAvailability(availability) {
    const availabilityMap = {
        'weekdays': 'Weekdays',
        'weekends': 'Weekends',
        'evenings': 'Evenings',
        'flexible': 'Flexible / Remote'
    };
    return availabilityMap[availability] || 'Not specified';
}
