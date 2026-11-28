import {readFile, writeFile, rename, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {validateManifest} from './validate-manifest.mjs';
import {createYouTubeApi} from './youtube-api.mjs';

const defaultCatalog = fileURLToPath(new URL('../content/videos.json', import.meta.url));
const defaultOverrides = new URL('../content/video-overrides.json', import.meta.url);
const handle = '@cashlybyVKS';
const expectedTitle = 'Cashly by VKS';
const channelCandidate = 'UCfhIm-gZXMWel81oPMSm2qQ';
const channelId = /^UC[A-Za-z0-9_-]{22}$/;
const videoId = /^[A-Za-z0-9_-]{11}$/;
const playlistId = /^[A-Za-z0-9_-]{2,128}$/;
const refreshInterval = 23 * 86400000;

export function durationSeconds(value) {
  const parts = /^P(?:(\d+)D)?(?:T(?=\d)(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value);
  if (!parts || !parts.slice(1).some(Boolean)) return null;
  const [days, hours, minutes, seconds] = parts.slice(1).map(unit => Number(unit || 0));
  const duration = ((days * 24 + hours) * 60 + minutes) * 60 + seconds;
  return Number.isSafeInteger(duration) ? duration : null;
}

function officialTime(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : undefined;
}
function thumbnails(snippet) {
  const images = Object.fromEntries(Object.entries(snippet.thumbnails || {}).sort(([a],[b]) => a.localeCompare(b))
    .filter(([, image]) => globalThis.CashlyCatalog.thumbnail(image?.url)).map(([size, image]) => [size, image.url]));
  const thumbnail = images.maxres || images.standard || images.high || images.medium || images.default || Object.values(images)[0] || null;
  return {thumbnail, thumbnails:images};
}
function liveDetails(video) {
  const times = Object.fromEntries(['scheduledStartTime','actualStartTime','actualEndTime']
    .map(key => [key, officialTime(video.liveStreamingDetails?.[key])]).filter(([, value]) => !!value));
  const status = video.snippet.liveBroadcastContent ?? 'none';
  if (!['none','upcoming','live'].includes(status)) throw Error('videos MALFORMED_LIVE_STATUS');
  const liveStatus = times.actualEndTime ? 'recorded' : status;
  return {liveStatus,...times};
}

export function videoRecord(video, expected, shorts, overrides) {
  const {id, snippet:info, status, contentDetails} = video;
  if (!videoId.test(id || '') || !info || !status || typeof status.privacyStatus !== 'string') throw Error('videos MALFORMED_ITEM');
  if (info.channelId !== expected || status.privacyStatus !== 'public' ||
      ['failed','rejected','deleted'].includes(status.uploadStatus)) return null;
  const live = liveDetails(video);
  if (live.liveStatus === 'none' && status.uploadStatus && status.uploadStatus !== 'processed') return null;
  const active = live.liveStatus === 'live' || live.liveStatus === 'upcoming';
  const duration = durationSeconds(contentDetails?.duration || '');
  if (active === false && !duration) {
    if (live.liveStatus === 'recorded' && status.uploadStatus !== 'processed') return null;
    throw Error('videos MALFORMED_DURATION');
  }
  const publishedAt = officialTime(info.publishedAt);
  if (!publishedAt || typeof info.title !== 'string' || !info.title.trim() || typeof status.embeddable !== 'boolean') {
    throw Error('videos MALFORMED_ITEM');
  }
  if (info.tags !== undefined && (!Array.isArray(info.tags) || info.tags.some(tag => typeof tag !== 'string'))) {
    throw Error('videos MALFORMED_TAGS');
  }
  const override = overrides[id] || {};
  const defaultLanguage = typeof info.defaultLanguage === 'string' && info.defaultLanguage || undefined;
  const defaultAudioLanguage = typeof info.defaultAudioLanguage === 'string' && info.defaultAudioLanguage || undefined;
  return {
    id, channelId:expected, channelTitle:info.channelTitle || undefined, title:info.title,
    description:info.description || '', publishedAt, ...thumbnails(info), durationSeconds:duration,
    defaultLanguage, defaultAudioLanguage, language:override.language || defaultAudioLanguage || defaultLanguage || 'und',
    tags:[...new Set([...(info.tags || []), ...(override.tags || [])])],
    ...(override.tools ? {tools:override.tools} : {}),
    categoryId:info.categoryId, availability:'public', ...live,
    contentType:override.contentType || (shorts.has(id) ? 'short' : 'unknown'),
    classificationSource:override.contentType ? 'creator-override' : shorts.has(id) ? 'creator-playlist' : 'unknown',
    embeddable:status.embeddable, watchUrl:'https://www.youtube.com/watch?v=' + id
  };
}

export async function resolveChannel(api, expected, verifyHandle = true) {
  if (!channelId.test(expected)) throw Error('Invalid YOUTUBE_CHANNEL_ID. Use the immutable UC channel ID.');
  async function lookup(filter) {
    const {items} = await api.request('channels',{...filter,part:'snippet,contentDetails'});
    if (items.length === 0) throw Error('channels CHANNEL_NOT_FOUND');
    const [channel] = items;
    if (items.length !== 1 || channel?.id !== expected) throw Error('channels CHANNEL_IDENTITY_MISMATCH');
    if (typeof channel.snippet?.title !== 'string' || channel.snippet.title.trim().toLowerCase() !== expectedTitle.toLowerCase()) {
      throw Error('channels CHANNEL_TITLE_MISMATCH');
    }
    if (typeof channel.contentDetails?.relatedPlaylists?.uploads !== 'string' ||
        !playlistId.test(channel.contentDetails.relatedPlaylists.uploads)) throw Error('channels UPLOADS_PLAYLIST_MISSING');
    return channel;
  }
  const channel = await lookup({id:expected});
  const custom = channel.snippet.customUrl;
  if (typeof custom === 'string' && custom.startsWith('@') && custom.toLowerCase() !== handle.toLowerCase()) {
    throw Error('channels CHANNEL_HANDLE_MISMATCH');
  }
  if (verifyHandle && (typeof custom !== 'string' || custom.toLowerCase() !== handle.toLowerCase())) {
    await lookup({forHandle:handle.slice(1)});
  }
  return channel;
}

async function playlistVideos(api, id) {
  const items = await api.paginate('playlistItems', {playlistId:id,part:'snippet,contentDetails'});
  return [...new Set(items.map(item => {
    const video = item?.contentDetails?.videoId;
    if (typeof video !== 'string' || !videoId.test(video)) throw Error('playlistItems MALFORMED_VIDEO_ID');
    return video;
  }))];
}

async function listPublicPlaylists(api, channel, uploads) {
  const items = await api.paginate('playlists',{channelId:channel,part:'snippet,status,contentDetails'});
  const byId = new Map();
  for (const item of items) {
    const {id, snippet, status, contentDetails} = item || {};
    if (!playlistId.test(id || '') || !snippet || !status?.privacyStatus) throw Error('playlists MALFORMED_ITEM');
    if (id === uploads || snippet.channelId !== channel || status.privacyStatus !== 'public' || byId.has(id)) continue;
    if (typeof snippet.title !== 'string' || !snippet.title.trim()) throw Error('playlists MALFORMED_ITEM');
    byId.set(id, {id,title:snippet.title,description:snippet.description || '',thumbnail:thumbnails(snippet).thumbnail,
      videoCount:contentDetails?.itemCount, videoIds:await playlistVideos(api,id)});
  }
  return [...byId.values()].sort((a,b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
}

async function discoverBroadcasts(api, channel) {
  const found = new Set();
  for (const eventType of ['live','upcoming']) {
    const hits = await api.paginate('search',{part:'snippet',channelId:channel,type:'video',eventType},{verifyTotal:false});
    for (const hit of hits) {
      if (!videoId.test(hit?.id?.videoId || '')) throw Error('search MALFORMED_VIDEO_ID');
      found.add(hit.id.videoId);
    }
  }
  return found;
}

async function readVideos(api, ids) {
  async function batch(wanted) {
    const id = wanted.join(',');
    const {items} = await api.request('videos', {id,part:'snippet,contentDetails,status,liveStreamingDetails'});
    const result = new Map();
    for (const item of items) {
      if (!wanted.includes(item?.id) || result.has(item.id)) throw Error('videos UNEXPECTED_BATCH_ITEM');
      result.set(item.id,item);
    }
    return result;
  }
  const all = [];
  for (let offset = 0; offset < ids.length; offset += 50) {
    const wanted = ids.slice(offset,offset + 50);
    const found = await batch(wanted);
    const missing = wanted.filter(id => !found.has(id));
    // A second successful lookup distinguishes omissions from a failed or truncated request.
    if (missing.length) for (const [id, item] of await batch(missing)) found.set(id,item);
    all.push(...found.values());
  }
  return all;
}

function checkOverrides(overrides) {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) throw Error('Invalid creator overrides');
  for (const [id, entry] of Object.entries(overrides)) {
    if (!videoId.test(id) || !entry || typeof entry !== 'object' || Array.isArray(entry) ||
      (entry.contentType && !['short','video','unknown'].includes(entry.contentType)) ||
      (entry.language && !/^(?:mixed|hinglish|[a-z]{2,3}(?:-[\w]+)*)$/i.test(entry.language)) ||
      (entry.tools && (!Array.isArray(entry.tools) || entry.tools.some(tool => !['retire-today','retirement','sip','emi','inflation','budget','spends'].includes(tool)))) ||
      (entry.tags && (!Array.isArray(entry.tags) || entry.tags.some(tag => typeof tag !== 'string')))) throw Error('Invalid creator override');
  }
  return overrides;
}
async function readJson(file) {
  try { return JSON.parse(await readFile(file,'utf8')); }
  catch { throw Error('Catalog or creator overrides file is missing or invalid'); }
}
async function writeCatalog(file, catalog) {
  const temp = file + '.' + randomUUID() + '.tmp';
  try {
    await writeFile(temp,JSON.stringify(catalog,null,2) + '\n',{flag:'wx'});
    await rename(temp,file);
  } catch {
    throw Error('Atomic catalog replacement failed');
  } finally { await rm(temp,{force:true}).catch(() => {}); }
}
async function summary(lines) {
  if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY,lines.join('\n')+'\n',{flag:'a'});
}

export async function sync({api = createYouTubeApi(process.env.YOUTUBE_API_KEY),
  expected = (process.env.YOUTUBE_CHANNEL_ID || '').trim() || channelCandidate,
  catalogFile = process.env.CASHLY_CATALOG_PATH || defaultCatalog, overridesFile = defaultOverrides,
  shortsPlaylist = (process.env.YOUTUBE_SHORTS_PLAYLIST_ID || '').trim(),
  allowEmpty = process.env.ALLOW_EMPTY_CATALOG === 'true', previousPublication = process.env.CASHLY_PREVIOUS_PUBLICATION} = {}) {
  const previous = validateManifest(await readJson(catalogFile));
  const overrides = checkOverrides(await readJson(overridesFile));
  if (previous.channelId && previous.channelId !== expected) throw Error('Existing catalog channel does not match YOUTUBE_CHANNEL_ID');
  const channel = await resolveChannel(api,expected,!previous.identityVerifiedAt);
  const uploads = channel.contentDetails.relatedPlaylists.uploads;
  const ids = await playlistVideos(api,uploads);
  const playlists = await listPublicPlaylists(api,channel.id,uploads);
  const shortGroup = playlists.find(playlist => playlist.id === shortsPlaylist);
  if (shortsPlaylist && !shortGroup) throw Error('YOUTUBE_SHORTS_PLAYLIST_ID must identify a public playlist on the verified channel');
  const shorts = new Set(shortGroup?.videoIds || []);
  const live = await discoverBroadcasts(api,channel.id);
  const allIds = [...new Set([...ids,...live,...playlists.flatMap(playlist => playlist.videoIds)])];
  const records = await readVideos(api,allIds);
  const videos = records.map(video => videoRecord(video,channel.id,shorts,overrides)).filter(Boolean);
  if (!videos.length && !allowEmpty) throw Error('Verified empty feed requires manual approval');
  const byId = new Map(videos.map(video => {
    video.channelTitle ||= channel.snippet.title;
    video.playlistIds = [];
    return [video.id,video];
  }));
  for (const playlist of playlists) {
    playlist.videoIds = playlist.videoIds.filter(id => byId.has(id));
    for (const id of playlist.videoIds) byId.get(id).playlistIds.push(playlist.id);
  }
  videos.sort((a,b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
  const payload = JSON.parse(JSON.stringify({schemaVersion:1,channelId:channel.id,channelName:channel.snippet.title,handle,videos,playlists}));
  const {lastSuccessfulSync,lastContentChange,lastSuccessfulPublication,identityVerifiedAt,...oldPayload} = previous;
  const changed = !isDeepStrictEqual(payload,oldPayload);
  const checkedAt = new Date().toISOString();
  const {apiCalls,searchCalls} = api.counts();
  const counts = 'Verified ' + videos.length + ' public videos and ' + playlists.length + ' public playlists. Uploads: ' + ids.length +
    ' distinct IDs. API calls: ' + apiCalls + ' + ' + searchCalls + ' search.';
  console.log(counts);
  await summary(['YouTube API verification: ' + checkedAt, 'Channel: ' + channel.id + ' (' + expectedTitle + ')',
    'Uploads playlist: ' + uploads, counts, 'Editorial catalog changed: ' + changed]);
  if (!changed && Date.now() - Date.parse(lastSuccessfulSync) < refreshInterval) return false;
  const result = validateManifest({...payload,identityVerifiedAt:identityVerifiedAt || checkedAt,lastSuccessfulSync:checkedAt,
    lastContentChange:changed ? checkedAt : lastContentChange || lastSuccessfulSync,
    lastSuccessfulPublication:officialTime(previousPublication) || lastSuccessfulPublication || null});
  await writeCatalog(catalogFile,result);
  console.log('Validated catalog generated.');
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv[2] === '--resolve-channel') {
      const api = createYouTubeApi(process.env.YOUTUBE_API_KEY);
      const expected = (process.env.YOUTUBE_CHANNEL_ID || '').trim() || channelCandidate;
      const channel = await resolveChannel(api,expected);
      const message = JSON.stringify({handle,id:channel.id,title:channel.snippet.title,uploads:channel.contentDetails.relatedPlaylists.uploads});
      console.log(message);
      await summary(['Authenticated channel verified: ' + message]);
    } else await sync();
  } catch (error) {
    const key = (process.env.YOUTUBE_API_KEY || '').trim();
    const reason = key ? error.message.replaceAll(key,'[redacted]') : error.message;
    const safe = reason.replace(/AIza[A-Za-z0-9_-]{12,}/g,'[redacted]');
    if (process.env.GITHUB_ACTIONS === 'true') {
      console.log('::error title=Cashly YouTube::' + safe.replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A'));
    } else console.error(safe);
    process.exitCode = 1;
  }
}
