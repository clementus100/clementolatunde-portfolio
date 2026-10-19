/* Portfolio motion (Oct 2026): scroll-reveal, count-up, active nav. Vanilla JS, no dependencies.
   Content is never hidden unless this file ran; prefers-reduced-motion shows everything with no motion. */
(function () {
  var doc = document, root = doc.documentElement;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var hasIO = 'IntersectionObserver' in window;
  if (!hasIO) return; // old browser: plain page, everything visible
  root.classList.add('js');

  var REVEAL = '.section > .wrap > .eyebrow, .section > .wrap > h2, .section-intro, .cs-card, .case, .ux-card, .panel, .contact-inner, .sw-hint, .sw-board';

  function ready(fn) { doc.readyState === 'loading' ? doc.addEventListener('DOMContentLoaded', fn) : fn(); }

  ready(function () {
    var items = [].slice.call(doc.querySelectorAll(REVEAL));
    items.forEach(function (el) { el.classList.add('reveal'); });

    if (reduce) {
      items.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        var n = 0;
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target;
          el.style.setProperty('--d', Math.min(n, 6) * 90 + 'ms');
          n++;
          el.classList.add('is-in');
          io.unobserve(el);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      items.forEach(function (el) { io.observe(el); });
      // safety net: anything still hidden after 4s (e.g. observer never fired) is shown
      setTimeout(function () {
        items.forEach(function (el) { if (!el.classList.contains('is-in')) el.classList.add('is-in'); });
      }, 4000);
    }

    // count-up for the "at a glance" numbers (5, 20+, 8, 2); text is intact without JS or with reduced motion
    var nums = [].slice.call(doc.querySelectorAll('.facts strong'));
    if (nums.length && !reduce) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          cio.unobserve(e.target);
          countUp(e.target);
        });
      }, { threshold: 0.3 });
      nums.forEach(function (el) { cio.observe(el); });
    }
    function countUp(el) {
      var m = /^(\d+)(.*)$/.exec(el.textContent.trim());
      if (!m) return;
      var target = parseInt(m[1], 10), suffix = m[2], dur = 1100, t0 = null;
      function step(t) {
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step); else el.textContent = target + suffix;
      }
      requestAnimationFrame(step);
    }

    // active-section highlight in the nav
    var links = [].slice.call(doc.querySelectorAll('.nav ul a[href^="#"]'));
    var byId = {};
    links.forEach(function (a) {
      var sec = doc.getElementById(a.getAttribute('href').slice(1));
      if (sec) byId[sec.id] = a;
    });
    var secs = Object.keys(byId).map(function (id) { return doc.getElementById(id); });
    if (secs.length) {
      var current = null;
      function setActive(id) {
        if (current === id) return;
        current = id;
        links.forEach(function (a) {
          var on = byId[id] === a;
          a.classList.toggle('is-active', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      }
      var visible = {};
      var nio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
        var pick = null;
        for (var i = 0; i < secs.length; i++) { if (visible[secs[i].id]) { pick = secs[i].id; break; } }
        setActive(pick);
      }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
      secs.forEach(function (s) { nio.observe(s); });
    }
  });
})();
