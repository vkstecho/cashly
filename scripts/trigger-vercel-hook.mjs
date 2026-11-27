import {pathToFileURL} from 'node:url';

export function deployHookUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw Error('A valid Vercel Deploy Hook secret is required'); }
  if (url.origin !== 'https://api.vercel.com' || url.username || url.password || url.search || url.hash
    || !/^\/v1\/integrations\/deploy\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/.test(url.pathname)) {
    throw Error('A valid Vercel Deploy Hook secret is required');
  }
  return url;
}

export async function triggerDeployHook(value, request = fetch) {
  const url = deployHookUrl(value);
  let response;
  try {
    response = await request(url, {method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000)});
  } catch {
    throw Error('Vercel Deploy Hook request failed. Check Vercel before retrying.');
  }
  if (!response.ok) throw Error('Vercel Deploy Hook returned HTTP ' + response.status);
  const payload = await response.json().catch(() => null);
  if (typeof payload?.job?.id !== 'string' || !payload.job.id) {
    throw Error('Vercel Deploy Hook acceptance was not confirmed. Check Vercel before retrying.');
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    const value = process.env.VERCEL_DEPLOY_HOOK_URL;
    if (process.argv[2] === '--check') deployHookUrl(value);
    else {
      await triggerDeployHook(value);
      console.log('Vercel accepted the deployment request. Verify the deployment commit in Vercel.');
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
