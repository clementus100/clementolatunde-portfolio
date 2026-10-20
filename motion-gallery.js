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
      if (label) label.textContent = on ? 'Sound on \u00b7 voice-over playing' : 'Sound off \u00b7 tap for the voice-over';
    }
    btn.addEventListener('click', function () {
      v.muted = !v.muted;
      if (!v.muted && v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      paint();
    });
    v.addEventListener('volumechange', paint);
    paint();
  });
})();
