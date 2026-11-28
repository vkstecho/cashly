const reasons = new Set([
  'API_KEY_INVALID','API_KEY_EXPIRED','API_KEY_SERVICE_BLOCKED','API_KEY_HTTP_REFERRER_BLOCKED',
  'API_KEY_IP_ADDRESS_BLOCKED','API_KEY_ANDROID_APP_BLOCKED','API_KEY_IOS_APP_BLOCKED',
  'SERVICE_DISABLED','BILLING_DISABLED','INVALID_ARGUMENT','PERMISSION_DENIED','RESOURCE_EXHAUSTED','NOT_FOUND',
  'keyInvalid','accessNotConfigured','ipRefererBlocked','forbidden','badRequest','invalidCriteria',
  'invalidFilters','invalidParameter','incompatibleParameters','missingRequiredParameter',
  'invalidPageToken','channelNotFound','playlistNotFound','videoNotFound','quotaExceeded','dailyLimitExceeded',
  'rateLimitExceeded','userRateLimitExceeded','backendError','internalError'
]);
const rateLimits = ['rateLimitExceeded', 'userRateLimitExceeded'];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function errorCodes(response) {
  try {
    const {error} = await response.json();
    return [...new Set([error?.status, ...(Array.isArray(error?.errors) ? error.errors.map(e => e?.reason) : []),
      ...(Array.isArray(error?.details) ? error.details.map(e => e?.reason) : [])].filter(code => reasons.has(code)))];
  } catch { return []; }
}

export function createYouTubeApi(key, {fetcher = fetch, wait = delay, searchLimit = 4, apiLimit = 300} = {}) {
  key = (key || '').trim();
  if (!key) throw Error('Missing repository secret YOUTUBE_API_KEY');
  let searchCalls = 0, apiCalls = 0;
  async function request(endpoint, params) {
    const url = new URL('https://www.googleapis.com/youtube/v3/' + endpoint);
    url.search = new URLSearchParams({...params, key}).toString();
    for (let attempt = 0; attempt < 3; attempt++) {
      if (endpoint === 'search' ? ++searchCalls > searchLimit : ++apiCalls > apiLimit) {
        throw Error(endpoint + ' daily-quota safety limit reached for this run');
      }
      let response, transport;
      try { response = await fetcher(url, {redirect:'error',signal:AbortSignal.timeout(15000)}); }
      catch (error) { transport = error?.name === 'TimeoutError' || error?.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_FAILURE'; }
      if (response?.ok) {
        try {
          const payload = await response.json();
          if (Array.isArray(payload?.items)) return payload;
        } catch { /* Do not expose malformed or credential-bearing response data. */ }
        throw Error(endpoint + ' MALFORMED_RESPONSE');
      }
      const codes = response ? await errorCodes(response) : [];
      const status = response?.status;
      const safeFailure = endpoint + (transport ? ' ' + transport
        : ' returned HTTP ' + status + (codes.length ? ' (' + codes.join(', ') + ')' : ''));
      const retry = transport || status === 408 || status === 429 || status >= 500
        || (status === 403 && codes.some(code => rateLimits.includes(code)));
      if (!retry || attempt === 2) throw Error(safeFailure);
      const retryAfter = Number(response?.headers.get('retry-after')) * 1000;
      await wait(Math.max(500 * 2 ** attempt, Math.min(5000, retryAfter || 0)));
    }
  }
  async function paginate(endpoint, params, {verifyTotal = true} = {}) {
    const items = [], tokens = new Set();
    let pageToken, total;
    do {
      const page = await request(endpoint, {...params,maxResults:'50',...(pageToken ? {pageToken} : {})});
      items.push(...page.items);
      if (verifyTotal && total === undefined) total = page.pageInfo?.totalResults;
      pageToken = page.nextPageToken;
      if (pageToken !== undefined && (typeof pageToken !== 'string' || !pageToken || tokens.has(pageToken))) {
        throw Error(endpoint + ' INVALID_PAGINATION');
      }
      tokens.add(pageToken);
    } while (pageToken);
    if (Number.isSafeInteger(total) && items.length < total) throw Error(endpoint + ' INCOMPLETE_PAGINATION');
    return items;
  }
  return {request,paginate,counts:() => ({apiCalls,searchCalls})};
}
