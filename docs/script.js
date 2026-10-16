/**
 * AstraIDE Official Project Website
 * Pure Vanilla JavaScript — Zero External Dependencies
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Sticky Navbar shadow on scroll
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });

  // 2. Mobile navigation toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelectorAll('.navbar-link');

  if (mobileToggle && navbar) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navbar.classList.toggle('mobile-open');
      mobileToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close mobile nav when clicking a link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navbar.classList.remove('mobile-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target) && navbar.classList.contains('mobile-open')) {
        navbar.classList.remove('mobile-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // 3. Active navlink spy on scroll
  const sections = document.querySelectorAll('section[id]');
  if ('IntersectionObserver' in window && sections.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${id}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach(sec => observer.observe(sec));
  }

  // 4. Product showcase screenshot switcher
  const showcaseTabs = document.querySelectorAll('.showcase-tab');
  const showcaseImg = document.getElementById('showcase-img');
  const showcaseCaption = document.getElementById('showcase-caption');

  const screenshots = {
    dark: {
      src: './assets/screenshots/astraide-dark.png',
      alt: 'AstraIDE Welcome Workspace in Dark Mode with Android SDK and JDK diagnostics',
      caption: 'AstraIDE Welcome Dashboard with automatic JDK and Android SDK environment validation.'
    },
    light: {
      src: './assets/screenshots/astraide-light.png',
      alt: 'AstraIDE Workspace in Light Mode with Project Overview and System Resources',
      caption: 'Clean daylight theme showcasing memory footprint and physical device detection.'
    },
    settings: {
      src: './assets/screenshots/astraide-settings.png',
      alt: 'AstraIDE Preferences and Environment Configuration Modal',
      caption: 'Customizable Android SDK paths, ADB daemon controls, and offline-first developer settings.'
    }
  };

  showcaseTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.getAttribute('data-mode');
      if (!mode || !screenshots[mode]) return;

      showcaseTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      if (showcaseImg) {
        showcaseImg.src = screenshots[mode].src;
        showcaseImg.alt = screenshots[mode].alt;
      }
      if (showcaseCaption) {
        showcaseCaption.textContent = screenshots[mode].caption;
      }
    });
  });

  // 5. Screenshot Lightbox Zoom
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');

  if (showcaseImg && lightbox && lightboxImg) {
    showcaseImg.addEventListener('click', () => {
      lightboxImg.src = showcaseImg.src;
      lightboxImg.alt = showcaseImg.alt;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    const closeLightbox = () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    };

    lightbox.addEventListener('click', closeLightbox);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        closeLightbox();
      }
    });
  }

  // 6. Copy to clipboard for code snippets
  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetText = btn.getAttribute('data-copy');
      if (!targetText) return;

      try {
        await navigator.clipboard.writeText(targetText);
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;color:#10b981;">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span style="color:#10b981;">Copied!</span>
        `;
        btn.disabled = true;

        setTimeout(() => {
          btn.innerHTML = originalHtml;
          btn.disabled = false;
        }, 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    });
  });

  // 7. FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close all other open items
        faqItems.forEach(other => {
          if (other !== item) {
            other.classList.remove('open');
            const otherBtn = other.querySelector('.faq-question');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle current
        item.classList.toggle('open', !isOpen);
        question.setAttribute('aria-expanded', String(!isOpen));
      });
    }
  });
});
