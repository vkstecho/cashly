import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export function validateManifest(data){
  const invalid=()=>{throw Error('Invalid YouTube catalog');};
  if(data?.schemaVersion!==1||!Array.isArray(data.videos)||
    typeof data.handle!=='string'||!/^@[\w.-]+$/.test(data.handle)||typeof data.channelName!=='string'||!data.channelName.trim()||
    (data.channelId!==null&&!/^UC[\w-]{22}$/.test(data.channelId))||
    (data.videos.length&&!data.channelId)||
    (data.lastSuccessfulSync!==null&&!Number.isFinite(Date.parse(data.lastSuccessfulSync))))invalid();
  const seen=new Set();
  for(const item of data.videos){
    if(!item||!/^[\w-]{11}$/.test(item.id)||seen.has(item.id)||typeof item.title!=='string'||!item.title.trim()||
      typeof item.description!=='string'||!Number.isFinite(Date.parse(item.publishedAt))||
      !/^https:\/\/i\.ytimg\.com\/vi(?:_webp)?\/[\w/-]+\.(?:jpg|webp)$/.test(item.thumbnail)||
      !Number.isSafeInteger(item.durationSeconds)||item.durationSeconds<=0||
      typeof item.language!=='string'||!item.language||!['short','video','unknown'].includes(item.contentType)||
      !['creator-override','creator-playlist','unknown'].includes(item.classificationSource)||
      typeof item.embeddable!=='boolean'||item.watchUrl!=='https://www.youtube.com/watch?v='+item.id)invalid();
    seen.add(item.id);
  }
  return data;
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
  validateManifest(JSON.parse(await readFile(process.argv[2]||'content/videos.json','utf8')));
}
