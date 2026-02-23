(function () {
    'use strict';

    var STORAGE_KEY = 'theme';
    var LIGHT_THEME = 'light';
    var DARK_THEME = 'dark';
    var root = document.documentElement;

    function safeStorageGet(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (error) {
            return null;
        }
    }

    function safeStorageSet(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch (error) {
            // Ignore persistence errors (private mode, blocked storage, etc.)
        }
    }

    function safeStorageRemove(key) {
        try {
            window.localStorage.removeItem(key);
        } catch (error) {
            // Ignore persistence errors
        }
    }

    function normalizeTheme(theme) {
        return theme === DARK_THEME ? DARK_THEME : LIGHT_THEME;
    }

    function getStoredTheme() {
        var stored = safeStorageGet(STORAGE_KEY);
        if (stored === LIGHT_THEME || stored === DARK_THEME) {
            return stored;
        }
        return null;
    }

    function getSystemTheme() {
        var mediaQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
        return mediaQuery && mediaQuery.matches ? DARK_THEME : LIGHT_THEME;
    }

    function getCurrentTheme() {
        var attr = root.getAttribute('data-theme');
        if (attr === LIGHT_THEME || attr === DARK_THEME) {
            return attr;
        }
        return normalizeTheme(getStoredTheme() || getSystemTheme());
    }

    function updateMetaThemeColor(theme) {
        var meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
            return;
        }

        if (theme === DARK_THEME) {
            meta.setAttribute('content', '#0b1220');
        } else {
            meta.setAttribute('content', '#d4a574');
        }
    }

    function syncToggleButtons(theme) {
        var toggles = document.querySelectorAll('[data-theme-toggle], #themeToggle');
        toggles.forEach(function (toggle) {
            toggle.setAttribute('aria-pressed', String(theme === DARK_THEME));
            toggle.setAttribute('aria-label', theme === DARK_THEME ? 'Switch to light mode' : 'Switch to dark mode');
            toggle.setAttribute('title', theme === DARK_THEME ? 'Switch to Light Mode' : 'Switch to Dark Mode');
        });
    }

    function applyTheme(theme, options) {
        var opts = options || {};
        var nextTheme = normalizeTheme(theme);
        root.setAttribute('data-theme', nextTheme);
        root.style.colorScheme = nextTheme;

        if (opts.persist) {
            safeStorageSet(STORAGE_KEY, nextTheme);
        }

        syncToggleButtons(nextTheme);
        updateMetaThemeColor(nextTheme);
        return nextTheme;
    }

    function toggleTheme() {
        var current = getCurrentTheme();
        var next = current === DARK_THEME ? LIGHT_THEME : DARK_THEME;
        return applyTheme(next, { persist: true });
    }

    function buildToggleButton() {
        var button = document.createElement('button');
        button.type = 'button';
        button.id = 'themeToggle';
        button.className = 'btn-theme';
        button.setAttribute('data-theme-toggle', 'true');
        button.innerHTML = '<span class="sun" aria-hidden="true">&#9728;</span><span class="moon" aria-hidden="true">&#9790;</span>';
        return button;
    }

    function ensureInlineToggle() {
        if (document.querySelector('[data-theme-toggle], #themeToggle')) {
            return;
        }

        var navControls = document.querySelector('.nav-controls');
        if (navControls) {
            navControls.insertBefore(buildToggleButton(), navControls.firstChild);
            return;
        }

        var navbar = document.querySelector('.navbar');
        if (navbar) {
            var wrapper = document.createElement('div');
            wrapper.className = 'nav-controls';
            wrapper.appendChild(buildToggleButton());

            var hamburger = navbar.querySelector('.hamburger');
            if (hamburger && hamburger.parentElement === navbar) {
                navbar.insertBefore(wrapper, hamburger);
                wrapper.appendChild(hamburger);
            } else {
                navbar.appendChild(wrapper);
            }
            return;
        }

        var floating = buildToggleButton();
        floating.classList.add('theme-fab');
        document.body.appendChild(floating);
    }

    function bindToggle(toggle) {
        if (!toggle || toggle.dataset.themeBound === 'true') {
            return;
        }

        toggle.dataset.themeBound = 'true';
        toggle.setAttribute('data-theme-toggle', 'true');
        toggle.addEventListener('click', function () {
            toggleTheme();
        });
    }

    function init() {
        ensureInlineToggle();
        document.querySelectorAll('[data-theme-toggle], #themeToggle').forEach(bindToggle);
        syncToggleButtons(getCurrentTheme());
    }

    function clearPreference() {
        safeStorageRemove(STORAGE_KEY);
        applyTheme(getSystemTheme(), { persist: false });
    }

    // Apply as early as possible to reduce flash between pages.
    applyTheme(getStoredTheme() || getSystemTheme(), { persist: false });

    if (window.matchMedia) {
        var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        var handleSystemChange = function (event) {
            if (getStoredTheme()) {
                return;
            }
            applyTheme(event.matches ? DARK_THEME : LIGHT_THEME, { persist: false });
        };

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', handleSystemChange);
        } else if (typeof mediaQuery.addListener === 'function') {
            mediaQuery.addListener(handleSystemChange);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.ThemeEngine = {
        init: init,
        applyTheme: function (theme) {
            return applyTheme(theme, { persist: true });
        },
        toggle: toggleTheme,
        getTheme: getCurrentTheme,
        clearPreference: clearPreference
    };
})();
