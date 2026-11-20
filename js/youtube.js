/* Cashly YouTube — instant fallback, then live upgrade */
(function () {
  var CHANNEL_ID = 'UCfhIm-gZXMWel81oPMSm2qQ';
  var RSS = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + CHANNEL_ID;

  var FALLBACK = [
    { id: 'OyLeir3sab4', title: 'SBI Credit Card Customer Care in 2 Minutes', publishedAt: '' },
    { id: '6Q3QPdTRrdE', title: 'EMI वाला iPhone और Fortuner — असली औकात', publishedAt: '' },
    { id: 'q1EDzCJW1tg', title: '₹5,000 महीने से ₹3 करोड़ बनाएं | Compound Interest का जादू', publishedAt: '2026-11-17' },
    { id: 'BChRhUy6eAY', title: 'Credit Card se Bank Account — apps & tips', publishedAt: '' },
    { id: 'qy62Qu4bNLM', title: 'CDM मशीन के बाहर ये गलती मत करना | Cash Swap Scam', publishedAt: '' },
    { id: '82tMnlH5_d8', title: 'Google से Bank नंबर — fraud alert', publishedAt: '' },
    { id: 'gNba8vd0Ass', title: 'Free ₹5,000 From Government? | RBI series', publishedAt: '' },
    { id: 'q1EDzCJW1tg', title: 'Compound Interest — full breakdown', publishedAt: '' }
  ].map(function (v) {
    return {
      id: v.id,
      title: v.title,
      thumbnail: 'https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg',
      publishedAt: v.publishedAt,
      url: 'https://www.youtube.com/watch?v=' + v.id
    };
  });
  // dedupe by id keep first
  var seen = {};
  FALLBACK = FALLBACK.filter(function (v) {
    if (seen[v.id]) return false;
    seen[v.id] = 1;
    return true;
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function fmtDate(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return ''; }
  }
  function cardHtml(v) {
    return (
      '<a class="media-card" href="' + v.url + '" target="_blank" rel="noopener">' +
        '<div class="media-thumb"><img src="' + v.thumbnail + '" alt="" loading="lazy" width="480" height="360"></div>' +
        '<div class="media-body">' +
          '<span class="pill">YouTube</span>' +
          '<h3>' + escapeHtml(v.title) + '</h3>' +
          '<div class="media-meta">' + fmtDate(v.publishedAt) + '</div>' +
        '</div>' +
      '</a>'
    );
  }
  function paint(el, list, limit) {
    if (limit) list = list.slice(0, limit);
    el.innerHTML = list.map(cardHtml).join('');
  }

  function parseRss(xml) {
    var out = [], parts = xml.split(/<entry>/i);
    for (var i = 1; i < parts.length; i++) {
      var block = parts[i].split(/<\/entry>/i)[0];
      var videoId = (block.match(/<yt:videoId[^>]*>([^<]+)/i) || [])[1];
      if (!videoId) {
        var id = (block.match(/<id[^>]*>([^<]+)/i) || [])[1] || '';
        var m = id.match(/yt:video:(.+)$/);
        if (m) videoId = m[1];
      }
      if (!videoId) continue;
      var title = ((block.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || 'Untitled')
        .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').trim();
      var published = ((block.match(/<published[^>]*>([^<]+)/i) || [])[1] || '').trim();
      out.push({
        id: videoId,
        title: title,
        thumbnail: 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg',
        publishedAt: published,
        url: 'https://www.youtube.com/watch?v=' + videoId
      });
    }
    return out;
  }

  async function tryLive() {
    var proxies = [
      'https://api.allorigins.win/raw?url=' + encodeURIComponent(RSS),
      'https://corsproxy.io/?' + encodeURIComponent(RSS)
    ];
    for (var i = 0; i < proxies.length; i++) {
      try {
        var ctrl = new AbortController();
        var t = setTimeout(function () { ctrl.abort(); }, 4000);
        var r = await fetch(proxies[i], { signal: ctrl.signal, cache: 'no-store' });
        clearTimeout(t);
        if (!r.ok) continue;
        var xml = await r.text();
        var list = parseRss(xml);
        if (list.length) return list;
      } catch (e) { /* next */ }
    }
    return null;
  }

  async function renderInto(el, limit) {
    if (!el) return;
    // Instant paint — never leave user on "Loading…"
    paint(el, FALLBACK, limit || 12);
    try {
      var live = await tryLive();
      if (live && live.length) paint(el, live, limit || 12);
    } catch (e) { /* keep fallback */ }
  }

  window.CashlyYT = { renderInto: renderInto, CHANNEL_ID: CHANNEL_ID };
})();
