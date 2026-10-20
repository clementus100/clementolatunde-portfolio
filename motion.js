/* Portfolio motion (Oct 2026): two-way scroll-reveal, hero parallax, scroll progress, count-up, active nav,
   motion thumbnails. Vanilla JS, no dependencies, transform/opacity only.
   Content is never hidden unless this file ran; prefers-reduced-motion shows everything static. */
(function () {
  var doc = document, root = doc.documentElement;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (!('IntersectionObserver' in window)) return; // old browser: plain page, everything visible
  root.classList.add('js');

  var REVEAL = '.section > .wrap > .eyebrow, .section > .wrap > h2, .section-intro, .cs-card, .case, .ux-card, .panel, .contact .eyebrow, .contact h2, .contact-inner > p, .channels li, .contact .cta, .sw-hint, .sw-board, ' +
               '.hero .kicker, .hero h1, .hero .role, .hero .lede, .hero .cta, .facts li, .sw-meta, .sw-note, ' +
               // 20 Oct 2026 upgrades: every new block reveals too (children staggered by the --d step below)
               '.impact .facts li, .showcase .eyebrow, .showcase-h, .showcase-intro, .gal-nav, .gal-shell, .proto-now, .proto-ctl, .proto-dots, .proto-phone, .sw-reel';
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(f, 16); };

  function ready(fn) { doc.readyState === 'loading' ? doc.addEventListener('DOMContentLoaded', fn) : fn(); }

  ready(function () {
    var items = [].slice.call(doc.querySelectorAll(REVEAL));

    if (reduce) {
      items.forEach(function (el) { el.classList.add('reveal', 'is-in'); });
    } else {
      // Elements outside the hero start hidden; hero elements keep their CSS entrance and join the reveal
      // system the first time they leave the viewport (so there is no flash on load).
      items.forEach(function (el) {
        if (!el.closest('.hero')) {
          el.classList.add('reveal');
          if (el.getBoundingClientRect().bottom < 0) el.style.setProperty('--dy', '-26px');
        }
      });
      var io = new IntersectionObserver(function (entries) {
        var n = 0;
        entries.forEach(function (e) {
          var el = e.target, r = e.boundingClientRect, rb = e.rootBounds;
          var rootTop = rb ? rb.top : 0, rootH = rb ? rb.height : window.innerHeight;
          var tall = r.height > rootH * 0.6;
          var inView = e.isIntersecting && (e.intersectionRatio >= 0.1 || tall);
          if (inView) {
            if (el.classList.contains('is-in')) return;
            el.style.setProperty('--d', Math.min(n, 5) * 80 + 'ms');
            n++;
            el.classList.add('reveal', 'is-in');
          } else if (!e.isIntersecting) {
            // left through the top edge -> next time it slides down from above; through the bottom -> slides up
            el.style.setProperty('--dy', r.top < rootTop ? '-26px' : '26px');
            el.style.setProperty('--d', '0ms');
            el.classList.add('reveal');
            el.classList.remove('is-in');
          }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: [0, 0.1, 0.25] });
      items.forEach(function (el) { io.observe(el); });
      // safety net: anything hidden while actually on screen after 4s is shown
      setTimeout(function () {
        items.forEach(function (el) {
          if (el.classList.contains('is-in')) return;
          var r = el.getBoundingClientRect();
          if (r.bottom > 0 && r.top < window.innerHeight) el.classList.add('is-in');
        });
      }, 4000);
    }

    // hero parallax (shapes + photo) and scroll progress bar: one passive scroll listener, work done in rAF, transform only
    var hero = doc.querySelector('.hero'), photo = doc.querySelector('.hero-photo'), bar = null;
    if (!reduce) {
      bar = doc.createElement('div'); bar.className = 'scroll-progress'; bar.setAttribute('aria-hidden', 'true');
      doc.body.appendChild(bar);
      var ticking = false, heroH = hero ? hero.offsetHeight : 0;
      function paint() {
        ticking = false;
        var y = window.pageYOffset || root.scrollTop || 0;
        var max = Math.max(1, root.scrollHeight - window.innerHeight);
        bar.style.transform = 'scaleX(' + Math.min(1, y / max).toFixed(4) + ')';
        if (hero && y <= heroH + 40) {
          hero.style.setProperty('--pa', (y * 0.22).toFixed(1) + 'px');
          hero.style.setProperty('--pb', (y * -0.14).toFixed(1) + 'px');
          if (photo) photo.style.setProperty('--pp', (y * 0.08).toFixed(1) + 'px');
        }
      }
      function onScroll() { if (!ticking) { ticking = true; raf(paint); } }
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', function () { heroH = hero ? hero.offsetHeight : 0; onScroll(); }, { passive: true });
      paint();
    }

    // count-up for the "at a glance" numbers (5, 20+, 8, 2); re-runs each time the stats scroll back into view
    var nums = [].slice.call(doc.querySelectorAll('.facts strong'));
    if (nums.length && !reduce) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var el = e.target;
          if (e.isIntersecting && e.intersectionRatio >= 0.3) { if (!el._up) countUp(el); }
          else if (!e.isIntersecting) { el._up = false; }
        });
      }, { threshold: [0, 0.3] });
      nums.forEach(function (el) { el._final = el.textContent.trim(); cio.observe(el); });
    }
    function countUp(el) {
      var m = /^(\d+)(.*)$/.exec(el._final);
      if (!m) return;
      el._up = true;
      var target = parseInt(m[1], 10), suffix = m[2], dur = 1100, t0 = null, run = (el._run || 0) + 1;
      el._run = run;
      function step(t) {
        if (el._run !== run) return;
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) raf(step); else el.textContent = el._final;
      }
      raf(step);
    }

    // motion thumbnails: load the screens when the card is near the viewport, play only while on screen
    var thumbs = [].slice.call(doc.querySelectorAll('.thumb'));
    if (thumbs.length && !reduce) {
      var tio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var t = e.target;
          if (e.isIntersecting) {
            if (!t._loaded) {
              t._loaded = true;
              var imgs = [].slice.call(t.querySelectorAll('img[data-src]')), left = imgs.length;
              imgs.forEach(function (im) {
                im.onload = im.onerror = function () { if (--left === 0) { t.classList.add('is-ready'); raf(function () { t.classList.add('is-on'); }); } };
                im.src = im.getAttribute('data-src'); im.removeAttribute('data-src');
              });
            } else t.classList.add('is-on');
          } else t.classList.remove('is-on');
        });
      }, { rootMargin: '200px 0px' });
      thumbs.forEach(function (t) { tio.observe(t); });
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
