/* Motion Graphics gallery (20 Oct 2026). Every video is muted with native controls and preload="none", so nothing
   downloads or plays until the visitor presses play (reduced motion needs no special case: there is no autoplay).
   Voiced promos get a sound toggle beside the card text; playing one video pauses the others. Vanilla JS. */
(function () {
  var doc = document;
  var vids = [].slice.call(doc.querySelectorAll('video.mg-video'));
  if (!vids.length) return;
  vids.forEach(function (v) {
    v.addEventListener('play', function () {
      vids.forEach(function (o) { if (o !== v && !o.paused) o.pause(); });
    });
  });
  [].slice.call(doc.querySelectorAll('.mg-sound')).forEach(function (btn) {
    var card = btn.closest('.mg-card');
    var v = card && card.querySelector('video.mg-video');
    if (!v) { btn.hidden = true; return; }
    function paint() {
      var on = !v.muted;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      var ic = btn.querySelector('.mg-ic'), label = btn.querySelector('span');
      if (ic) ic.innerHTML = on
        ? '<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>'
        : '<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>';
      var voiced = v.getAttribute('data-voiced') !== '0';
      if (label) label.textContent = voiced
        ? (on ? 'Sound on \u00b7 voice-over playing' : 'Sound off \u00b7 tap for the voice-over')
        : (on ? 'Sound on \u00b7 music and effects' : 'Sound off \u00b7 tap for sound');
    }
    btn.addEventListener('click', function () {
      v.muted = !v.muted;
      if (!v.muted && v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      paint();
    });
    v.addEventListener('volumechange', paint);
    paint();
  });
  /* Alternate cut (VANTA, 23 Oct 2026): a small button swaps the card's video between two cuts (voiced / no-VO). */
  [].slice.call(doc.querySelectorAll('.mg-alt')).forEach(function (btn) {
    var card = btn.closest('.mg-card');
    var v = card && card.querySelector('video.mg-video');
    var srcEl = v && v.querySelector('source');
    if (!v || !srcEl || !btn.getAttribute('data-alt-src')) { btn.hidden = true; return; }
    var a = { src: srcEl.getAttribute('src'), label: btn.textContent, voiced: v.getAttribute('data-voiced') || '1' };
    var b = { src: btn.getAttribute('data-alt-src'), label: btn.getAttribute('data-alt-label'), voiced: btn.getAttribute('data-alt-voiced') || '0' };
    var onAlt = false;
    btn.addEventListener('click', function () {
      var wasPlaying = !v.paused;
      onAlt = !onAlt;
      var to = onAlt ? b : a;
      srcEl.setAttribute('src', to.src);
      v.setAttribute('data-voiced', to.voiced);
      v.load();
      if (wasPlaying) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      btn.textContent = onAlt ? b.label : a.label;
      btn.setAttribute('aria-pressed', onAlt ? 'true' : 'false');
      v.dispatchEvent(new Event('volumechange'));
    });
  });
})();

/* Multi-part film (30 Oct 2026, Ogunmola Parts 1-3): part buttons swap the card's one video (source + poster) and
   show that part's credit line; the sound toggle above keeps working on the same video element. */
(function () {
  [].slice.call(document.querySelectorAll('.mg-parts-card')).forEach(function (card) {
    var v = card.querySelector('video.mg-video');
    var srcEl = v && v.querySelector('source');
    var btns = [].slice.call(card.querySelectorAll('.mg-part'));
    var credits = [].slice.call(card.querySelectorAll('[data-part-credit]'));
    if (!v || !srcEl || !btns.length) return;
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.getAttribute('aria-pressed') === 'true') return;
        var wasPlaying = !v.paused, muted = v.muted;
        btns.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        srcEl.setAttribute('src', btn.getAttribute('data-src'));
        v.setAttribute('poster', btn.getAttribute('data-poster'));
        v.setAttribute('aria-label', v.getAttribute('aria-label').replace(/Part \d/, 'Part ' + btn.getAttribute('data-part')));
        v.load();
        v.muted = muted;
        credits.forEach(function (c) { c.hidden = c.getAttribute('data-part-credit') !== btn.getAttribute('data-part'); });
        if (wasPlaying) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      });
    });
  });
})();
