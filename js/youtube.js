/* Cashly — YouTube feed with robust fallbacks */
(function () {
  var CHANNEL_ID = 'UCfhIm-gZXMWel81oPMSm2qQ'; // @cashlybyVks
  var RSS = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + CHANNEL_ID;

  // Fallback if all proxies fail (keep updated occasionally)
  var FALLBACK = [
    { id: 'q1EDzCJW1tg', title: '₹5,000 महीने से ₹3 करोड़ बनाएं | Compound Interest का जादू', publishedAt: '2026-11-17', thumbnail: 'https://i.ytimg.com/vi/q1EDzCJW1tg/hqdefault.jpg' },
    { id: 'BChRhUy6eAY', title: 'Latest apps — withdraw money from Credit Card to Bank', publishedAt: '', thumbnail: 'https://i.ytimg.com/vi/BChRhUy6eAY/hqdefault.jpg' },
    { id: 'qy62Qu4bNLM', title: 'CDM मशीन के बाहर ये गलती मत करना | Cash Swap Scam', publishedAt: '', thumbnail: 'https://i.ytimg.com/vi/qy62Qu4bNLM/hqdefault.jpg' },
    { id: '82tMnlH5_d8', title: 'Google से Bank का नंबर — fraud alert', publishedAt: '', thumbnail: 'https://i.ytimg.com/vi/82tMnlH5_d8/hqdefault.jpg' },
    { id: 'gNba8vd0Ass', title: 'Free ₹5,000 From Government? | MoneyFlow x RBI', publishedAt: '', thumbnail: 'https://i.ytimg.com/vi/gNba8vd0Ass/hqdefault.jpg' }
  ];

  var PROXIES = [
    function (url) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url); },
    function (url) { return 'https://corsproxy.io/?' + encodeURIComponent(url); },
    function (url) { return 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(url); },
    function (url) { return 'https://rss2json.com/api.json?rss_url=' + encodeURIComponent(url); }
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
  function parseRss2Json(data) {
    if (!data || !data.items) return [];
    return data.items.map(function (it) {
      var id = '';
      var m = (it.link || it.guid || '').match(/[?&]v=([\w-]{11})/) ||
              (it.guid || '').match(/yt:video:([\w-]{11})/);
      if (m) id = m[1];
      if (!id && it.thumbnail) {
        var t = String(it.thumbnail).match(/vi\/([\w-]{11})/);
        if (t) id = t[1];
      }
      if (!id) return null;
      return {
        id: id,
        title: it.title || 'Untitled',
        thumbnail: it.thumbnail || ('https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'),
        publishedAt: it.pubDate || it.published || '',
        url: 'https://www.youtube.com/watch?v=' + id
      };
    }).filter(Boolean);
  }

  async function fetchRss() {
    for (var i = 0; i < PROXIES.length; i++) {
      try {
        var r = await fetch(PROXIES[i](RSS), { cache: 'no-store' });
        if (!r.ok) continue;
        var ct = (r.headers.get('content-type') || '');
        if (ct.indexOf('json') !== -1 || i === 3) {
          var data = await r.json();
          var list = parseRss2Json(data);
          if (list.length) return list;
        } else {
          var xml = await r.text();
          var list2 = parseRss(xml);
          if (list2.length) return list2;
        }
      } catch (e) { /* next */ }
    }
    // Fallback curated list
    return FALLBACK.map(function (v) {
      return {
        id: v.id,
        title: v.title,
        thumbnail: v.thumbnail,
        publishedAt: v.publishedAt,
        url: 'https://www.youtube.com/watch?v=' + v.id
      };
    });
  }

  function fmtDate(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return ''; }
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
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

  async function renderInto(el, limit) {
    if (!el) return;
    el.innerHTML = '<div class="empty">Loading latest videos…</div>';
    try {
      var list = await fetchRss();
      if (limit) list = list.slice(0, limit);
      if (!list.length) {
        el.innerHTML = '<div class="empty">No videos found. <a href="https://www.youtube.com/@cashlybyVks" target="_blank" rel="noopener">Open channel</a></div>';
        return;
      }
      el.innerHTML = list.map(cardHtml).join('');
    } catch (e) {
      el.innerHTML = FALLBACK.slice(0, limit || 6).map(function (v) {
        return cardHtml({
          id: v.id, title: v.title, thumbnail: v.thumbnail,
          publishedAt: v.publishedAt, url: 'https://www.youtube.com/watch?v=' + v.id
        });
      }).join('');
      console.warn(e);
    }
  }

  window.CashlyYT = { renderInto: renderInto, fetchRss: fetchRss, CHANNEL_ID: CHANNEL_ID };
})();
