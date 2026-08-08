/**
 * protect.js — Light discouragement of casual copying.
 * Disables the right-click context menu and image dragging.
 * Does NOT block DevTools, keyboard shortcuts, or Inspect Element.
 */
(function () {
  'use strict';

  /* Disable browser context menu (right-click) on the page */
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  }, { passive: false });

  /* Disable dragging on all images, videos, and SVGs */
  document.addEventListener('dragstart', function (e) {
    var tag = e.target.tagName;
    if (tag === 'IMG' || tag === 'VIDEO' || tag === 'SVG') {
      e.preventDefault();
    }
  }, { passive: false });
})();
