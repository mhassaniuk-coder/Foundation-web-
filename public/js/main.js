// ============================================
// RESTORED KINGS FOUNDATION WEBSITE
// Main JavaScript File - Global Functionality
// ============================================

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            // Animate hamburger
            const spans = this.querySelectorAll('span');
            spans.forEach(span => {
                span.style.transition = 'all 0.3s ease';
            });
            if (navLinks.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(8px, 8px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -7px)';
            } else {
                spans.forEach(span => span.style.transform = 'none');
                spans[1].style.opacity = '1';
            }
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', function() {
                if (!this.classList.contains('btn')) {
                    navLinks.classList.remove('active');
                    const spans = hamburger.querySelectorAll('span');
                    spans.forEach(span => span.style.transform = 'none');
                    spans[1].style.opacity = '1';
                }
            });
        });
    }

    // Set active navigation link
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === currentPath || (currentPath === '/' && link.getAttribute('href') === '/')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// Newsletter Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleNewsletterSubmit();
        });
    }

    const blogNewsletterForm = document.getElementById('blogNewsletterForm');
    if (blogNewsletterForm) {
        blogNewsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleBlogNewsletterSubmit();
        });
    }
});

function handleNewsletterSubmit() {
    const form = document.getElementById('newsletterForm');
    const email = form.querySelector('input[type="email"]').value;
    const alertDiv = document.getElementById('newsletterAlert');

    // Simulate API call
    alertDiv.style.display = 'none';

    // Simple email validation
    if (!email || !email.includes('@')) {
        showAlert(alertDiv, 'Please enter a valid email address', 'error');
        return;
    }

    // Simulate submission
    setTimeout(() => {
        showAlert(alertDiv, '✓ Thank you for subscribing! Check your email for confirmation.', 'success');
        form.reset();
    }, 500);
}

function handleBlogNewsletterSubmit() {
    const form = document.getElementById('blogNewsletterForm');
    const email = form.querySelector('input[type="email"]').value;
    const alertDiv = document.getElementById('blogNewsletterAlert');

    if (!email || !email.includes('@')) {
        showAlert(alertDiv, 'Please enter a valid email address', 'error');
        return;
    }

    setTimeout(() => {
        showAlert(alertDiv, '✓ Thank you for subscribing! You\'ll get our latest updates.', 'success');
        form.reset();
    }, 500);
}

function showAlert(element, message, type) {
    element.textContent = message;
    element.className = `alert alert-${type} show`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}

// Volunteer Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const volunteerForm = document.getElementById('volunteerForm');
    const contactForm = document.getElementById('contactForm');

    if (volunteerForm) {
        volunteerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleVolunteerSubmit();
        });
    }

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleContactSubmit();
        });
    }
});

function handleVolunteerSubmit() {
    const form = document.getElementById('volunteerForm');
    const formData = new FormData(form);

    // Validate required fields
    if (!formData.get('firstName') || !formData.get('email') || !formData.get('phone')) {
        alert('Please fill in all required fields');
        return;
    }

    // Check if at least one interest is selected
    const interests = form.querySelectorAll('input[name="interests"]:checked');
    if (interests.length === 0) {
        alert('Please select at least one volunteer interest');
        return;
    }

    // Simulate API submission
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    setTimeout(() => {
        document.getElementById('volunteerSuccess').style.display = 'block';
        form.style.display = 'none';
        window.scrollTo(0, document.getElementById('volunteerSuccess').offsetTop - 100);
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 1000);
}

function handleContactSubmit() {
    const form = document.getElementById('contactForm');
    const formData = new FormData(form);

    // Validate required fields
    if (!formData.get('firstName') || !formData.get('email') || !formData.get('subject') || !formData.get('message')) {
        alert('Please fill in all required fields');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    // Simulate API submission
    setTimeout(() => {
        document.getElementById('contactSuccess').style.display = 'block';
        form.reset();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        // Auto-hide success message
        setTimeout(() => {
            document.getElementById('contactSuccess').style.display = 'none';
        }, 5000);
    }, 1000);
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            const target = document.querySelector(href);
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Google Analytics (placeholder)
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
// Replace with your Google Analytics ID
// gtag('config', 'GA_MEASUREMENT_ID');

// Lazy loading images (basic implementation)
if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.getAttribute('data-src');
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    lazyImages.forEach(img => imageObserver.observe(img));
}

// Simple form validation helper
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\d\s\-\+\(\)]+$/;
    return re.test(phone);
}

// Add more interactivity - button amount selection on donate page
document.addEventListener('DOMContentLoaded', function() {
    const amountButtons = document.querySelectorAll('.btn-amount');
    const customAmountGroup = document.getElementById('customAmountGroup');
    
    if (amountButtons.length > 0) {
        amountButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active state from all buttons
                amountButtons.forEach(btn => {
                    btn.style.borderColor = '#ddd';
                    btn.style.backgroundColor = 'white';
                    btn.style.color = 'var(--text-dark)';
                });
                
                // Add active state to clicked button
                this.style.borderColor = 'var(--primary-color)';
                this.style.backgroundColor = 'var(--light-bg)';
                this.style.color = 'var(--primary-color)';
                
                // Show/hide custom amount field
                if (this.getAttribute('data-amount') === 'other') {
                    if (customAmountGroup) {
                        customAmountGroup.style.display = 'block';
                    }
                } else {
                    if (customAmountGroup) {
                        customAmountGroup.style.display = 'none';
                    }
                }
            });
        });
    }
    
    // Handle recurring donation radio buttons
    const donationTypeRadios = document.querySelectorAll('input[name="donationType"]');
    const recurringInfo = document.getElementById('recurringInfo');
    
    if (donationTypeRadios.length > 0 && recurringInfo) {
        donationTypeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'recurring') {
                    recurringInfo.style.display = 'block';
                } else {
                    recurringInfo.style.display = 'none';
                }
            });
        });
    }
});

// Performance monitoring
if (window.performance && window.performance.timing) {
    window.addEventListener('load', function() {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log('Page load time: ' + pageLoadTime + 'ms');
    });
}

// Accessibility: Add keyboard navigation support
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const navLinks = document.getElementById('navLinks');
        if (navLinks && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
        }
    }
});

console.log('Restored Kings Foundation Website - JS Loaded');
