// ============================================
// RESTORED KINGS FOUNDATION WEBSITE
// Main JavaScript File - Modern & Interactive
// ============================================

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initScrollEffects();
    initAnimations();
    initForms();
    initCounters();
    initNewsletter();
});

// ============================================
// NAVIGATION
// ============================================

function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const header = document.getElementById('header');

    // Mobile menu toggle
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            this.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Set active navigation link
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath === '/' && href === '/') || 
            (currentPath === '/index.html' && href === '/')) {
            link.classList.add('active');
        } else if (!href.startsWith('/donate') && !href.startsWith('/volunteer')) {
            link.classList.remove('active');
        }
    });
}

// ============================================
// SCROLL EFFECTS
// ============================================

function initScrollEffects() {
    const header = document.getElementById('header');
    let lastScroll = 0;

    // Header scroll effect
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;

        // Add/remove scrolled class
        if (header) {
            if (currentScroll > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }

        lastScroll = currentScroll;
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerHeight = header ? header.offsetHeight : 0;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Scroll reveal animation
    const revealElements = document.querySelectorAll('.card, .stat-item, .testimonial-card, .section-header');
    
    const revealOnScroll = function() {
        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight - 100) {
                element.classList.add('revealed');
            }
        });
    };

    // Add CSS for reveal animation
    const style = document.createElement('style');
    style.textContent = `
        .card, .stat-item, .testimonial-card, .section-header {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .card.revealed, .stat-item.revealed, .testimonial-card.revealed, .section-header.revealed {
            opacity: 1;
            transform: translateY(0);
        }
        .card:nth-child(2), .stat-item:nth-child(2) { transition-delay: 0.1s; }
        .card:nth-child(3), .stat-item:nth-child(3) { transition-delay: 0.2s; }
        .card:nth-child(4), .stat-item:nth-child(4) { transition-delay: 0.3s; }
    `;
    document.head.appendChild(style);

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Initial check
}

// ============================================
// ANIMATIONS
// ============================================

function initAnimations() {
    // Add fade-in animation to hero content
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.opacity = '1';
    }

    // Parallax effect for hero particles
    const particles = document.querySelectorAll('.hero-particle');
    if (particles.length > 0) {
        document.addEventListener('mousemove', function(e) {
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = e.clientY / window.innerHeight;
            
            particles.forEach((particle, index) => {
                const speed = (index + 1) * 0.5;
                const x = (mouseX - 0.5) * speed * 20;
                const y = (mouseY - 0.5) * speed * 20;
                particle.style.transform = `translate(${x}px, ${y}px)`;
            });
        });
    }

    // Button ripple effect
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Add ripple animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// COUNTER ANIMATION
// ============================================

function initCounters() {
    const counters = document.querySelectorAll('.stat-number[data-count]');
    
    const animateCounter = (counter) => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = formatNumber(Math.floor(current)) + '+';
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = formatNumber(target) + '+';
            }
        };
        
        updateCounter();
    };

    // Intersection Observer for counters
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                animateCounter(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ============================================
// FORMS
// ============================================

function initForms() {
    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }

    // Volunteer form
    const volunteerForm = document.getElementById('volunteerForm');
    if (volunteerForm) {
        volunteerForm.addEventListener('submit', handleVolunteerForm);
    }

    // Add floating label effect
    document.querySelectorAll('.form-input, .form-textarea, .form-select').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
    });
}

function handleContactForm(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    // Simulate form submission
    setTimeout(() => {
        showNotification('Thank you for your message! We will get back to you soon.', 'success');
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }, 1500);
}

function handleVolunteerForm(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    setTimeout(() => {
        showNotification('Thank you for your interest in volunteering! We will contact you shortly.', 'success');
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }, 1500);
}

// ============================================
// NEWSLETTER
// ============================================

function initNewsletter() {
    const newsletterForms = document.querySelectorAll('.newsletter-form, #newsletterForm, #blogNewsletterForm');
    
    newsletterForms.forEach(form => {
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                const emailInput = this.querySelector('input[type="email"]');
                const email = emailInput.value;
                
                if (!email || !isValidEmail(email)) {
                    showNotification('Please enter a valid email address.', 'error');
                    return;
                }
                
                // Simulate subscription
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Subscribing...';
                
                setTimeout(() => {
                    showNotification('Thank you for subscribing! Check your email for confirmation.', 'success');
                    this.reset();
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }, 1000);
            });
        }
    });
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================
// NOTIFICATIONS
// ============================================

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
            <span class="notification-message">${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add notification styles
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 100px;
            right: 20px;
            max-width: 400px;
            padding: 1rem 1.5rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            z-index: 9999;
            animation: slideIn 0.3s ease;
        }
        .notification-success { border-left: 4px solid #10b981; }
        .notification-error { border-left: 4px solid #ef4444; }
        .notification-info { border-left: 4px solid #3b82f6; }
        .notification-content {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .notification-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.875rem;
            font-weight: 600;
        }
        .notification-success .notification-icon { background: #d1fae5; color: #10b981; }
        .notification-error .notification-icon { background: #fee2e2; color: #ef4444; }
        .notification-info .notification-icon { background: #dbeafe; color: #3b82f6; }
        .notification-message { color: #1e293b; font-size: 0.9375rem; }
        .notification-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: #94a3b8;
            cursor: pointer;
            padding: 0;
            line-height: 1;
        }
        .notification-close:hover { color: #64748b; }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================
// LEGACY SUPPORT
// ============================================

// Keep for backwards compatibility with existing HTML
function showAlert(element, message, type) {
    if (element) {
        element.textContent = message;
        element.className = `alert alert-${type}`;
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    } else {
        showNotification(message, type === 'error' ? 'error' : 'success');
    }
}

// Make functions globally available
window.showAlert = showAlert;
window.showNotification = showNotification;
