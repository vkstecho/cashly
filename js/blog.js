/* Cashly — sequential blog loader from /blog/manifest.json */
(function () {
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function fmtDate(d) {
    if (!d) return '';
    try {
      return new Date(d + 'T12:00:00').toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch (e) { return d; }
  }

  async function loadManifest() {
    var r = await fetch('blog/manifest.json', { cache: 'no-store' });
    if (!r.ok) throw new Error('manifest missing');
    var data = await r.json();
    var posts = (data.posts || []).filter(function (p) { return p.published !== false; });
    // Sequential: sort by numeric id / folder prefix
    posts.sort(function (a, b) {
      var na = parseInt(String(a.id || a.folder || '0'), 10) || 0;
      var nb = parseInt(String(b.id || b.folder || '0'), 10) || 0;
      return nb - na; // newest number first
    });
    return posts;
  }

  function cardHtml(p) {
    var href = 'blog/' + (p.folder || (p.id + '-' + p.slug)) + '/index.html';
    var cover = p.cover
      ? '<img src="' + escapeHtml(p.cover) + '" alt="' + escapeHtml(p.title) + '" loading="lazy" onerror="this.onerror=null;this.src=\'assets/cashly-icon.png\'">'
      : '<div style="width:100%;height:100%;display:grid;place-items:center;color:#64748B;font-size:2rem">📝</div>';
    return (
      '<a class="media-card" href="' + href + '">' +
        '<div class="media-thumb">' + cover + '</div>' +
        '<div class="media-body">' +
          '<span class="pill">Blog</span>' +
          '<h3>' + escapeHtml(p.title) + '</h3>' +
          '<p style="color:var(--muted);font-size:.88rem">' + escapeHtml(p.excerpt || '') + '</p>' +
          '<div class="media-meta">' + fmtDate(p.date) + (p.tags && p.tags[0] ? ' · ' + escapeHtml(p.tags[0]) : '') + '</div>' +
        '</div>' +
      '</a>'
    );
  }

  async function renderInto(el, limit) {
    if (!el) return;
    el.innerHTML = '<div class="empty">Loading blogs…</div>';
    try {
      var posts = await loadManifest();
      if (limit) posts = posts.slice(0, limit);
      if (!posts.length) {
        el.innerHTML = '<div class="empty">No posts yet. Add numbered folders under <code>blog/</code> and update <code>blog/manifest.json</code>.</div>';
        return;
      }
      el.innerHTML = posts.map(cardHtml).join('');
    } catch (e) {
      el.innerHTML = '<div class="empty">Could not load blog list.</div>';
      console.warn(e);
    }
  }

  window.CashlyBlog = { loadManifest: loadManifest, renderInto: renderInto };
})();
