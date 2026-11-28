/* Learn catalogs contain public editorial metadata only. */
var learnFeed={articles:[],videos:[]},learnStatus={articles:"idle",videos:"idle"};
var learnFilter="all",learnLanguage="all",learnQuery="",learnItem=null,learnSavedQuery="",learnLastRefresh=0;
var learnTabs=[["all","All"],["video","Videos"],["short","Shorts"],["article","Blogs"]];
var learnOfficial="https://youtube.com/@cashlybyVKS";
var learnOrigin=new URL(window.CASHLY_CONTENT_BASE||"https://cashly.vkstech.com/");
if(learnOrigin.protocol!=="https:")learnOrigin=new URL("https://cashly.vkstech.com/");
var learnPlaylists=[],learnPlaylist="",learnVideoVerification=null;
var learnTopics=[
  {terms:["financial independence","can i retire","retire today"],tool:"retire-today"},
  {terms:["retirement","retire","सेवानिवृत्ति"],tool:"retirement"},
  {terms:["sip","एसआईपी","compound interest","compounding"],tool:"sip"},
  {terms:["emi","loan","ईएमआई","ऋण"],tool:"emi"},
  {terms:["inflation","महंगाई","मुद्रास्फीति"],tool:"inflation"},
  {terms:["budget","बजट"],tool:"budget"},
  {terms:["expense management","spending","खर्च"],tool:"spends"}
];

function learnProfileKey(name){return "cashly_learn_"+name+"_"+(uid||DK)}
function learnRead(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback}catch(error){return fallback}}
function learnWrite(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch(error){return false}}
function normalizeLearn(kind,data,base){
  var items=kind==="articles"?data?.posts:data?.schemaVersion===1&&data.videos;
  if(!Array.isArray(items))throw Error("Invalid content feed");
  var seen=new Set();
  return items.map(function(item){
    if(!item||typeof item.title!=="string"||!item.title.trim())throw Error("Invalid catalog item");
    if(kind==="articles"&&item.published===false)return null;
    var article=kind==="articles",key=article?item.folder:item.id;
    var date=article?item.date:item.publishedAt,stamp=Date.parse(date);
    if(!(article?/^[a-z0-9][a-z0-9_-]*$/i:/^[\w-]{11}$/).test(key||"")||!Number.isFinite(stamp)||seen.has(key))throw Error("Invalid catalog key or timestamp");
    seen.add(key);
    var type=item.contentType,classification=item.classificationSource;
    if(!article&&!["short","video","unknown"].includes(type))throw Error("Invalid classification");
    var image;
    if(article){
      image=typeof item.cover==="string"&&/^blog\/[\w./-]+$/.test(item.cover)&&!item.cover.includes("..")?new URL(item.cover,base).href:"";
    }else{
      image=CashlyCatalog.thumbnail(item.thumbnail)?item.thumbnail:"";
    }
    var active=!article&&["live","upcoming"].includes(item.liveStatus);
    return {id:(article?"article:":"video:")+key,videoId:article?null:key,title:item.title,description:String(article?item.excerpt||"":item.description||""),
      image,type:article?"article":type==="short"?"short":"video",featured:!article&&!active&&type==="video"&&classification==="creator-override"&&item.embeddable===true,
      stamp,date,channel:String(item.channelTitle||data.channelName||"Cashly by VKS"),languages:CashlyCatalog.languages([item.language]),
      liveStatus:item.liveStatus,scheduledStartTime:item.scheduledStartTime,active,
      tags:Array.isArray(item.tags)?item.tags.filter(tag=>typeof tag==="string"):[],
      tools:Array.isArray(item.tools)?item.tools.filter(tool=>typeof tool==="string"):[],
      duration:Number(item.durationSeconds)||0,reading:Number(item.readingMinutes)||0,embeddable:item.embeddable===true,
      url:article?new URL("blog/"+key+"/index.html",base).href:"https://www.youtube.com/watch?v="+key};
  }).filter(Boolean);
}
function learnCatalogTime(kind,record){
  return kind==="videos"?Date.parse(record.manifest.lastSuccessfulSync):record.received;
}
function acceptLearnCatalog(kind,record){
  if(kind==="videos")CashlyCatalog.accept(record.manifest);
  return normalizeLearn(kind,record.manifest,record.base);
}
function applyLearnCatalog(kind,items,manifest){
  learnFeed[kind]=items;
  if(kind!=="videos")return;
  learnPlaylists=manifest?.playlists||[];
  learnVideoVerification=manifest?.lastSuccessfulSync||null;
  if(learnPlaylist&&!learnPlaylists.some(group=>group.id===learnPlaylist))learnPlaylist="";
}
async function loadCashlyBlogs(manual){
  if(!manual&&Date.now()-learnLastRefresh<5*60000)return;
  learnLastRefresh=Date.now();
  await Promise.all(["articles","videos"].map(async function(kind){
    if(learnStatus[kind]==="loading")return;
    learnStatus[kind]="loading";
    var key="cashly_learn_catalog_v81_"+kind,local=new URL("../",location.href);
    var native=window.Capacitor?.isNativePlatform?.()===true;
    var base=native?learnOrigin:local,relative=kind==="articles"?"blog/manifest.json":"content/videos.json";
    var cached=learnRead(key,null),cachedFeed=null;
    if(cached&&(cached.base===base.href||cached.base===local.href)){
      try{cachedFeed=acceptLearnCatalog(kind,cached);applyLearnCatalog(kind,cachedFeed,cached.manifest)}
      catch(error){
        applyLearnCatalog(kind,[],null);
        if(kind==="videos")try{localStorage.removeItem(key)}catch(storageError){}
      }
    }else applyLearnCatalog(kind,[],null);
    updateLearnResults();
    async function fetchCatalog(origin,source){
      var response=await fetch(new URL(relative,origin),{cache:"no-cache",credentials:"omit",signal:AbortSignal.timeout(8000)});
      if(!response.ok)throw Error("Catalog unavailable");
      var record={base:origin.href,source,received:Date.now(),manifest:await response.json()};
      return {record,items:acceptLearnCatalog(kind,record)};
    }
    try{
      var loaded=await fetchCatalog(base,native?"remote":"website");
      var old=learnCatalogTime(kind,cached||loaded.record),fresh=learnCatalogTime(kind,loaded.record);
      if(cachedFeed&&Number.isFinite(old)&&(!Number.isFinite(fresh)||fresh<old))throw Error("Older catalog");
      applyLearnCatalog(kind,loaded.items,loaded.record.manifest);learnStatus[kind]="ready";learnWrite(key,loaded.record);
      trackLearnItems(kind,loaded.items);
    }catch(error){
      if(!cachedFeed&&native){
        try{
          var bundled=await fetchCatalog(local,"bundled");
          applyLearnCatalog(kind,bundled.items,bundled.record.manifest);learnStatus[kind]="stale";
        }catch(failure){learnStatus[kind]="error";}
      }else learnStatus[kind]=cachedFeed?"stale":"error";
    }
    updateLearnResults();
    if(cV==="learn")rH();
  }));
}
function learnEntries(){return learnFeed.articles.concat(learnFeed.videos).sort((a,b)=>b.stamp-a.stamp||a.id.localeCompare(b.id))}
function learnMatches(item,query){
  return (learnLanguage==="all"||item.languages.includes(learnLanguage))&&
    (!query||[item.title,item.description,...item.tags].join(" ").toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
}
function learnSaved(){return learnRead(learnProfileKey("saved"),[])}
function toggleLearnSaved(id){
  var itemId=id||learnItem?.id;
  if(!itemId)return;
  var saved=learnSaved(),exists=saved.includes(itemId);
  if(!learnWrite(learnProfileKey("saved"),exists?saved.filter(key=>key!==itemId):saved.concat(itemId)))return toast("Could not save content");
  var button=document.getElementById("learnBookmark");
  if(button){button.textContent=exists?"Save":"Saved";button.setAttribute("aria-pressed",String(!exists))}
  else updateLearnResults();
}
function learnPrefs(){return learnRead(learnProfileKey("prefs"),{video:false,short:false,article:false})}
function learnAlerts(){return learnRead(learnProfileKey("alerts"),[])}
function trackLearnItems(kind,items){
  if(!uid)return;
  var key=learnProfileKey("seen_"+kind),previous=learnRead(key,null);
  var prefs=learnPrefs(),alerts=learnAlerts();
  var next={max:Math.max(previous?.max||0,...items.map(item=>item.stamp)),ids:items.map(item=>item.id)};
  if(previous){
    var known=new Set(previous.ids);
    var pending=new Set(alerts.map(item=>item.id));
    for(var item of items)if(prefs[item.type]&&item.stamp>previous.max&&!known.has(item.id)&&!pending.has(item.id)){
      alerts.push({id:item.id,stamp:item.stamp});pending.add(item.id);
    }
    learnWrite(learnProfileKey("alerts"),alerts.slice(-100));
  }
  learnWrite(key,next);
}
function setLearnPreference(type,enabled){
  var prefs=learnPrefs();prefs[type]=enabled;
  learnWrite(learnProfileKey("prefs"),prefs);
  if(enabled){
    var kind=type==="article"?"articles":"videos";
    var key=learnProfileKey("seen_"+kind);
    if(!learnRead(key,null)&&learnFeed[kind].length)trackLearnItems(kind,learnFeed[kind]);
  }
}
function learnHeaderActions(){
  return '<button class="hb" onclick="cashlyHeaderSearch()" aria-label="Search Learn">'+v7Icon("search")+'</button>'+
    '<button class="hb" onclick="sV(\'learnAlerts\')" aria-label="Learn notifications">'+v7Icon("bell")+
      (learnAlerts().length?'<span class="learn-unread" aria-hidden="true"></span>':'')+'</button>'+
    '<button class="hb" onclick="sV(\'learnSaved\')" aria-label="Saved content">'+v7Icon("bookmark")+'</button>';
}
function learnMeta(item){
  var date=new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(item.stamp));
  var duration=CashlyCatalog.duration(item.duration),broadcast=CashlyCatalog.liveLabel(item,learnVideoVerification);
  return esc(({article:"Blog",short:"Short",video:"Video"})[item.type]+" · "+date+
    (duration?" · "+duration:item.reading?" · "+item.reading+" min read":"")+(broadcast?" · "+broadcast:""));
}
function learnCard(item,layout){
  var saved=learnSaved().includes(item.id);
  return '<article class="learn-tile '+layout+'"><button class="learn-open" data-id="'+esc(item.id)+'" onclick="openLearnItem(this.dataset.id)">'+
    (item.image?'<span class="learn-thumb"><img src="'+esc(item.image)+'" alt="" loading="lazy" onerror="this.hidden=true">'+
      (item.type==="article"?"":'<span class="learn-play" aria-hidden="true">'+v7Icon("play")+'</span>')+'</span>':'')+
    '<span class="learn-tile-text"><strong>'+esc(item.title)+'</strong><small>'+learnMeta(item)+'</small>'+
    (layout==="featured"?'<small>'+esc(item.channel)+'</small>':'')+'</span></button>'+
    '<button class="learn-card-bookmark" data-id="'+esc(item.id)+'" aria-label="'+(saved?"Remove bookmark":"Bookmark")+
    '" aria-pressed="'+saved+'" onclick="toggleLearnSaved(this.dataset.id)">'+v7Icon("bookmark")+'</button></article>';
}
function learnPlaylistSection(selected){
  if(!learnPlaylists.length)return "";
  return '<section class="learn-section"><h2>Playlists</h2><label class="learn-language">Cashly playlists <select onchange="learnPlaylist=this.value;updateLearnResults()">'+
    '<option value="">All videos and blogs</option>'+learnPlaylists.map(group=>'<option value="'+esc(group.id)+'"'+
      (group===selected?' selected':'')+'>'+esc(group.title)+'</option>').join("")+'</select></label>'+
    (selected&&selected.description?'<p class="learn-status">'+esc(selected.description)+'</p>':'')+'</section>';
}
function learnResults(){
  var visible=learnEntries().filter(item=>learnMatches(item,learnQuery)),status=Object.values(learnStatus);
  var h=status.includes("stale")?'<p class="learn-status" role="status">Showing saved catalog. Connect to refresh.</p>':"";
  if(learnVideoVerification&&learnStatus.videos==="ready")h+='<p class="learn-status">Video catalog verified '+esc(new Date(learnVideoVerification).toLocaleString())+'.</p>';
  if(status.includes("error"))h+='<p class="learn-status" role="status">Some content is unavailable.</p>';
  var selected=learnFilter==="all"?learnPlaylists.find(group=>group.id===learnPlaylist):null;
  if(selected){
    var byId=new Map(visible.map(item=>[item.videoId,item]));
    var members=selected.videoIds.map(id=>byId.get(id)).filter(Boolean);
    return h+learnPlaylistSection(selected)+'<section class="learn-section"><h2>'+esc(selected.title)+'</h2>'+
      (members.length?'<div class="learn-feed-list">'+members.map(item=>learnCard(item,"feed-row")).join("")+'</div>':
        '<p class="learn-empty" role="status">No matching videos.</p>')+'</section>';
  }
  var all=learnFilter==="all";
  var featured=all&&!learnQuery?visible.find(item=>item.featured):null;
  var broadcasts=all?visible.filter(item=>item.active):[];
  var shorts=visible.filter(item=>item.type==="short");
  var latest=visible.filter(item=>all?item.type!=="short"&&item!==featured&&!item.active:item.type===learnFilter);
  if(featured)h+='<section class="learn-section"><h2>Featured Video</h2>'+learnCard(featured,"featured")+'</section>';
  if(learnFilter==="all"&&shorts.length)h+='<section class="learn-section"><div class="ledger-heading"><h2>Quick Learning · Shorts</h2>'+
    '<button class="cashly-action" onclick="setLearnFilter(\'short\')">View all</button></div><div class="learn-short-rail">'+
    shorts.slice(0,8).map(item=>learnCard(item,"short-card")).join("")+'</div></section>';
  if(broadcasts.length)h+='<section class="learn-section"><h2>Live and Upcoming</h2><div class="learn-feed-list">'+
    broadcasts.map(item=>learnCard(item,"feed-row")).join("")+'</div></section>';
  if(all)h+=learnPlaylistSection(null);
  if(latest.length)h+='<section class="learn-section"><h2>'+({all:"Latest for you",short:"Shorts",video:"Videos",article:"Blogs"})[learnFilter]+'</h2>'+
    '<div class="'+(learnFilter==="short"?"learn-short-gallery":"learn-feed-list")+'">'+latest.map(item=>learnCard(item,learnFilter==="short"?"short-card":"feed-row")).join("")+'</div></section>';
  else if(!featured&&!shorts.length&&!broadcasts.length||!all)h+='<p class="learn-empty" role="status">'+(status.some(state=>state==="idle"||state==="loading")?"Loading content…":"No matching content.")+'</p>';
  if(learnFilter==="all")h+='<div class="cashly-row"><div class="cashly-row-main"><strong>Cashly by VKS</strong><small>Official YouTube channel</small></div>'+
    '<a class="cashly-action learn-link" href="'+learnOfficial+'" target="_blank" rel="noopener noreferrer">Subscribe</a></div>';
  return h;
}
function updateLearnResults(){
  var list=document.getElementById("cashly-learn-list");
  if(list)list.innerHTML=cV==="learnSaved"?learnSavedResults():learnResults();
}
function setLearnFilter(filter){
  learnFilter=filter;learnPlaylist="";
  document.querySelectorAll(".learn-filters button").forEach(item=>item.setAttribute("aria-pressed",String(item.dataset.filter===filter)));
  updateLearnResults();
}
function rLearn(){
  return '<section class="learn-page"><div class="cashly-page-title"><div><h1>Learn</h1><p class="learn-subtitle">Small lessons. Smarter money decisions.</p></div>'+
    '<button class="cashly-action" onclick="loadCashlyBlogs(true)">Refresh</button></div><label class="learn-search">'+v7Icon("search")+
    '<input type="search" aria-label="Search Learn" placeholder="Search videos and blogs" value="'+esc(learnQuery)+
    '" oninput="learnQuery=this.value;updateLearnResults()"></label><div class="learn-controls"><div class="learn-filters" role="group" aria-label="Content type">'+
    learnTabs.map(tab=>'<button data-filter="'+tab[0]+'" aria-pressed="'+(learnFilter===tab[0])+'" onclick="setLearnFilter(this.dataset.filter)">'+tab[1]+'</button>').join("")+
    '</div><label class="learn-language">Language <select onchange="learnLanguage=this.value;updateLearnResults()">'+
    [["all","All"],["en","English"],["hi","हिंदी"]].map(option=>'<option value="'+option[0]+'"'+(learnLanguage===option[0]?" selected":"")+'>'+option[1]+'</option>').join("")+
    '</select></label></div><div id="cashly-learn-list">'+learnResults()+'</div></section>';
}
function learnSavedResults(){
  var entries=learnEntries(),saved=learnSaved();
  if(!saved.length)return '<p class="learn-empty">Save a video, Short or blog to find it here.</p>';
  return saved.map(function(id){
    var item=entries.find(entry=>entry.id===id);
    if(item)return item.title.toLocaleLowerCase().includes(learnSavedQuery.toLocaleLowerCase())?learnCard(item,"feed-row"):"";
    return !learnSavedQuery?'<div class="cashly-row"><span class="cashly-row-main">Content unavailable</span><button class="cashly-action" data-id="'+
      esc(id)+'" onclick="toggleLearnSaved(this.dataset.id)">Remove</button></div>':"";
  }).join("")||'<p class="learn-empty">No saved results.</p>';
}
function rLearnSaved(){
  return v7Back("Saved content","learn")+'<label class="learn-search">'+v7Icon("search")+
    '<input type="search" aria-label="Search saved content" placeholder="Search saved content" value="'+esc(learnSavedQuery)+
    '" oninput="learnSavedQuery=this.value;updateLearnResults()"></label><div id="cashly-learn-list">'+learnSavedResults()+'</div>';
}
function rLearnAlerts(){
  var prefs=learnPrefs(),entries=learnEntries(),alerts=learnAlerts();
  return v7Back("Learn notifications","learn")+'<p class="v7-sub">Choose what appears here when Cashly refreshes Learn. No system permission is needed.</p>'+
    preferenceGroup("New content",Object.entries({video:"New videos",short:"New Shorts",article:"New blogs"}).map(pair=>
      preferenceSwitch(pair[1],"Show in Learn",prefs[pair[0]],"setLearnPreference(\'"+pair[0]+"\',this.checked)")).join(""))+
    '<h2 class="st">New for you</h2>'+(alerts.length?alerts.slice().reverse().map(function(alert){
      var item=entries.find(entry=>entry.id===alert.id);
      return item?learnCard(item,"feed-row"):"";
    }).join("")+'<button class="cashly-action" onclick="learnWrite(learnProfileKey(\'alerts\'),[]);rC(true)">Mark all as seen</button>':'<p class="learn-empty">You’re caught up.</p>');
}
function openLearnItem(id,replace){
  var item=learnEntries().find(entry=>entry.id===id);
  if(item)sV("article",()=>{learnItem=item});
}
function learnRelatedTools(item){
  var text=[item.title,item.description,...item.tags].join(" ").toLocaleLowerCase();
  var tools=item.tools.length?item.tools:learnTopics.filter(topic=>topic.terms.some(term=>text.includes(term))).map(topic=>topic.tool);
  return [...new Set(tools)].filter(tool=>["budget","spends"].includes(tool)||v7Calcs.some(calc=>calc[0]===tool));
}
function openLearnTool(tool){
  if(tool==="budget"||tool==="spends")sV(tool==="budget"?"budgets":"spends");
  else{
    var index=v7Calcs.findIndex(calc=>calc[0]===tool);
    if(index>=0)sV("calculatorDetail",()=>{v7Selected=index});
  }
}
var cashlyPlayer=null,cashlyPlayerAPI=null;
function cleanLearnPlayer(){
  try{cashlyPlayer?.destroy()}catch(error){}
  cashlyPlayer=null;
}
function connectLearnPlayer(frame){
  if(!frame.isConnected)return;
  if(!cashlyPlayerAPI)cashlyPlayerAPI=new Promise(resolve=>{
    if(window.YT?.Player)return resolve(true);
    var script=document.createElement("script");
    script.src="https://www.youtube.com/iframe_api";
    script.onerror=()=>resolve(false);
    window.onYouTubeIframeAPIReady=()=>resolve(true);
    document.head.append(script);
    setTimeout(()=>resolve(false),8000);
  });
  cashlyPlayerAPI.then(ok=>{
    if(!frame.isConnected)return;
    if(!ok){
      document.getElementById("learn-player-status").textContent="If playback is unavailable here, open this video on YouTube.";
      cashlyPlayerAPI=null;return;
    }
    cashlyPlayer=new YT.Player(frame,{events:{onError:function(){
      var status=document.getElementById("learn-player-status");
      if(status&&frame.isConnected)status.textContent="This video could not play in Cashly. Open it on YouTube.";
    }}});
  });
}
function rLearnArticle(){
  if(!learnItem)return v7Back("Learn","learn");
  var item=learnItem,article=item.type==="article",saved=learnSaved().includes(item.id);
  var shorts=learnEntries().filter(entry=>entry.type==="short"&&learnMatches(entry,learnQuery));
  var index=shorts.findIndex(entry=>entry.id===item.id);
  var preceding=item.type==="short"&&index>0?shorts[index-1]:null;
  var following=item.type==="short"&&index>=0?shorts[index+1]:null;
  var body=article?'<iframe sandbox="allow-scripts allow-popups" title="'+esc(item.title)+'" src="'+esc(item.url)+'?app=1"></iframe>':
    item.embeddable?'<iframe class="learn-video '+(item.type==="short"?"vertical":"")+'" title="'+esc(item.title)+
      '" src="https://www.youtube-nocookie.com/embed/'+item.videoId+'?enablejsapi=1&amp;playsinline=1&amp;origin='+encodeURIComponent(location.origin)+
      '" allow="encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" onload="connectLearnPlayer(this)" allowfullscreen></iframe>'+
      '<p id="learn-player-status" class="learn-status" role="status">Video playback requires internet access.</p>':'<p class="learn-status">This video is available on YouTube.</p>';
  var toolbar='<div class="learn-reader-tools"><button class="cashly-action" id="learnBookmark" aria-pressed="'+saved+
    '" onclick="toggleLearnSaved()">'+(saved?"Saved":"Save")+'</button><button class="cashly-action" onclick="shareLearnItem()">Share</button>'+
    '<a href="'+esc(item.url)+'" target="_blank" rel="noopener">'+(article?"Open article":"Open in YouTube")+' ↗</a></div>';
  var navigation=[["Previous Short",preceding],["Next Short",following]].map(pair=>pair[1]?'<button class="cashly-action" data-id="'+
    esc(pair[1].id)+'" onclick="openLearnItem(this.dataset.id)">'+pair[0]+'</button>':"").join(" ");
  var tools=learnRelatedTools(item),related=learnEntries().filter(entry=>entry.id!==item.id&&entry.type!=="short"&&
    (entry.tags.some(tag=>item.tags.includes(tag))||learnRelatedTools(entry).some(tool=>tools.includes(tool)))).slice(0,3);
  return '<section class="learn-article">'+v7Back(article?"Blog":"YouTube","learn")+'<h1>'+esc(item.title)+'</h1>'+
    '<p class="learn-status">'+(article?"":esc(item.channel)+" · ")+learnMeta(item)+'</p>'+toolbar+body+navigation+
    (!article&&item.description?'<p class="learn-description">'+esc(item.description)+'</p>':"")+
    (tools.length?'<section class="learn-section"><h2>Cashly tools</h2>'+tools.map(tool=>'<button class="cashly-action" data-tool="'+tool+
      '" onclick="openLearnTool(this.dataset.tool)">'+esc(tool==="budget"?"Budget Planner":tool==="spends"?"Spends":v7Calcs.find(calc=>calc[0]===tool)[1])+'</button>').join(" ")+'</section>':"")+
    (related.length?'<section class="learn-section"><h2>Related learning</h2>'+related.map(entry=>learnCard(entry,"feed-row")).join("")+'</section>':"")+'</section>';
}
async function shareLearnItem(){
  if(!learnItem)return;
  var url=new URL(learnItem.url,location.href);
  if(learnItem.type==="article")url=new URL(url.pathname,learnOrigin);
  try{
    if(navigator.share)await navigator.share({title:learnItem.title,url:url.href});
    else{await navigator.clipboard.writeText(url.href);toast("Link copied");}
  }catch(error){if(error.name!=="AbortError")toast("Use the content link to share.")}
}
