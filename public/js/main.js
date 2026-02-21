import { auth } from './supabase.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async function () {
    const user = await auth.getUser();
    if (user) {
        const loginBtn = document.getElementById('loginTrigger');
        if (loginBtn) {
            loginBtn.innerText = 'Dashboard';
            loginBtn.href = '/dashboard.html';
            loginBtn.classList.add('logged-in');

            // Re-bind to prevent the default MemberPortal listener if it exists
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/dashboard.html';
            });
        }
    }

    initNavigation();

    initThemeEngine();
    initScrollEffects();
    initAnimations();
    initParallax();
    initSkeletonLoader();
    initVideoPlayer();
    initGlobalSearch();
    initCommunityMap();
    initVolunteerPortal();
    initStoryCarousel();
    initResourceLibrary();
    initAIAssistant();
    initMemberPortal();
    initActivityStream();
    initImpactCertificates();
    initPWA();
    initForms();
    initCounters();
    initNewsletter();

    // Auto-Session Purge (Feature 7)
    if (user && window.location.pathname.includes('.html') && !window.location.pathname.includes('index.html')) {
        let inactivityTimer;
        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(async () => {
                await auth.signOut();
                alert("Session expired due to inactivity for your security.");
                window.location.href = '/auth.html';
            }, 15 * 60 * 1000); // 15 minutes
        };

        window.onload = resetTimer;
        document.onmousemove = resetTimer;
        document.onkeypress = resetTimer;
        document.onclick = resetTimer;
    }
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
        hamburger.addEventListener('click', function () {
            this.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function () {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function (e) {
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
    window.addEventListener('scroll', function () {
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
        anchor.addEventListener('click', function (e) {
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

    const revealOnScroll = function () {
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
        document.addEventListener('mousemove', function (e) {
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
        button.addEventListener('click', function (e) {
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
// THEME ENGINE
// ============================================

function initThemeEngine() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        // Dynamic notification
        showNotification(`Switched to ${newTheme === 'dark' ? 'Night' : 'Day'} Mode`, 'info');
    });
}

// ============================================
// COUNTER ANIMATION (ENHANCED)
// ============================================

function initCounters() {
    const counters = document.querySelectorAll('.stat-number[data-count]');

    const animateCounter = (counter) => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2500; // Slower, more premium feel
        const startTime = performance.now();

        const updateCounter = (currentTime) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);

            // Ease out quad function
            const easeProgress = 1 - (1 - progress) * (1 - progress);
            const current = Math.floor(easeProgress * target);

            counter.textContent = formatNumber(current) + '+';

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = formatNumber(target) + '+';
            }
        };

        requestAnimationFrame(updateCounter);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                animateCounter(entry.target);
            }
        });
    }, { threshold: 0.2 });

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
        input.addEventListener('focus', function () {
            this.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', function () {
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
            form.addEventListener('submit', function (e) {
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

// Export to global window for non-module scripts and inline events
window.showNotification = showNotification;
window.isValidEmail = isValidEmail;

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
    return function (...args) {
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

// ============================================
// SKELETON LOADING STATES
// ============================================

function initSkeletonLoader() {
    const skeletons = document.querySelectorAll('.skeleton');
    if (skeletons.length === 0) return;

    setTimeout(() => {
        skeletons.forEach(el => {
            el.classList.remove('skeleton');
            const img = el.querySelector('img');
            if (img && img.dataset.src) {
                img.src = img.dataset.src;
            }
        });
    }, 2000);
}

// ============================================
// BRANDED VIDEO PLAYER
// ============================================

function initVideoPlayer() {
    const videoPlaceholder = document.querySelectorAll('.video-premium-container');

    videoPlaceholder.forEach(container => {
        container.addEventListener('click', function () {
            const videoId = this.dataset.video;
            this.innerHTML = `
                <div class="glass-panel" style="padding: 10px; height: 100%; min-height: 400px;">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                        title="Impact Story" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen
                        style="border-radius: var(--radius-lg); min-height: 380px;"
                    ></iframe>
                </div>
            `;
        });
    });
}

// ============================================
// PARALLAX EFFECTS
// ============================================

function initParallax() {
    const parallaxElements = document.querySelectorAll('.parallax-bg');

    window.addEventListener('scroll', throttle(() => {
        const scrollY = window.pageYOffset;

        parallaxElements.forEach(el => {
            const speed = 0.3;
            const yPos = (scrollY * speed);
            el.style.transform = `translateY(${yPos}px)`;
        });
    }, 10));
}

// Make functions globally available
window.showAlert = showAlert;
window.showNotification = showNotification;

// ============================================
// GLOBAL SEARCH SYSTEM
// ============================================

function initGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');
    const searchBtn = document.getElementById('searchBtn');

    if (!searchInput) return;

    const handleSearch = () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length < 2) {
            showNotification('Search term too short', 'warning');
            return;
        }

        showNotification(`Searching for "${query}"...`, 'info');
        const found = document.body.innerText.toLowerCase().includes(query);
        if (found) {
            showNotification('Matches found on this page!', 'success');
        } else {
            showNotification('No matches found here.', 'error');
        }
    };

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
}

// ============================================
// INTERACTIVE COMMUNITY MAP
// ============================================

function initCommunityMap() {
    const mapMarkers = document.querySelectorAll('.map-marker');
    mapMarkers.forEach(marker => {
        marker.addEventListener('click', function () {
            const location = this.dataset.location;
            const stats = this.dataset.stats;
            showNotification(`Our Impact in ${location}: ${stats}`, 'success');
        });
    });
}

// ============================================
// MEMBER PORTAL & LOGIN
// ============================================

function initMemberPortal() {
    const loginBtn = document.getElementById('loginTrigger');
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/auth.html';
        });
    }
}


// ============================================
// VOLUNTEER PROJECT PORTAL
// ============================================

function initVolunteerPortal() {
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        const applyBtn = card.querySelector('.btn-apply');
        if (applyBtn) {
            applyBtn.addEventListener('click', function () {
                const title = card.querySelector('h3').innerText;
                showNotification(`Applied for ${title}! We'll contact you.`, 'success');
                this.disabled = true;
                this.innerText = 'Applied';
            });
        }
    });
}

// ============================================
// SUCCESS STORY CAROUSEL (AUTO-SCROLL)
// ============================================

function initStoryCarousel() {
    const slider = document.querySelector('.success-stories-slider');
    if (!slider) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.classList.add('active');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });
    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.classList.remove('active');
    });
    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.classList.remove('active');
    });
    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2;
        slider.scrollLeft = scrollLeft - walk;
    });

    // Auto-scroll logic
    setInterval(() => {
        if (!isDown) {
            if (slider.scrollLeft + slider.offsetWidth >= slider.scrollWidth) {
                slider.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                slider.scrollBy({ left: 300, behavior: 'smooth' });
            }
        }
    }, 5000);
}

// ============================================
// DYNAMIC RESOURCE LIBRARY
// ============================================

function initResourceLibrary() {
    const filterBtns = document.querySelectorAll('.resource-filter');
    const resources = document.querySelectorAll('.resource-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const filter = this.dataset.filter;
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            resources.forEach(item => {
                if (filter === 'all' || item.dataset.category === filter) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

// ============================================
// LIVE ACTIVITY STREAM
// ============================================

function initActivityStream() {
    const stream = document.querySelector('.activity-stream-content');
    if (!stream) return;

    const activities = [
        "New Donation: Someone just contributed $25 to the Mentorship Program.",
        "Volunteer Sign-up: A new mentor joined the Downtown team.",
        "Project Update: 5 men completed the Job Readiness workshop.",
        "Daily Outreach: 150 meals served in the North District today.",
        "New Resource: A guide on 'Legal Rights' was just added to the library."
    ];

    setInterval(() => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.style.opacity = '0';
        item.style.transform = 'translateY(10px)';
        item.style.transition = 'all 0.5s ease';

        const activity = activities[Math.floor(Math.random() * activities.length)];

        item.innerHTML = `
            <div class="activity-badge"></div>
            <div>
                <p style="margin: 0; font-size: 0.9rem;"><strong>Updates:</strong> ${activity}</p>
                <span style="font-size: 0.75rem; color: rgba(255,255,255,0.4);">Just now</span>
            </div>
        `;

        stream.prepend(item);
        if (stream.children.length > 4) stream.lastElementChild.remove();

        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, 50);
    }, 8000);
}

// ============================================
// IMPACT CERTIFICATE GENERATOR
// ============================================

function initImpactCertificates() {
    const genBtn = document.getElementById('generateCert');
    if (!genBtn) return;

    genBtn.addEventListener('click', () => {
        showNotification('Preparing your royal certificate...', 'info');

        setTimeout(() => {
            const certiDiv = document.createElement('div');
            certiDiv.style.position = 'fixed';
            certiDiv.style.inset = '0';
            certiDiv.style.zIndex = '3000';
            certiDiv.style.background = 'rgba(10, 25, 41, 0.95)';
            certiDiv.style.display = 'flex';
            certiDiv.style.alignItems = 'center';
            certiDiv.style.justifyContent = 'center';
            certiDiv.className = 'certificate-overlay';

            certiDiv.innerHTML = `
                <div class="certificate-preview glass-panel" style="background: white; color: var(--primary-900); padding: 4rem; max-width: 800px; text-align: center; border: 15px solid var(--primary-900); box-shadow: 0 0 50px rgba(0,0,0,0.5);">
                    <div style="border: 2px solid var(--gold-400); padding: 2rem;">
                        <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 2rem; color: var(--primary-900); letter-spacing: 3px;">CERTIFICATE OF IMPACT</div>
                        <p style="color: var(--primary-900);">This recognizes that</p>
                        <h2 style="font-family: 'Playfair Display', serif; color: var(--primary-900); border-bottom: 2px solid var(--gold-400); display: inline-block; padding: 0 40px; margin: 1rem 0;">Valued Donor</h2>
                        <p style="color: var(--primary-900);">has significantly contributed to the mission of restoring dignity and rebuilding lives in 2024.</p>
                        <div style="margin-top: 3rem; display: flex; justify-content: space-between; align-items: flex-end;">
                            <div style="border-top: 1px solid var(--primary-900); padding-top: 10px; width: 150px; font-size: 0.8rem;">Date: ${new Date().toLocaleDateString()}</div>
                            <div style="font-size: 2.5rem; color: var(--gold-500);">♔</div>
                            <div style="border-top: 1px solid var(--primary-900); padding-top: 10px; width: 150px; font-size: 0.8rem;">Executive Director</div>
                        </div>
                    </div>
                    <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center;">
                        <button id="closeCert" class="btn btn-dark btn-sm">Close Preview</button>
                        <button class="btn btn-primary btn-sm">Download PDF</button>
                        <button class="btn btn-secondary btn-sm">Share on LinkedIn</button>
                    </div>
                </div>
            `;

            document.body.appendChild(certiDiv);
            document.getElementById('closeCert').addEventListener('click', () => certiDiv.remove());
            showNotification('Certificate generated successfully!', 'success');
        }, 1500);
    });
}

// ============================================
// PWA SERVICE WORKER REGISTRATION
// ============================================

function initPWA() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('SW Registered'))
                .catch(err => console.log('SW Registration Failed', err));
        });
    }
}

