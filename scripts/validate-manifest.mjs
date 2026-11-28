import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import '../app/js/video-catalog.js';
export const validateManifest = globalThis.CashlyCatalog.validate;
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    validateManifest(JSON.parse(await readFile(process.argv[2] || 'content/videos.json','utf8')));
  } catch {
    console.error('YouTube catalog file is missing or invalid.');
    process.exitCode = 1;
  }
}
