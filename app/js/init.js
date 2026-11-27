/* Cashly – init.js */
// INIT
if(fbOk){auth.onAuthStateChanged(function(user){
  if(user){
    if(ad?.uid!==user.uid){
      if(uid&&uid!==user.uid)clearCashlySession();
      loadCashlyProfile(user);
    }
    goApp();
    handleShareTarget();
    handleQuickAction();
  }else{
    clearCashlySession();
    safeRL();
  }
})}
function safeRL(){try{rL()}catch(e){console.error("Could not render login",e)}}
if(!fbOk)safeRL();

var backgroundSince=0;
document.addEventListener("visibilitychange",function(){
  if(document.hidden){backgroundSince=Date.now();return}
  if(backgroundSince&&Date.now()-backgroundSince>=60000)lockCashly();
  backgroundSince=0;
  if(uid)cloudLoad();
  if(cV==="learn")loadCashlyBlogs();
});

// Capacitor App handles the Android hardware Back event.
var nativeApp=window.Capacitor?.Plugins?.App;
applyNativeTheme(getTheme());
if(window.Capacitor?.getPlatform?.()==="android"&&nativeApp){
  nativeApp.addListener("backButton",function(){
    if(closeRouteOverlay())return;
    if(viewDepth>0){goBackRoute();return;}
    if(cV!=="spends"&&!$("AS").classList.contains("hidden"))sV("spends");
    else nativeApp.exitApp();
  }).catch(function(error){console.warn("Android Back handler unavailable",error.message)});
}

// WEB SHARE TARGET + SMS Parser
function parseBankSMSText(text){
  return parseIndianBankSMS(text);
}
function handleShareTarget(){
  var params=new URLSearchParams(window.location.search);
  if(!params.get("share"))return false;
  var text=params.get("text")||params.get("title")||"";
  window.history.replaceState(window.history.state,document.title,window.location.pathname);
  if(!text)return false;
  var parsed=parseBankSMSText(text);
  if(!parsed){toast("Could not detect transaction from message");return true}
  // Wait for app to be ready then open modal
  setTimeout(function(){
    if(!ad||!ad["in"]||$("AS").classList.contains("hidden")){toast("Unlock Cashly first");return}
    oM("add");
    mS=Object.assign({},mS,parsed,{tags:["from-sms"]});
    rM();
    toast("\u{1F4F2} SMS detected! Review and save");
    // Clear URL params
    window.history.replaceState({},document.title,window.location.pathname);
  },1000);
  return true;
}
// Quick action shortcuts
function handleQuickAction(){
  var params=new URLSearchParams(window.location.search);
  var act=params.get("action");
  if(!act)return;
  setTimeout(function(){
    if(!ad||!ad["in"]||$("AS").classList.contains("hidden"))return;
    if(act==="expense"){oM("add");mS.type="expense";rM()}
    else if(act==="income"){oM("add");mS.type="income";rM()}
    else if(act==="reports"){sV("reports")}
    window.history.replaceState({},document.title,window.location.pathname);
  },1000);
}

// PWA: Service Worker + Install Prompt
// Keep app-internal navigation inside the installed app scope.
if(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches){
 document.addEventListener('click',function(event){
  var a=event.target.closest&&event.target.closest('a[href]');if(!a)return;
  var u=new URL(a.href,location.href);
  if(u.origin===location.origin && u.pathname==='/' && a.dataset.external!=='true'){
   event.preventDefault();location.assign('/app/');
  }
 });
}
var deferredPrompt=null;
if("serviceWorker" in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js", {scope:"./"}).then(function(reg){console.log("SW registered")}).catch(function(e){console.warn("SW failed",e)})})}
window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();deferredPrompt=e;showInstallBtn()});
window.addEventListener("appinstalled",function(){deferredPrompt=null;hideInstallBtn();toast("App installed!")});
function showInstallBtn(){var b=document.getElementById("installBtn");if(b){b.style.display="flex"}else{var btn=document.createElement("button");btn.id="installBtn";btn.innerHTML="\u{1F4F2} Install App";btn.onclick=installApp;btn.style.cssText="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#16A34A,#15803D);color:#fff;border:none;padding:12px 24px;border-radius:50px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 6px 20px rgba(22,163,74,.4);z-index:999;display:flex;align-items:center;gap:8px;font-family:DM Sans,sans-serif";document.body.appendChild(btn)}}
function hideInstallBtn(){var b=document.getElementById("installBtn");if(b)b.style.display="none"}
function installApp(){if(!deferredPrompt)return;deferredPrompt.prompt();deferredPrompt.userChoice.then(function(){deferredPrompt=null;hideInstallBtn()})}