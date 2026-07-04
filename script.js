/* ============================================
   UI Script — Renovation Landing Page
   Lightweight vanilla JS for UI interactions only.
   No backend, no form submission, no analytics.
   ============================================ */

(function () {
  'use strict';

  /* ---- DOM References ---- */
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const modalOverlay = document.getElementById('lead-modal');
  const modalForm = document.getElementById('lead-form');
  const modalFormContainer = document.getElementById('modal-form-container');
  const modalSuccess = document.getElementById('modal-success');
  const modalCloseBtn = document.getElementById('modal-close');
  const faqItems = document.querySelectorAll('.faq-item');

  /* Collect all elements that open the modal */
  const modalOpenBtns = document.querySelectorAll('[data-open-modal]');

  /* ---- Telegram lead config ---- */
  const TG_WORKER_URL = 'https://tg-proxy.arturhriankapl.workers.dev';
  const LEAD_SERVICE = 'Remonty i wykończenia mieszkań Warszawa';

  /* Tracks which CTA opened the modal (set on open, sent on submit) */
  var leadSource = 'unknown';

  /* Single source-of-truth for "звідки" — used by form, contact clicks
     and "Poproś o wycenę" clicks. Based on the surrounding container. */
  function resolveSource(el) {
    if (!el || !el.closest) return 'unknown';
    if (el.closest('.mobile-menu')) return 'mobile';
    if (el.closest('.mobile-sticky-cta')) return 'sticky';
    if (el.closest('.header')) return 'header';
    if (el.closest('.hero')) return 'hero';
    if (el.closest('.final-cta')) return 'final';
    if (el.closest('footer')) return 'footer';
    return 'page';
  }

  /* Fire-and-forget click event → Telegram. Used for phone / WhatsApp /
     "Poproś o wycenę" clicks. Never blocks or breaks the click. */
  function notifyClick(action, el) {
    try {
      fetch(TG_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          type: 'click',
          action: action,
          source: resolveSource(el),
          timestamp: getLocalTimestamp()
        })
      }).catch(function () { /* ignore — never break the click */ });
    } catch (e) { /* ignore */ }
  }


  /* ============================================
     MOBILE MENU
     ============================================ */
  function openMobileMenu() {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.classList.add('is-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('modal-open');
  }

  function closeMobileMenu() {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('modal-open');
  }

  function toggleMobileMenu() {
    if (!mobileMenu) return;
    if (mobileMenu.classList.contains('is-open')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', toggleMobileMenu);
  }

  /* Close mobile menu when a link is clicked */
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMobileMenu);
    });
  }


  /* ============================================
     MODAL — OPEN / CLOSE
     ============================================ */
  function openModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.add('is-open');
    document.body.classList.add('modal-open');
    /* Reset to form state each time */
    resetModalState();
    /* Focus the close button for accessibility */
    if (modalCloseBtn) {
      modalCloseBtn.focus();
    }
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('is-open');
    document.body.classList.remove('modal-open');
  }

  function resetModalState() {
    if (modalFormContainer) {
      modalFormContainer.classList.remove('is-hidden');
    }
    if (modalSuccess) {
      modalSuccess.classList.remove('is-visible');
    }
    if (modalForm) {
      modalForm.reset();
    }
  }

  /* Open modal buttons */
  modalOpenBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      leadSource = resolveSource(btn);
      /* Track the "Poproś o wycenę" click itself, even without a submit */
      notifyClick('wycena', btn);
      openModal();
    });
  });

  /* Close button */
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }

  /* Close by clicking overlay */
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
  }

  /* Close by Escape key */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (modalOverlay && modalOverlay.classList.contains('is-open')) {
        closeModal();
      }
      if (mobileMenu && mobileMenu.classList.contains('is-open')) {
        closeMobileMenu();
      }
    }
  });


  /* ============================================
     PHONE INPUT — allow only digits, +, spaces
     ============================================ */
  var phoneInput = document.getElementById('lead-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      /* Strip anything that is not a digit, plus sign, or space */
      this.value = this.value.replace(/[^\d+\s]/g, '');
    });
  }


  /* ============================================
     MODAL — FORM SUBMISSION → Telegram (via Worker)
     ============================================ */
  const nameInput = document.getElementById('lead-name');
  const submitBtn = document.getElementById('modal-submit-btn');

  /* Local timestamp e.g. "2026-06-30 19:40" */
  function getLocalTimestamp() {
    var now = new Date();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
      ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
  }

  /* Inline status message (created lazily, reused) */
  function showFormError(message) {
    if (!modalForm) return;
    var el = document.getElementById('lead-form-error');
    if (!el) {
      el = document.createElement('p');
      el.id = 'lead-form-error';
      el.className = 'form-error-message';
      el.setAttribute('role', 'alert');
      el.style.color = '#c0392b';
      el.style.marginTop = '0.75rem';
      el.style.fontSize = '0.9rem';
      modalForm.querySelector('.modal-actions').appendChild(el);
    }
    el.textContent = message;
  }

  function clearFormError() {
    var el = document.getElementById('lead-form-error');
    if (el) el.textContent = '';
  }

  async function sendLeadToTelegram(payload) {
    const response = await fetch(TG_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(function () { return {}; });
    if (!response.ok || !result.ok) {
      throw new Error((result && result.error) || 'Telegram sending failed');
    }
    return result;
  }

  if (modalForm) {
    modalForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      clearFormError();

      /* Check HTML5 validity (phone is required + pattern) before sending */
      if (!modalForm.checkValidity()) {
        modalForm.reportValidity();
        return;
      }

      var name = nameInput ? nameInput.value.trim() : '';
      var phone = phoneInput ? phoneInput.value.trim() : '';

      if (!phone) {
        modalForm.reportValidity();
        return;
      }

      /* Block the submit button to avoid duplicate leads */
      var originalLabel = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Wysyłanie...';
      }

      try {
        await sendLeadToTelegram({
          name: name || 'Nie podano',
          phone: phone,
          page: window.location.href,
          source: leadSource,
          service: LEAD_SERVICE,
          timestamp: getLocalTimestamp()
        });

        /* Success → show existing success state and clear the form */
        if (modalForm) modalForm.reset();
        if (modalFormContainer) {
          modalFormContainer.classList.add('is-hidden');
        }
        if (modalSuccess) {
          modalSuccess.classList.add('is-visible');
        }
      } catch (err) {
        showFormError('Nie udało się wysłać zgłoszenia. Zadzwoń lub napisz na WhatsApp.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel || 'Wyślij zgłoszenie';
        }
      }
    });
  }


  /* ============================================
     CONTACT CLICKS → Telegram (phone / WhatsApp)
     Fire-and-forget notification when a visitor taps a
     "tel:" or WhatsApp link. Uses keepalive so the request
     survives page navigation. Never blocks the click.
     ============================================ */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="tel:"], a[href*="wa.me"], a[href*="api.whatsapp.com"], a[href*="t.me"]');
    if (!link) return;
    var href = link.getAttribute('href') || '';
    var action;
    if (href.indexOf('tel:') === 0) action = 'phone';
    else if (href.indexOf('t.me') !== -1) action = 'telegram';
    else action = 'whatsapp';
    notifyClick(action, link);
  });


  /* ============================================
     FAQ ACCORDION
     ============================================ */
  faqItems.forEach(function (item) {
    var question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');
      var answer = item.querySelector('.faq-answer');

      /* Close all other FAQ items */
      faqItems.forEach(function (otherItem) {
        if (otherItem !== item && otherItem.classList.contains('is-open')) {
          otherItem.classList.remove('is-open');
          var otherAnswer = otherItem.querySelector('.faq-answer');
          if (otherAnswer) {
            otherAnswer.style.maxHeight = '0';
          }
          otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        }
      });

      /* Toggle current */
      if (isOpen) {
        item.classList.remove('is-open');
        if (answer) answer.style.maxHeight = '0';
        question.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('is-open');
        if (answer) answer.style.maxHeight = answer.scrollHeight + 'px';
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });


  /* ============================================
     COOKIE CONSENT BANNER
     Saves user choice in localStorage.
     Updates Google Consent Mode v2 on accept.
     ============================================ */
  var cookieBanner = document.getElementById('cookie-banner');
  var cookieAcceptBtn = document.getElementById('cookie-accept-all');
  var cookieRejectBtn = document.getElementById('cookie-reject');
  var cookieCustomizeBtn = document.getElementById('cookie-customize');
  var cookieCustomizePanel = document.getElementById('cookie-customize-panel');
  var cookieSavePrefsBtn = document.getElementById('cookie-save-prefs');
  var cookieAnalyticsChk = document.getElementById('cookie-analytics');
  var cookieMarketingChk = document.getElementById('cookie-marketing');

  var COOKIE_CONSENT_KEY = 'cookie_consent';

  /** Read saved consent from localStorage */
  function getSavedConsent() {
    try {
      var raw = localStorage.getItem(COOKIE_CONSENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  /** Save consent to localStorage */
  function saveConsent(consent) {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    } catch (e) { /* ignore */ }
  }

  /** Update Google Consent Mode v2 */
  function updateGoogleConsent(analytics, marketing) {
    if (typeof gtag !== 'function') return;
    gtag('consent', 'update', {
      ad_storage: marketing ? 'granted' : 'denied',
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_user_data: marketing ? 'granted' : 'denied',
      ad_personalization: marketing ? 'granted' : 'denied'
    });
  }

  /** Hide the cookie banner */
  function hideBanner() {
    if (cookieBanner) {
      cookieBanner.classList.remove('is-visible');
    }
  }

  /** Show the cookie banner */
  function showBanner() {
    if (cookieBanner) {
      cookieBanner.classList.add('is-visible');
    }
  }

  /** Apply consent (update Google + save + hide) */
  function applyConsent(analytics, marketing) {
    saveConsent({ analytics: analytics, marketing: marketing, timestamp: new Date().toISOString() });
    updateGoogleConsent(analytics, marketing);
    hideBanner();
  }

  /* On page load: check if consent was already given */
  var existingConsent = getSavedConsent();
  if (existingConsent) {
    /* Re-apply consent silently (no banner) */
    updateGoogleConsent(existingConsent.analytics, existingConsent.marketing);
  } else {
    /* No consent yet → show banner */
    showBanner();
  }

  /* Accept all */
  if (cookieAcceptBtn) {
    cookieAcceptBtn.addEventListener('click', function () {
      applyConsent(true, true);
    });
  }

  /* Reject (deny analytics + marketing) */
  if (cookieRejectBtn) {
    cookieRejectBtn.addEventListener('click', function () {
      applyConsent(false, false);
    });
  }

  /* Customize toggle */
  if (cookieCustomizeBtn && cookieCustomizePanel) {
    cookieCustomizeBtn.addEventListener('click', function () {
      var isHidden = cookieCustomizePanel.hasAttribute('hidden');
      if (isHidden) {
        cookieCustomizePanel.removeAttribute('hidden');
        cookieCustomizeBtn.textContent = 'Ukryj';
      } else {
        cookieCustomizePanel.setAttribute('hidden', '');
        cookieCustomizeBtn.textContent = 'Dostosuj';
      }
    });
  }

  /* Save custom preferences */
  if (cookieSavePrefsBtn) {
    cookieSavePrefsBtn.addEventListener('click', function () {
      var analytics = cookieAnalyticsChk ? cookieAnalyticsChk.checked : false;
      var marketing = cookieMarketingChk ? cookieMarketingChk.checked : false;
      applyConsent(analytics, marketing);
    });
  }

})();
