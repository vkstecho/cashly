/* Cashly Learn — read public blog manifest; no private finance data is sent. */
var CASHLY_BLOG_MANIFEST='/blog/manifest.json';
var cashlyBlogPosts=[];
var cashlyBlogState='loading';
var cashlyBlogQuery='';
var cashlyArticle=null;
function cashlySafePost(post){
 if(!post||post.published===false)return null;
 var folder=String(post.folder||'');
 if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(folder))return null;
 var title=String(post.title||'Untitled article');
 var cover=String(post.cover||'');
 // Only relative assets inside /blog/, never arbitrary external URLs.
 var image=cover.startsWith('blog/')&&/^blog\/[a-zA-Z0-9_./-]+$/.test(cover)&&!cover.includes('..')?'/'+cover:'';
 return {folder:folder,title:title,excerpt:String(post.excerpt||''),date:String(post.date||''),tags:Array.isArray(post.tags)?post.tags.map(String):[],image:image,url:'/blog/'+encodeURIComponent(folder)+'/index.html'};
}
function cashlyLoadPromise(){
 return fetch(CASHLY_BLOG_MANIFEST,{cache:'no-store',credentials:'same-origin'}).then(function(response){if(!response.ok)throw Error('HTTP '+response.status);return response.json()}).then(function(data){
  if(!data||!Array.isArray(data.posts))throw Error('Invalid blog manifest');
  cashlyBlogPosts=data.posts.map(cashlySafePost).filter(Boolean).sort(function(a,b){return b.date.localeCompare(a.date)});
  cashlyBlogState='ready';
 }).catch(function(){cashlyBlogState='error'});
}
function loadCashlyBlogs(){
 if(cashlyBlogState==='loading'||cashlyBlogState==='error'){
  cashlyBlogState='fetching';
  cashlyLoadPromise().then(function(){if(cV==='learn')rC()});
 }
}
function cashlyRetryBlogs(){cashlyBlogState='loading';if(cV==='learn')rC()}
function cashlySearchBlogs(value){cashlyBlogQuery=String(value||'');var list=document.getElementById('cashly-learn-list');if(list)list.innerHTML=cashlyBlogCards()}
function cashlyBlogCards(){
 var q=cashlyBlogQuery.trim().toLowerCase();
 var filtered=cashlyBlogPosts.filter(function(p){return !q||(p.title+' '+p.excerpt+' '+p.tags.join(' ')).toLowerCase().includes(q)});
 if(!filtered.length)return '<div class="learn-empty">'+(q?'No matching articles found.':'No published articles yet.')+'</div>';
 return filtered.map(function(p){var i=cashlyBlogPosts.indexOf(p);return '<button type="button" class="learn-card" onclick="cashlyOpenArticle('+i+')">'+(p.image?'<img loading="lazy" src="'+esc(p.image)+'" alt="" onerror="this.style.display=\'none\'">':'')+'<span class="learn-card-content"><strong>'+esc(p.title)+'</strong><small>'+esc(p.excerpt)+'</small><span class="learn-meta">'+esc(p.date)+' · Read article →</span></span></button>'}).join('');
}
function rLearn(){
 var h='<section class="learn-page"><div class="learn-head"><span class="learn-eyebrow">CASHLY · LEARN</span><h1>Learn with Cashly</h1><p>Smart money decisions start with simple explanations.</p></div>';
 h+='<button type="button" class="cashly-calc-cta" onclick="sV(\'calculators\')">🧮 <strong>Money Calculators</strong><span>Retirement · SIP · EMI · Inflation →</span></button>';
 h+='<label class="learn-search"><span>⌕</span><input type="search" placeholder="Search articles, SIP, EMI…" aria-label="Search articles" value="'+esc(cashlyBlogQuery)+'" oninput="cashlySearchBlogs(this.value)"></label>';
 h+='<div class="learn-row"><h2>Latest articles</h2><button type="button" onclick="cashlyRetryBlogs()" aria-label="Refresh articles">↻ Refresh</button></div>';
 if(cashlyBlogState==='ready')h+='<div id="cashly-learn-list">'+cashlyBlogCards()+'</div>';
 else if(cashlyBlogState==='error')h+='<div class="learn-empty">Articles are unavailable right now. Check your connection and try again.<p><button type="button" onclick="cashlyRetryBlogs()">Try again</button></p></div>';
 else h+='<div class="learn-empty" role="status">Loading latest articles…</div>';
 h+='<p class="learn-note">Articles are educational, not personalised financial advice.</p></section>';return h;
}
function cashlyOpenArticle(index){
 var p=cashlyBlogPosts[index];if(!p)return;
 cashlyArticle=p;sV('article');
}
function rLearnArticle(){
 if(!cashlyArticle)return '<button onclick="sV(\'learn\')">← Back to Learn</button>';
 return '<div class="learn-article"><div class="learn-article-head"><button type="button" onclick="sV(\'learn\')">← Learn</button><a href="'+esc(cashlyArticle.url)+'" target="_blank" rel="noopener">Open in browser ↗</a></div><iframe title="'+esc(cashlyArticle.title)+'" src="'+esc(cashlyArticle.url)+'" loading="eager"></iframe></div>';
}

function rCashlyCalculators(){return '<section class="cashly-calcs-inapp"><div class="learn-article-head"><button type="button" onclick="sV(\'learn\')">← Learn</button><a href="/calculators.html" target="_blank" rel="noopener">Open in browser ↗</a></div><iframe title="Cashly money calculators" src="/calculators.html" loading="eager"></iframe></section>';}
