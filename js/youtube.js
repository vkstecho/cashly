/* Cashly — YouTube auto-fetch via public RSS (no API key) */
(function () {
  var CHANNEL_ID = 'UCfhIm-gZXMWel81oPMSm2qQ'; // @cashlybyVks
  var RSS = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + CHANNEL_ID;
  // Public RSS→JSON proxies (fallback chain)
  var PROXIES = [
    function (url) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url); },
    function (url) { return 'https://corsproxy.io/?' + encodeURIComponent(url); }
  ];

  function decodeXml(s) {
    return String(s || '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
  }
  function tag(block, name) {
    var m = block.match(new RegExp('<' + name + '[^>]*>([\\s\\S]*?)</' + name + '>', 'i'));
    return m ? decodeXml(m[1].trim()) : '';
  }
  function attr(block, name, a) {
    var m = block.match(new RegExp('<' + name + '[^>]*\\s' + a + '=["\']([^"\']+)["\']', 'i'));
    return m ? decodeXml(m[1]) : '';
  }
  function parseRss(xml) {
    var out = [];
    var parts = xml.split(/<entry>/i);
    for (var i = 1; i < parts.length; i++) {
      var block = parts[i].split(/<\/entry>/i)[0];
      var videoId = tag(block, 'yt:videoId');
      if (!videoId) {
        var id = tag(block, 'id');
        var m = id.match(/yt:video:(.+)$/);
        if (m) videoId = m[1];
      }
      if (!videoId) continue;
      var title = tag(block, 'title') || 'Untitled';
      var published = tag(block, 'published') || '';
      var thumb = attr(block, 'media:thumbnail', 'url') ||
        ('https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg');
      thumb = thumb.replace(/\/default\.jpg$/i, '/hqdefault.jpg');
      out.push({
        id: videoId,
        title: title,
        thumbnail: thumb,
        publishedAt: published,
        url: 'https://www.youtube.com/watch?v=' + videoId
      });
    }
    return out;
  }

  async function fetchRss() {
    var lastErr;
    for (var i = 0; i < PROXIES.length; i++) {
      try {
        var r = await fetch(PROXIES[i](RSS), { cache: 'no-store' });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        var xml = await r.text();
        var list = parseRss(xml);
        if (list.length) return list;
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('YouTube feed unavailable');
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
        '<div class="media-thumb"><img src="' + v.thumbnail + '" alt="" loading="lazy"></div>' +
        '<div class="media-body">' +
          '<span class="pill">YouTube</span>' +
          '<h3>' + escapeHtml(v.title) + '</h3>' +
          '<div class="media-meta">' + fmtDate(v.publishedAt) + '</div>' +
        '</div>' +
      '</a>'
    );
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  async function renderInto(el, limit) {
    if (!el) return;
    el.innerHTML = '<div class="empty">Loading latest videos…</div>';
    try {
      var list = await fetchRss();
      if (limit) list = list.slice(0, limit);
      if (!list.length) {
        el.innerHTML = '<div class="empty">No videos found yet. <a href="https://www.youtube.com/@cashlybyVks" target="_blank" rel="noopener">Open channel</a></div>';
        return;
      }
      el.innerHTML = list.map(cardHtml).join('');
    } catch (e) {
      el.innerHTML = '<div class="empty">Could not load videos right now. <a href="https://www.youtube.com/@cashlybyVks" target="_blank" rel="noopener">Watch on YouTube</a></div>';
      console.warn(e);
    }
  }

  window.CashlyYT = { renderInto: renderInto, fetchRss: fetchRss, CHANNEL_ID: CHANNEL_ID };
})();
