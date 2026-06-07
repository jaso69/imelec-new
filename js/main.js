/* ========================================
   IMELEC - Scripts Comunes
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu elements
    const menuToggle = document.getElementById('menu-toggle');
    const menuClose = document.getElementById('menu-close');
    const mobileMenu = document.getElementById('mobile-menu');
    const body = document.body;
    
    if (!menuToggle || !mobileMenu) return;

    // Open menu
    menuToggle.addEventListener('click', function() {
        mobileMenu.style.display = 'block';
        menuToggle.setAttribute('aria-expanded', 'true');
        setTimeout(() => {
            mobileMenu.classList.add('active');
            body.classList.add('body-no-scroll');
            const menuCloseBtn = document.getElementById('menu-close');
            if (menuCloseBtn) menuCloseBtn.focus();
        }, 10);
    });
    
    // Close menu function
    function closeMenu() {
        mobileMenu.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        setTimeout(() => {
            mobileMenu.style.display = 'none';
            body.classList.remove('body-no-scroll');
            menuToggle.focus();
        }, 300);
    }
    
    if (menuClose) {
        menuClose.addEventListener('click', closeMenu);
    }
    
    // Close menu on link click
    const menuLinks = mobileMenu.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
    
    // Close menu on backdrop click
    mobileMenu.addEventListener('click', function(e) {
        if (e.target === mobileMenu) {
            closeMenu();
        }
    });
    
    // Close menu with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            closeMenu();
        }
    });
    
    // Update current year in footer
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Cookie consent banner
    (function() {
        const COOKIE_CONSENT_KEY = 'imelec_cookie_consent';
        if (localStorage.getItem(COOKIE_CONSENT_KEY)) return;

        const banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'Información de cookies');
        banner.innerHTML = `
            <div class="cookie-content">
                <p>Utilizamos cookies técnicas necesarias para el funcionamiento de la web. Puede consultar nuestra <a href="/privacidad.html" style="color:#FFD700;text-decoration:underline;">política de privacidad</a>.</p>
                <button id="cookie-accept" class="cookie-btn" aria-label="Aceptar cookies">Aceptar</button>
            </div>
        `;
        document.body.appendChild(banner);

        document.getElementById('cookie-accept').addEventListener('click', function() {
            localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
            banner.remove();
        });
    })();

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('Service Worker registered:', registration.scope);
            })
            .catch((error) => {
                console.warn('Service Worker registration failed:', error);
            });
    }

    // Scroll Reveal: auto-add .revealed when elements enter viewport
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.reveal').forEach((el) => {
        revealObserver.observe(el);
    });
});
