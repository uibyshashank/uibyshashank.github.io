/**
 * animations.js — Scroll-reveal observer + hero parallax.
 * Exposes `window.PortfolioAnimations.init()`.
 */
(function (window) {
  'use strict';

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || !els.length) {
      // Fallback: never hide content if the API is unavailable.
      els.forEach(function (el) { el.classList.add('on'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('on');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    els.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Hero parallax on floating images ---------- */
  function initParallax() {
    var hero = document.querySelector('.hero');
    var floats = document.querySelectorAll('.fi');
    if (!hero || !floats.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var baseTransforms = [
      'rotate(-4deg)',
      'rotate(3.5deg)',
      'translateY(-50%) rotate(2deg)',
      'translateY(-50%) rotate(-2deg)',
      'rotate(3deg)',
      'rotate(-3.5deg)'
    ];
    var depths = [14, 12, 10, 12, 10, 14];
    var raf = null;

    function apply(dx, dy) {
      floats.forEach(function (f, i) {
        var tx = dx * depths[i];
        var ty = dy * depths[i];
        if (f.classList.contains('fi-3') || f.classList.contains('fi-4')) {
          var rDeg = f.classList.contains('fi-3') ? '2deg' : '-2deg';
          f.style.transform = 'translateY(calc(-50% + ' + ty + 'px)) translateX(' + tx + 'px) rotate(' + rDeg + ')';
        } else {
          f.style.transform = baseTransforms[i] + ' translate(' + tx + 'px,' + ty + 'px)';
        }
      });
    }

    function onMove(e) {
      var cx = window.innerWidth / 2;
      var cy = window.innerHeight / 2;
      var dx = (e.clientX - cx) / cx;
      var dy = (e.clientY - cy) / cy;
      if (raf) window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(function () { apply(dx, dy); });
    }

    document.addEventListener('mousemove', onMove, { passive: true });
    hero.addEventListener('mouseleave', function () {
      if (raf) window.cancelAnimationFrame(raf);
      floats.forEach(function (f, i) { f.style.transform = baseTransforms[i]; });
    });
  }

  window.PortfolioAnimations = {
    init: function () {
      initReveal();
      initParallax();
    }
  };
})(window);
