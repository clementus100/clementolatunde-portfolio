/* Heading text animation (20 Oct 2026, his ask: "let the program and the other heading have text animation").
   Each h1/h2/h3 is split into words (letters when the heading is a single word) that rise and fade in with a
   stagger the first time the heading scrolls into view, then one soft light sweep crosses the glyphs. Once only.
   Accessible: the heading (and any link inside it) keeps its full text as aria-label, the split spans are
   aria-hidden; the spans are inline-block with the same font metrics, so nothing shifts. Not run under
   prefers-reduced-motion or without IntersectionObserver: the plain static headings stand. */
(function () {
  var doc = document;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (reduce || !('IntersectionObserver' in window)) return;

  function ready(fn) { doc.readyState === 'loading' ? doc.addEventListener('DOMContentLoaded', fn) : fn(); }

  function textNodes(el, out) {
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) out.push(n);
      else if (n.nodeType === 1 && n.tagName !== 'SCRIPT') textNodes(n, out);
    }
    return out;
  }

  function split(h) {
    var full = (h.textContent || '').replace(/\s+/g, ' ').trim();
    if (!full) return null;
    var nodes = textNodes(h, []);
    var letters = full.indexOf(' ') < 0 && full.length <= 14; // one-word heading: letter by letter
    var spans = [];
    // every element whose own text gets split keeps its name for assistive tech
    h.setAttribute('aria-label', full);
    [].forEach.call(h.querySelectorAll('a'), function (a) { var t = (a.textContent || '').replace(/\s+/g, ' ').trim(); if (t) a.setAttribute('aria-label', t); });
    nodes.forEach(function (node) {
      var text = node.nodeValue;
      if (!text.trim()) return;
      var frag = doc.createDocumentFragment();
      var parts = letters ? text.split('') : text.split(/(\s+)/);
      parts.forEach(function (p) {
        if (!p) return;
        if (!letters && /^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(' ')); return; }
        var s = doc.createElement('span');
        s.className = 'tw';
        s.setAttribute('aria-hidden', 'true');
        s.textContent = p;
        frag.appendChild(s);
        spans.push(s);
      });
      node.parentNode.replaceChild(frag, node);
    });
    if (!spans.length) return null;
    var n = spans.length;
    var step = letters ? Math.min(45, 420 / Math.max(1, n - 1)) : Math.min(80, 400 / Math.max(1, n - 1));
    spans.forEach(function (s, i) { s.style.setProperty('--td', Math.round(i * step) + 'ms'); });
    // the light sweep starts as the last word lands
    h.style.setProperty('--ts', Math.round(step * (n - 1) + 380) + 'ms');
    h.classList.add('tx-split');
    return spans;
  }

  // the gradient and the sweep are painted per word, offset by the word's position so they read as one
  // continuous fill across the whole heading (a parent background-clip:text cannot follow transformed children)
  function place(h, spans) {
    var hb = h.getBoundingClientRect(), w = Math.max(1, Math.round(hb.width));
    spans.forEach(function (s) {
      var b = s.getBoundingClientRect();
      s.style.setProperty('--bw', w + 'px');
      s.style.setProperty('--bx', Math.round(hb.left - b.left) + 'px');
    });
  }

  ready(function () {
    var heads = [].slice.call(doc.querySelectorAll('h1, h2, h3')).filter(function (h) {
      return !h.classList.contains('visually-hidden') && !h.closest('[hidden], template');
    });
    var list = [];
    heads.forEach(function (h) { var spans = split(h); if (spans) list.push({ h: h, spans: spans }); });
    if (!list.length) return;
    function placeAll() { list.forEach(function (it) { place(it.h, it.spans); }); }
    placeAll();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(placeAll);
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(placeAll, 120); }, { passive: true });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var h = e.target;
        io.unobserve(h);
        // the hero name shows the moment it is on screen; everything else right as it scrolls in
        requestAnimationFrame(function () { h.classList.add('is-on'); });
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.15 });
    list.forEach(function (it) { io.observe(it.h); });
    // safety net: any heading still hidden while on screen after 4 s is shown
    setTimeout(function () {
      list.forEach(function (it) {
        if (it.h.classList.contains('is-on')) return;
        var r = it.h.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) it.h.classList.add('is-on');
      });
    }, 4000);
  });
})();
