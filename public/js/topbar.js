/**
 * TOPBAR LOGIC - Phase 9
 * Scroll-reactive effects and navigation management.
 */

document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('header');
    const scrollBar = document.querySelector('.scroll-progress-bar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    // 1. Scroll-Reactive Header & Progress Bar
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;

        // Header & Notice Bar Transformation
        const noticeBar = document.querySelector('.notice-bar');
        if (currentScroll > 50) {
            header.classList.add('scrolled');
            if (noticeBar) noticeBar.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
            if (noticeBar) noticeBar.classList.remove('scrolled');
        }

        // Scroll Progress
        if (scrollBar) {
            const progress = (currentScroll / totalHeight) * 100;
            scrollBar.style.width = `${progress}%`;
        }
    });

    // 2. Active Link Highlighting (Intersection Observer)
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-links a');

    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === `/#${id}` || item.getAttribute('href') === `#${id}`) {
                        item.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));

    // 3. Mobile Menu Handling (Already in main.js but adding premium sync here)
    if (hamburger && navLinks) {
        // Redundant with main.js but ensures Phase 9 specific logic transitions
        const toggleMenu = () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        };

        // We handle this here to optionally block/override main.js if needed
        // hamburger.onclick = toggleMenu; 
    }
});
