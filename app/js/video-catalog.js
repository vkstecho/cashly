/* Public YouTube metadata shared by the website, Learn and the build validator. */
(function (root) {
  'use strict';
  const videoId = /^[A-Za-z0-9_-]{11}$/;
  const channelId = /^UC[A-Za-z0-9_-]{22}$/;
  const playlistId = /^[A-Za-z0-9_-]{2,128}$/;
  const liveStates = ['none', 'live', 'upcoming', 'recorded'];
  const tools = ['retire-today', 'retirement', 'sip', 'emi', 'inflation', 'budget', 'spends'];
  const stamp = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
  const count = value => Number.isSafeInteger(value) && value >= 0;
  const strings = value => Array.isArray(value) && value.every(entry => typeof entry === 'string');
  const optional = (value, check) => value === undefined || check(value);
  const nullable = (value, check) => value === null || check(value);
  function thumbnail(value) {
    if (typeof value !== 'string') return false;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password && !url.port &&
        /^(?:i[0-9]?\.ytimg\.com|img\.youtube\.com)$/.test(url.hostname) &&
        /\.(?:jpe?g|webp|png)$/i.test(url.pathname);
    } catch { return false; }
  }
  function validate(data) {
    const invalid = () => { throw Error('Invalid YouTube catalog'); };
    if (data?.schemaVersion !== 1 || !Array.isArray(data.videos) ||
        typeof data.handle !== 'string' || !/^@[\w.-]+$/.test(data.handle) ||
        typeof data.channelName !== 'string' || !data.channelName.trim() ||
        !nullable(data.channelId, id => typeof id === 'string' && channelId.test(id)) ||
        (data.videos.length && !data.channelId) || !nullable(data.lastSuccessfulSync, stamp) ||
        !['lastContentChange','lastSuccessfulPublication','identityVerifiedAt'].every(key => optional(data[key], value => nullable(value, stamp)))) invalid();
    const videos = new Map();
    for (const item of data.videos) {
      const state = item?.liveStatus ?? 'none', active = state === 'live' || state === 'upcoming';
      if (!item || typeof item.id !== 'string' || !videoId.test(item.id) || videos.has(item.id) ||
          typeof item.title !== 'string' || !item.title.trim() || typeof item.description !== 'string' || !stamp(item.publishedAt) ||
          !nullable(item.thumbnail, thumbnail) || !liveStates.includes(state) ||
          !(active ? nullable(item.durationSeconds, count) : count(item.durationSeconds) && item.durationSeconds > 0) ||
          typeof item.language !== 'string' || !item.language ||
          !['short','video','unknown'].includes(item.contentType) ||
          !['creator-override','creator-playlist','unknown'].includes(item.classificationSource) ||
          typeof item.embeddable !== 'boolean' || item.watchUrl !== 'https://www.youtube.com/watch?v=' + item.id ||
          !optional(item.channelId, id => id === data.channelId) || !optional(item.channelTitle, title => typeof title === 'string' && !!title.trim()) ||
          !optional(item.availability, value => value === 'public') ||
          !optional(item.categoryId, value => typeof value === 'string' && /^\d+$/.test(value)) ||
          !['defaultLanguage','defaultAudioLanguage'].every(key => optional(item[key], value => typeof value === 'string' && !!value)) ||
          !optional(item.thumbnails, value => value && typeof value === 'object' && !Array.isArray(value) && Object.values(value).every(thumbnail)) ||
          !['scheduledStartTime','actualStartTime','actualEndTime'].every(key => optional(item[key], stamp)) ||
          !optional(item.tags, strings) || !optional(item.tools, value => strings(value) && value.every(tool => tools.includes(tool))) ||
          !optional(item.playlistIds, strings)) invalid();
      videos.set(item.id, item);
    }
    const playlists = new Map();
    if (!optional(data.playlists, Array.isArray)) invalid();
    for (const playlist of data.playlists || []) {
      if (!data.channelId || !playlist || typeof playlist.id !== 'string' || !playlistId.test(playlist.id) || playlists.has(playlist.id) ||
          typeof playlist.title !== 'string' || !playlist.title.trim() || typeof playlist.description !== 'string' ||
          !nullable(playlist.thumbnail, thumbnail) || !optional(playlist.videoCount, count) || !strings(playlist.videoIds) ||
          new Set(playlist.videoIds).size !== playlist.videoIds.length || playlist.videoIds.some(id => !videos.has(id))) invalid();
      playlists.set(playlist.id, new Set(playlist.videoIds));
    }
    for (const [id, item] of videos) {
      if (item.playlistIds && (new Set(item.playlistIds).size !== item.playlistIds.length ||
          item.playlistIds.some(key => !playlists.get(key)?.has(id)))) invalid();
    }
    for (const [key, ids] of playlists) for (const id of ids) {
      const membership = videos.get(id).playlistIds;
      if (membership && !membership.includes(key)) invalid();
    }
    return data;
  }
  function accept(data, now = Date.now()) {
    validate(data);
    const age = now - Date.parse(data.lastSuccessfulSync);
    if (data.videos.length && (!Number.isFinite(age) || age >= 30 * 86400000 || age < -86400000)) throw Error('Catalog expired');
    return data;
  }
  function languages(values) {
    const result = new Set();
    for (const value of values) {
      const code = String(value).toLowerCase().replace(/_/g, '-');
      if (['mixed','hi-en','en-hi','hinglish','hi-latn'].includes(code)) { result.add('hi'); result.add('en'); }
      else if (/^(en|hi)(-|$)/.test(code)) result.add(code.slice(0, 2));
    }
    return [...result];
  }
  function duration(value) {
    if (!value) return '';
    const h = Math.floor(value / 3600), m = Math.floor(value % 3600 / 60), s = String(value % 60).padStart(2, '0');
    return h ? h + ':' + String(m).padStart(2, '0') + ':' + s : m + ':' + s;
  }
  function liveLabel(item, verification, now = Date.now()) {
    if (item.liveStatus === 'recorded') return 'Recorded';
    const recent = Number.isFinite(Date.parse(verification)) && now - Date.parse(verification) <= 2 * 3600000;
    if (item.liveStatus === 'live') return recent ? 'LIVE · last checked ' + new Date(verification).toLocaleTimeString() : 'Live status unconfirmed';
    if (item.liveStatus === 'upcoming') {
      const schedule = Date.parse(item.scheduledStartTime);
      const label = recent && (!Number.isFinite(schedule) || schedule > now) ? 'Upcoming' : 'Schedule unconfirmed';
      return label + (Number.isFinite(schedule) ? ' · ' + new Date(schedule).toLocaleString() : '');
    }
    return '';
  }
  function isOlder(next, previous) {
    const oldTime = Date.parse(previous?.lastSuccessfulSync), newTime = Date.parse(next.lastSuccessfulSync);
    return Number.isFinite(oldTime) && (!Number.isFinite(newTime) || newTime < oldTime);
  }
  root.CashlyCatalog = Object.freeze({validate, accept, thumbnail, languages, duration, liveLabel, isOlder});
})(globalThis);
