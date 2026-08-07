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

  /* ---------- Resume PDF viewer (pdf.js) ---------- */
  var resumeState = {
    pdf: null,
    zoom: 1,
    loaded: false,
    loading: false,
    rendering: false,
    rerender: false
  };

  /**
   * Build clickable link overlays for one rendered page.
   * Mirrors the positioning math used by pdf.js AnnotationElement
   * (src/display/annotation_layer.js, v3.11.174).
   */
  function buildResumeLinks(page, viewport, annotations) {
    var links = (annotations || []).filter(function (a) {
      return a.subtype === 'Link' && (a.url || a.unsafeUrl);
    });
    if (!links.length) return null;

    var layer = document.createElement('div');
    layer.className = 'annotationLayer';

    var rawDims = viewport.rawDims;
    var pageWidth = rawDims.pageWidth;
    var pageHeight = rawDims.pageHeight;
    var pageX = rawDims.pageX;
    var pageY = rawDims.pageY;
    var view = page.view || [0, 0, pageWidth, pageHeight];

    links.forEach(function (data, index) {
      var rect = data.rect;
      if (!rect || rect.length !== 4) return;

      var section = document.createElement('section');
      section.className = 'linkAnnotation';
      section.style.zIndex = String(index + 1);

      // Convert the PDF rect (origin bottom-left) into top-left page space.
      var flipped = window.pdfjsLib.Util.normalizeRect([
        rect[0],
        view[3] - rect[1] + view[1],
        rect[2],
        view[3] - rect[3] + view[1]
      ]);

      section.style.left = (100 * (flipped[0] - pageX) / pageWidth) + '%';
      section.style.top = (100 * (flipped[1] - pageY) / pageHeight) + '%';
      section.style.width = (100 * (rect[2] - rect[0]) / pageWidth) + '%';
      section.style.height = (100 * (rect[3] - rect[1]) / pageHeight) + '%';

      var anchor = document.createElement('a');
      anchor.href = data.url || data.unsafeUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      section.appendChild(anchor);

      layer.appendChild(section);
    });

    return layer;
  }

  function renderResume() {
    if (!resumeState.pdf) return;
    if (resumeState.rendering) {
      resumeState.rerender = true;
      return;
    }
    resumeState.rendering = true;

    var wrap = document.getElementById('resume-canvas-wrap');
    var viewer = document.getElementById('resume-viewer');
    var zoomLabel = document.getElementById('resume-zoom-level');
    if (!wrap) {
      resumeState.rendering = false;
      return;
    }

    var containerWidth = (viewer && viewer.clientWidth) ? viewer.clientWidth - 48 : 760;
    var pdf = resumeState.pdf;

    pdf.getPage(1).then(function (firstPage) {
      var base = firstPage.getViewport({ scale: 1 });
      var fitScale = (containerWidth / base.width) * 0.94;
      var scale = fitScale * resumeState.zoom;

      // Remove previously rendered pages; keep the loading message until done.
      wrap.querySelectorAll('.resume-page').forEach(function (el) { el.remove(); });

      var tasks = [];
      for (var n = 1; n <= pdf.numPages; n++) {
        tasks.push(pdf.getPage(n).then(function (page) {
          var viewport = page.getViewport({ scale: scale });
          var dpr = window.devicePixelRatio || 1;

          var pageEl = document.createElement('div');
          pageEl.className = 'resume-page';

          var canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width * dpr);
          canvas.height = Math.floor(viewport.height * dpr);
          canvas.style.width = Math.floor(viewport.width) + 'px';
          canvas.style.height = Math.floor(viewport.height) + 'px';
          pageEl.appendChild(canvas);

          return page.render({
            canvasContext: canvas.getContext('2d'),
            viewport: page.getViewport({ scale: scale * dpr })
          }).promise.then(function () {
            return page.getAnnotations().then(function (annotations) {
              var layer = buildResumeLinks(page, viewport, annotations);
              if (layer) pageEl.appendChild(layer);
            });
          }).then(function () {
            wrap.appendChild(pageEl);
          });
        }));
      }
      return Promise.all(tasks);
    }).then(function () {
      var loading = wrap.querySelector('.resume-loading');
      if (loading) loading.remove();
      if (zoomLabel) zoomLabel.textContent = Math.round(resumeState.zoom * 100) + '%';
      resumeState.loading = false;
      resumeState.rendering = false;
      if (resumeState.rerender) {
        resumeState.rerender = false;
        renderResume();
      }
    }).catch(function () {
      resumeState.loading = false;
      resumeState.rendering = false;
      resumeState.rerender = false;
    });
  }

  function loadResume() {
    if (resumeState.loaded || resumeState.loading) return;
    if (typeof window.pdfjsLib === 'undefined') return;
    resumeState.loading = true;
    var wrap = document.getElementById('resume-canvas-wrap');
    if (wrap) {
      wrap.innerHTML = '<div class="resume-loading" role="status" aria-live="polite">Loading resume&hellip;</div>';
    }
    try {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    } catch (e) { /* worker src config not critical */ }

    window.pdfjsLib.getDocument('assets/resume.pdf').promise.then(function (pdf) {
      resumeState.pdf = pdf;
      resumeState.zoom = 1;
      resumeState.loaded = true;
      renderResume();
    }).catch(function () {
      resumeState.loading = false;
      if (wrap) {
        var fallback = document.createElement('a');
        fallback.href = 'assets/resume.pdf';
        fallback.textContent = 'Unable to preview — open the resume PDF';
        fallback.className = 'resume-fallback-link';
        fallback.setAttribute('download', '');
        wrap.appendChild(fallback);
      }
    });
  }

  function initResumeViewer() {
    document.querySelectorAll('[data-zoom]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.getAttribute('data-zoom');
        if (action === 'in') resumeState.zoom = Math.min(resumeState.zoom * 1.25, 4);
        else if (action === 'out') resumeState.zoom = Math.max(resumeState.zoom / 1.25, 0.25);
        else if (action === 'reset') resumeState.zoom = 1;
        renderResume();
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
    // Load the resume PDF lazily, then re-render once the modal is visible
    // so the container width is measured correctly.
    if (id === 'resume') {
      if (!resumeState.loaded) loadResume();
      setTimeout(renderResume, 320);
    }
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
      initResumeViewer();
      initModals();
    }
  };
})(window);
