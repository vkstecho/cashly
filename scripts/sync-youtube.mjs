import { readFile, writeFile, rename } from 'node:fs/promises';
import { validateManifest } from './validate-manifest.mjs';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const manifest = process.env.CASHLY_CATALOG_PATH || new URL('../content/videos.json', import.meta.url);
const overridesFile = new URL('../content/video-overrides.json', import.meta.url);
const handle = process.env.YOUTUBE_CHANNEL_HANDLE || '@cashlybyVks';
const refreshInterval = 23 * 86400000;

export function durationSeconds(value) {
  const match = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value);
  if (!match || !match.slice(1).some(Boolean)) return null;
  return (Number(match[1]) || 0) * 86400 + (Number(match[2]) || 0) * 3600
    + (Number(match[3]) || 0) * 60 + (Number(match[4]) || 0);
}
export function videoRecord(video, channelId, shorts, overrides) {
  const { id, snippet: info, status, contentDetails } = video;
  if (!/^[\w-]{11}$/.test(id) || info?.channelId !== channelId || status?.privacyStatus !== 'public'
      || status.uploadStatus !== 'processed' || info.liveBroadcastContent !== 'none') return null;
  const duration = durationSeconds(contentDetails?.duration || '');
  if (!duration || !info.title || !Number.isFinite(Date.parse(info.publishedAt))) return null;
  const override = overrides[id] || {};
  return {
    id, title: info.title, description: info.description || '', publishedAt: info.publishedAt,
    thumbnail: [info.thumbnails?.high?.url,info.thumbnails?.medium?.url,info.thumbnails?.default?.url].find(
      url=>typeof url==='string'&&/^https:\/\/i\.ytimg\.com\/vi(?:_webp)?\/[\w/-]+\.(?:jpg|webp)$/.test(url))
      || 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg', durationSeconds: duration,
    language: override.language || info.defaultAudioLanguage || info.defaultLanguage || 'und',
    ...(Array.isArray(override.tools)?{tools:override.tools}:{}),
    ...(Array.isArray(override.tags)?{tags:override.tags}:{}),
    contentType: override.contentType || (shorts.has(id) ? 'short' : 'unknown'),
    classificationSource: override.contentType ? 'creator-override' : shorts.has(id) ? 'creator-playlist' : 'unknown',
    embeddable: status.embeddable === true, watchUrl: 'https://www.youtube.com/watch?v=' + id
  };
}

async function request(endpoint, params) {
  const key = (process.env.YOUTUBE_API_KEY || '').trim();
  if (!key) throw Error('Set YOUTUBE_API_KEY in the execution environment');
  const query = new URLSearchParams({...params, key});
  for (let attempt = 0; attempt < 3; attempt++) {
    let response;
    try {
      response = await fetch('https://www.googleapis.com/youtube/v3/' + endpoint + '?' + query,
        { redirect: 'error', signal: AbortSignal.timeout(15000) });
      if (response.ok) {
        const result = await response.json();
        if (!Array.isArray(result.items)) throw Error('Malformed API response');
        return result;
      }
    } catch {
      if (attempt === 2) throw Error(endpoint + ' request failed');
    }
    if (response && response.status !== 429 && response.status < 500) {
      // Report only structured reason codes, never the response message, URL or key.
      let reasons = [];
      try {
        const body = await response.json();
        const error = body?.error;
        reasons = [error?.status, ...(Array.isArray(error?.errors) ? error.errors.map(e => e?.reason) : []),
          ...(Array.isArray(error?.details) ? error.details.map(e => e?.reason) : [])]
          .filter(code => typeof code === 'string' && /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(code)
            && !code.includes('AIza') && code !== key);
      } catch { /* status remains available even if the error body is not JSON */ }
      throw Error(endpoint + ' returned HTTP ' + response.status +
        (reasons.length ? ' (' + [...new Set(reasons)].join(', ') + ')' : ''));
    }
    await new Promise(resolve => setTimeout(resolve, 500 * 2 ** attempt));
  }
  throw Error(endpoint + ' retries exhausted');
}

async function playlist(playlistId, pages = Infinity) {
  const ids = new Set();
  let pageToken;
  do {
    const data = await request('playlistItems', {
      playlistId, part: 'contentDetails', maxResults: '50', ...(pageToken ? { pageToken } : {})
    });
    for (const item of data.items) {
      const id = item.contentDetails?.videoId;
      if (/^[\w-]{11}$/.test(id)) ids.add(id);
    }
    pageToken = data.nextPageToken;
  } while (pageToken && --pages > 0);
  return [...ids];
}

export async function resolveChannel() {
  if (!process.env.YOUTUBE_API_KEY) throw Error('Set YOUTUBE_API_KEY in the execution environment');
  if (handle.toLowerCase() !== '@cashlybyvks') throw Error('Use the official @cashlybyVKS handle');
  const expected = (process.env.YOUTUBE_CHANNEL_ID || '').trim();
  if (expected && !/^UC[\w-]{22}$/.test(expected)) throw Error('Invalid creator-verified YOUTUBE_CHANNEL_ID');
  // Prefer the permanent, owner-confirmed channel ID. Handle lookup is bootstrap-only.
  const criteria = expected ? {id: expected} : {forHandle: handle.slice(1)};
  const {items} = await request('channels', {...criteria, part: 'snippet,contentDetails'});
  const [channel] = items;
  const title = channel?.snippet?.title;
  if (items.length !== 1 || !/^UC[\w-]{22}$/.test(channel?.id) || typeof title !== 'string' || !title.trim()) {
    throw Error('Channel lookup did not resolve to one public YouTube channel');
  }
  if (expected && channel.id !== expected) throw Error('API response does not match the creator-verified channel');
  return channel;
}

export async function sync() {
  if (!process.env.YOUTUBE_API_KEY) throw Error('Set YOUTUBE_API_KEY in the execution environment');
  const expected = (process.env.YOUTUBE_CHANNEL_ID || '').trim();
  if (!/^UC[\w-]{22}$/.test(expected || '')) throw Error('Set the creator-verified YOUTUBE_CHANNEL_ID');
  const previous = validateManifest(JSON.parse(await readFile(manifest, 'utf8')));
  const overrides = JSON.parse(await readFile(overridesFile, 'utf8'));
  for (const [id, entry] of Object.entries(overrides)) {
    if (!/^[\w-]{11}$/.test(id) || !entry || (entry.contentType && !['short', 'video', 'unknown'].includes(entry.contentType))
        || (entry.language&&!['mixed','hinglish'].includes(entry.language)&&!/^[a-z]{2,3}(?:-[\w]+)*$/i.test(entry.language))
        ||(entry.tools&&(!Array.isArray(entry.tools)||entry.tools.some(tool=>!['retire-today','retirement','sip','emi','inflation','budget','spends'].includes(tool))))
        ||(entry.tags&&(!Array.isArray(entry.tags)||entry.tags.some(tag=>typeof tag!=='string')))) throw Error('Invalid creator override');
  }
  const channel = await resolveChannel();
  if (channel.id !== expected || (previous.channelId && channel.id !== previous.channelId)) {
    throw Error('Channel does not match the creator-verified channel');
  }
  const uploads = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw Error('Channel uploads playlist unavailable');
  // Full pagination every run also reconciles deleted and unavailable items.
  const ids = await playlist(uploads);
  const shorts = new Set(process.env.YOUTUBE_SHORTS_PLAYLIST_ID
    ? await playlist(process.env.YOUTUBE_SHORTS_PLAYLIST_ID) : []);
  const videos = [];
  for (let i = 0; i < ids.length; i += 50) {
    const { items: batch } = await request('videos', {
      id: ids.slice(i, i + 50).join(','), part: 'snippet,status,contentDetails'
    });
    videos.push(...batch.map(video => videoRecord(video, channel.id, shorts, overrides)).filter(Boolean));
  }
  if (!videos.length && process.env.ALLOW_EMPTY_CATALOG !== 'true') throw Error('Verified empty feed requires manual approval');
  videos.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
  const payload = { schemaVersion: 1, channelId: channel.id, handle, channelName: channel.snippet.title, videos };
  const checkedAt=new Date().toISOString();
  const {lastSuccessfulSync,lastContentChange,...oldPayload}=previous;
  const contentChanged=!isDeepStrictEqual(payload,oldPayload);
  if(process.env.GITHUB_STEP_SUMMARY)await writeFile(process.env.GITHUB_STEP_SUMMARY,
    'YouTube API verification: '+checkedAt+'\n\nCatalog changed: '+contentChanged+'\n',{flag:'a'});
  // Renew the verification stamp in time for the app's 30-day freshness limit.
  if(!contentChanged&&Date.now()-Date.parse(lastSuccessfulSync)<refreshInterval)return;
  const result=validateManifest({...payload,lastSuccessfulSync:checkedAt,lastContentChange:contentChanged?checkedAt:lastContentChange||lastSuccessfulSync});
  const temporary=typeof manifest==="string"?manifest+".tmp":new URL('./videos.json.tmp',manifest);
  await writeFile(temporary,JSON.stringify(result,null,2)+'\n');
  await rename(temporary,manifest);

}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const command = process.argv[2] === '--resolve-channel'
    ? resolveChannel().then(channel => console.log(JSON.stringify({handle, id:channel.id, title:channel.snippet.title})))
    : sync();
  command.catch(error => { console.error(error.message); process.exitCode = 1; });
}
