/* Cashly website video cards use the same validated catalog as the app. */
(function () {
  'use strict';
  const catalog = window.CashlyCatalog;
  const cacheKey = 'cashly_learn_catalog_v81_videos';
  const dateFormat = new Intl.DateTimeFormat('en-IN', {day:'numeric',month:'short',year:'numeric'});
  const el = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value) node.textContent = value;
    return node;
  };

  function watch(video, dialog, event) {
    if (!dialog?.showModal || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    dialog.querySelector('h2').textContent = video.title;
    dialog.querySelector('a').href = video.watchUrl;
    const player = dialog.querySelector('[data-player]');
    const frame = el('iframe', 'cashly-video-embed');
    frame.title = video.title;
    frame.src = 'https://www.youtube-nocookie.com/embed/' + video.id + '?playsinline=1';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allow = 'encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    player.replaceChildren(frame);
    dialog.showModal();
  }

  function card(video, verification, dialog) {
    const link = el('a','media-card');
    link.href = video.watchUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    if (video.embeddable) link.addEventListener('click', event => watch(video, dialog, event));
    const thumb = el('div','media-thumb');
    if (video.thumbnail) {
      const image = el('img');
      image.src = video.thumbnail;
      image.alt = '';
      image.loading = 'lazy';
      image.width = 480;
      image.height = 270;
      image.addEventListener('error', () => image.remove());
      thumb.append(image);
    }
    const body = el('div','media-body');
    const label = catalog.liveLabel(video, verification) ||
      ({short:'Short',video:'Video',unknown:'YouTube'})[video.contentType];
    const sub = [dateFormat.format(new Date(video.publishedAt)),catalog.duration(video.durationSeconds)].filter(Boolean).join(' · ');
    body.append(el('span','pill',label),el('h3','',video.title),el('div','media-meta',sub));
    link.append(thumb,body);
    return link;
  }

  async function renderInto(grid, limit) {
    if (!grid) return;
    const scope = grid.parentElement;
    const base = new URL('.',location.href);
    const status = scope.querySelector('[data-catalog-status]') || el('p','media-meta');
    status.setAttribute('role','status');
    if (!status.isConnected) grid.before(status);
    const controls = scope.querySelector('[data-catalog-controls]');
    const dialog = document.getElementById('cashly-video-player');
    const search = controls?.querySelector('[name=videoSearch]');
    const type = controls?.querySelector('[name=videoType]');
    const language = controls?.querySelector('[name=videoLanguage]');
    const playlist = controls?.querySelector('[name=videoPlaylist]');
    const playlistInfo = scope.querySelector('[data-playlist-info]');
    const more = scope.querySelector('[data-catalog-more]');
    const pageSize = 24;
    let shown = limit || pageSize, record, stale = false, failed = false, loading = true;
    function paint() {
      const data = record?.manifest;
      const selected = data?.playlists?.find(item => item.id === playlist?.value);
      const byId = new Map((data?.videos || []).map(item => [item.id,item]));
      const pool = selected ? selected.videoIds.map(id => byId.get(id)) : [...byId.values()];
      const query = search?.value.trim().toLocaleLowerCase() || '';
      const visible = pool.filter(item => {
        if (type?.value === 'broadcast') {
          if (!['live','upcoming','recorded'].includes(item.liveStatus)) return false;
        } else if (type?.value && type.value !== 'all') {
          if (type.value === 'video' ? item.contentType === 'short' : item.contentType !== type.value) return false;
        }
        return (!language?.value || language.value === 'all' || catalog.languages([item.language]).includes(language.value)) &&
          (!query || [item.title,item.description,...(item.tags || [])].join(' ').toLocaleLowerCase().includes(query));
      });
      grid.replaceChildren(...visible.slice(0,shown).map(item => card(item,data.lastSuccessfulSync,dialog)));
      if (playlistInfo) {
        playlistInfo.replaceChildren();
        if (selected) {
          if (selected.thumbnail) {
            const image = el('img');
            image.src = selected.thumbnail;
            image.alt = '';
            playlistInfo.append(image);
          }
          const text = el('div');
          text.append(el('strong','',selected.title));
          if (selected.description) text.append(el('p','',selected.description));
          text.append(el('small','',selected.videoIds.length + ' public Cashly videos'));
          playlistInfo.append(text);
        }
        playlistInfo.hidden = !selected;
      }
      if (controls) controls.hidden = !data?.videos.length;
      if (more) more.hidden = shown >= visible.length;
      const verification = data?.lastSuccessfulSync ? new Date(data.lastSuccessfulSync).toLocaleString() : '';
      status.textContent = stale ? 'Showing saved catalog. Last API verification ' + verification + '.'
        : failed ? 'Video catalog unavailable. Visit the official channel for the latest videos.'
        : loading ? 'Loading videos…'
        : !data?.videos.length ? 'Videos will appear here after the official catalog is published.'
        : !visible.length ? 'No matching videos.'
        : 'Last API verification ' + verification + '.';
    }
    function reloadOptions() {
      if (!playlist) return;
      const value = playlist.value;
      playlist.replaceChildren(new Option('All playlists',''));
      for (const group of record?.manifest.playlists || []) playlist.add(new Option(group.title,group.id));
      playlist.value = [...playlist.options].some(option => option.value === value) ? value : '';
    }
    if (controls) controls.addEventListener('input', () => { shown = pageSize; paint(); });
    if (more) more.addEventListener('click', () => { shown += pageSize; paint(); });
    if (dialog) dialog.addEventListener('close', () => dialog.querySelector('[data-player]').replaceChildren());
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey));
      if (cached?.base === base.href) {
        catalog.accept(cached.manifest);
        if (cached.manifest.videos.length) { record = cached; stale = true; }
      }
    } catch {
      try { localStorage.removeItem(cacheKey); } catch { /* Cache storage is optional. */ }
    }
    reloadOptions();
    paint();
    try {
      const response = await fetch(new URL('content/videos.json',base),{cache:'no-cache',signal:AbortSignal.timeout(8000)});
      if (!response.ok) throw Error('Catalog unavailable');
      const manifest = catalog.accept(await response.json());
      if (record && catalog.isOlder(manifest,record.manifest)) throw Error('Older catalog');
      record = {base:base.href,source:'website',received:Date.now(),manifest};
      stale = false;
      try { localStorage.setItem(cacheKey,JSON.stringify(record)); } catch { /* Continue with in-memory data. */ }
    } catch { failed = !record; stale = !!record; }
    loading = false;
    reloadOptions();
    paint();
  }
  window.CashlyYT = {renderInto};
})();
