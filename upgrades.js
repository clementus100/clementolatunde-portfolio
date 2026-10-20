/* Portfolio upgrades (20 Oct 2026): motion reels (lazy, play only on screen), Calmly screen gallery (chips + arrows),
   StepWise tap-through prototype, impact strip count-up re-use. Vanilla JS, no dependencies. */
(function () {
  var doc = document;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var hasIO = 'IntersectionObserver' in window;

  // 1. motion reels: attach the sources when the card comes near, play while on screen, pause off screen.
  //    With reduced motion the poster stays and nothing plays; if the video fails, the phone thumbnails stay as the fallback.
  var reels = [].slice.call(doc.querySelectorAll('video.reel'));
  function loadReel(v) {
    if (v._loaded) return; v._loaded = true;
    [].slice.call(v.querySelectorAll('source[data-src]')).forEach(function (s) { s.src = s.getAttribute('data-src'); s.removeAttribute('data-src'); });
    v.addEventListener('playing', function () { v.classList.add('is-on'); var c = v.closest('.ux-cover'); if (c) c.classList.add('reel-live'); });
    v.addEventListener('error', function () { v.classList.remove('is-on'); }, true);
    v.load();
  }
  function playReel(v) { loadReel(v); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  if (reels.length && !reduce) {
    if (hasIO) {
      var rio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) playReel(e.target); else if (!e.target.paused) e.target.pause(); });
      }, { rootMargin: '160px 0px' });
      reels.forEach(function (v) { rio.observe(v); });
    } else reels.forEach(playReel);
    doc.addEventListener('visibilitychange', function () {
      reels.forEach(function (v) { if (doc.hidden) { if (!v.paused) v.pause(); } else if (v._loaded && v.classList.contains('is-on')) playReel(v); });
    });
  }

  // 2. Calmly gallery: section chips scroll to a group, arrows page by one viewport, the active chip follows the scroll
  var gal = doc.querySelector('.gal');
  if (gal) {
    var chips = [].slice.call(doc.querySelectorAll('.gal-chip'));
    var groups = [].slice.call(gal.querySelectorAll('.gal-group'));
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var g = gal.querySelector('#gal-' + c.getAttribute('data-group'));
        if (g) gal.scrollTo({ left: g.offsetLeft - 24, behavior: reduce ? 'auto' : 'smooth' });
      });
    });
    var prev = doc.querySelector('.gal-prev'), next = doc.querySelector('.gal-next');
    function page(dir) { gal.scrollBy({ left: dir * Math.max(200, gal.clientWidth * 0.8), behavior: reduce ? 'auto' : 'smooth' }); }
    if (prev) prev.addEventListener('click', function () { page(-1); });
    if (next) next.addEventListener('click', function () { page(1); });
    gal.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { page(1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { page(-1); e.preventDefault(); }
    });
    var tick = false;
    function mark() {
      tick = false;
      var x = gal.scrollLeft + gal.clientWidth * 0.35, cur = groups[0];
      groups.forEach(function (g) { if (g.offsetLeft - 24 <= x) cur = g; });
      var id = cur ? cur.getAttribute('data-group') : null;
      chips.forEach(function (c) { c.classList.toggle('is-active', c.getAttribute('data-group') === id); });
    }
    gal.addEventListener('scroll', function () { if (!tick) { tick = true; (window.requestAnimationFrame || setTimeout)(mark); } }, { passive: true });
    mark();
  }

  // 4. StepWise prototype: tap the screen or use Next/Back (or arrow keys) to walk the 30 screens; the next image is preloaded
  var pw = doc.getElementById('stepwise-prototype');
  var dataEl = doc.getElementById('proto-data');
  if (pw && dataEl) {
    var screens = [];
    try { screens = JSON.parse(dataEl.textContent); } catch (e) {}
    var img = pw.querySelector('.proto-img'), count = pw.querySelector('.proto-count'), name = pw.querySelector('.proto-name');
    var dots = pw.querySelector('.proto-dots'), tap = pw.querySelector('.proto-tap');
    var i = 0, n = screens.length, dotEls = [];
    if (n && dots) { screens.forEach(function () { var d = doc.createElement('i'); dots.appendChild(d); dotEls.push(d); }); }
    function pad(k) { return (k < 10 ? '0' : '') + k; }
    function preload(k) { if (k >= 0 && k < n) { var im = new Image(); im.src = screens[k].f; } }
    function show(k, dir) {
      if (!n) return;
      i = (k + n) % n;
      var s = screens[i];
      img.classList.remove('is-swap', 'is-swap-back');
      void img.offsetWidth; // restart the slide animation
      img.src = s.f;
      img.alt = 'StepWise screen ' + (i + 1) + ' of ' + n + ': ' + s.n;
      if (dir) img.classList.add(dir > 0 ? 'is-swap' : 'is-swap-back');
      if (count) count.textContent = pad(i + 1) + ' / ' + n;
      if (name) name.textContent = s.n;
      dotEls.forEach(function (d, j) { d.classList.toggle('is-on', j === i); });
      preload(i + 1); preload(i - 1);
    }
    var nx = pw.querySelector('.proto-next'), bk = pw.querySelector('.proto-prev');
    if (nx) nx.addEventListener('click', function () { show(i + 1, 1); });
    if (bk) bk.addEventListener('click', function () { show(i - 1, -1); });
    if (tap) tap.addEventListener('click', function () { show(i + 1, 1); });
    pw.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { show(i + 1, 1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { show(i - 1, -1); e.preventDefault(); }
    });
    // swipe on the phone
    var x0 = null;
    if (tap) {
      tap.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      tap.addEventListener('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0; x0 = null;
        if (dx < -40) { show(i + 1, 1); e.preventDefault(); } else if (dx > 40) { show(i - 1, -1); e.preventDefault(); }
      });
    }
    show(0, 0);
    if (hasIO) {
      var pio = new IntersectionObserver(function (entries) { entries.forEach(function (e) { if (e.isIntersecting) { preload(1); preload(2); pio.disconnect(); } }); }, { rootMargin: '300px 0px' });
      pio.observe(pw);
    }
  }
})();
