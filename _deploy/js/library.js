// NYUKD content library — renders a video gallery from window.NYUKD_LIBRARY.
// No build step, no dependencies. Each page defines its own NYUKD_LIBRARY array
// (see verticals/entertainment.html / infotainment.html) and a
// <div id="library-grid" data-media="../assets/video/<pillar>/"></div>.
//
// To publish a video: drop the MP4 into the pillar's media folder, then set the
// item's `status: "live"` and `src: "filename.mp4"` in that page's array.
(function () {
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function render() {
    var grid = document.getElementById('library-grid');
    if (!grid || !Array.isArray(window.NYUKD_LIBRARY)) return;
    var base = grid.getAttribute('data-media') || '';

    window.NYUKD_LIBRARY.forEach(function (item) {
      var card = el('article', 'video-card');

      var media;
      if (item.status === 'live' && item.src) {
        media = el('div', 'video-card__media');
        var v = document.createElement('video');
        v.setAttribute('controls', '');
        v.setAttribute('preload', 'metadata');
        v.setAttribute('playsinline', '');
        if (item.poster) v.setAttribute('poster', base + item.poster);
        v.src = base + item.src;
        media.appendChild(v);
      } else {
        media = el('div', 'video-card__media video-card__media--soon');
        media.appendChild(el('span', 'video-card__hookword', item.hookword || ''));
        media.appendChild(el('span', 'video-card__badge', 'Coming soon'));
      }
      card.appendChild(media);

      var body = el('div', 'video-card__body');
      body.appendChild(el('span', 'video-card__ai', 'AI-rendered'));
      body.appendChild(el('h3', null, item.title || ''));
      if (item.teaser) body.appendChild(el('p', null, item.teaser));
      if (item.meta) body.appendChild(el('p', 'video-card__meta', item.meta));
      card.appendChild(body);

      grid.appendChild(card);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
