/**
 * main.js — Bootstraps the portfolio modules once the DOM is ready.
 * Load order (both deferred): js/animations.js → js/interactions.js → main.js
 */
(function (window) {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    if (window.PortfolioAnimations) window.PortfolioAnimations.init();
    if (window.PortfolioInteractions) window.PortfolioInteractions.init();
  });
})(window);
