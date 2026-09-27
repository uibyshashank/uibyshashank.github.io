/**
 * interactions.js — Email assembly, nav scroll state, and modal dialogs.
 * Exposes `window.PortfolioInteractions.init()`.
 */
(function (window) {
  'use strict';

  /* ---------- Email (assembled at runtime to keep the address out of the raw HTML) ---------- */
  function initEmail() {
    var el = document.getElementById('c-email');
    if (!el) return;
    var u = 'shashankradharapu39';
    var d = 'gmail.com';
    el.href = 'mailto:' + u + '@' + d;
    el.textContent = u + '@' + d;
  }

  /* ---------- Nav scroll state ---------- */
  function initNav() {
    var nav = document.getElementById('nav');
    if (!nav) return;
    function update() {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------- Remote thumbnail fallback (replaces inline onerror) ---------- */
  function initImageFallbacks() {
    document.querySelectorAll('img[data-fallback]').forEach(function (img) {
      img.addEventListener('error', function () {
        var fallback = img.getAttribute('data-fallback');
        if (fallback) img.src = fallback;
      });
    });
  }

  /* ---------- Modal dialogs ---------- */
  function openModal(id, trigger) {
    var el = document.getElementById('m-' + id);
    if (!el) return;
    // Defer heavy preview images until the dialog is first opened.
    el.querySelectorAll('img[data-src]').forEach(function (img) {
      if (!img.getAttribute('src')) img.setAttribute('src', img.getAttribute('data-src'));
    });
    el._lastFocused = trigger || document.activeElement;
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
    var closeBtn = el.querySelector('.modal-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal(id) {
    var el = document.getElementById('m-' + id);
    if (!el) return;
    el.classList.remove('open');
    document.body.style.overflow = '';
    var last = el._lastFocused;
    if (last && last.focus) last.focus();
  }

  function closeAllModals() {
    var open = document.querySelectorAll('.modal-backdrop.open');
    open.forEach(closeBackdrop);
    if (open.length) document.body.style.overflow = '';
  }

  function closeBackdrop(backdrop) {
    closeModal(backdrop.id.replace('m-', ''));
  }

  function initModals() {
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-modal]');
      if (trigger) {
        e.preventDefault();
        openModal(trigger.getAttribute('data-modal'), trigger);
        return;
      }
      var closer = e.target.closest('[data-close]');
      if (closer) {
        var backdrop = closer.closest('.modal-backdrop');
        if (backdrop) closeBackdrop(backdrop);
        return;
      }
      if (e.target.classList && e.target.classList.contains('modal-backdrop')) {
        closeAllModals();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeAllModals();
        return;
      }
      // Trap Tab focus inside the open dialog so keyboard users can't
      // tab into the page behind the modal.
      if (e.key === 'Tab') {
        var backdrop = document.querySelector('.modal-backdrop.open');
        if (!backdrop) return;
        var focusables = Array.prototype.slice.call(backdrop.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        ));
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        var active = document.activeElement;
        if (e.shiftKey) {
          if (active === first || active === backdrop || active === document.body) {
            e.preventDefault();
            last.focus();
          }
        } else if (active === last || active === backdrop) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  window.PortfolioInteractions = {
    init: function () {
      initEmail();
      initNav();
      initImageFallbacks();
      initModals();
    }
  };
})(window);
