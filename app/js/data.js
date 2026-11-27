/* Cashly – data.js */
var unlockedUid=null;
function goApp(){
  if(!fbOk||!auth.currentUser)return;
  var userId=auth.currentUser.uid;
  if(isPinSet()&&unlockedUid!==userId){
    $("LS").classList.add("hidden");
    $("AS").classList.add("hidden");
    if(!document.getElementById("pinPrompt"))verifyPin(function(){
      if(auth.currentUser&&auth.currentUser.uid===userId){
        unlockedUid=userId;
        goApp();
      }
    });
    return;
  }
  if(uid===userId&&!$("AS").classList.contains("hidden")){rH();return;}
  if(ad?.uid!==userId)loadCashlyProfile(auth.currentUser);

  $("LS").classList.add("hidden");
  $("AS").classList.remove("hidden");
  uid=auth.currentUser?auth.currentUser.uid:null;
  // Isolate each user's local data under their own key (prevents cross-user data leak)
  DK="mf_data_v5_"+uid;
  rebuildCats();
  var record;
  try{record=readSyncRecord(DK);validateCashlyData(record.data)}catch(error){
    $("AS").classList.add("hidden");$("LS").classList.remove("hidden");
    $("LC").textContent="Saved data needs recovery. Cashly preserved the stored records.";
    return;
  }
  D=record.data;
  syncSeenToken=record.token;
  syncConflict=null;
  showSyncStatus("local");
  ensureAccounts();
  cV=getLaunchView();
  rH();rN();rC();
  function afterReady(){
    if(userId!==uid||auth.currentUser?.uid!==userId)return;
    checkRecurring();rH();rC();
    var nm=ad&&ad.name?String(ad.name).trim():"";
    if(!nm||nm==="User"){
      oM("name");
    }else{
      setTimeout(()=>{if(syncOwner(userId))startOnboarding();},400);
    }
    setTimeout(function(){if(syncOwner(userId)){scheduleReminder();checkBudgetAlert();}},2000);
  }
  if(uid){cloudLoad().then(afterReady).catch(afterReady)}
  else{afterReady()}
}

// DATA
var DK="mf_v5";
function emptyD(){return{transactions:[],budgets:{},splits:[],recurring:[],monthlyBudget:33000,itr:[],accounts:[
  {id:"cash",name:"Cash",type:"cash",balance:0,color:"#2E7D32",icon:"💵"},
  {id:"sbi",name:"SBI",type:"bank",balance:0,color:"#00B5E2",icon:"🏦"},
  {id:"hdfc",name:"HDFC",type:"bank",balance:0,color:"#004C8F",icon:"🏦"},
  {id:"hdfc_cc",name:"HDFC Credit",type:"credit",balance:0,color:"#004C8F",icon:"💳"},
  {id:"icici",name:"ICICI",type:"bank",balance:0,color:"#F58220",icon:"🏦"},
  {id:"gpay",name:"Google Pay",type:"wallet",balance:0,color:"#4285F4",icon:"📱"},
  {id:"phonepe",name:"PhonePe",type:"wallet",balance:0,color:"#5F259F",icon:"📱"}
]}}
var D=emptyD();
function ensureAccounts(){
  if(!Array.isArray(D.accounts)||!D.accounts.length)D.accounts=emptyD().accounts;
  if(!Array.isArray(D.splits))D.splits=[];
  if(!Array.isArray(D.recurring))D.recurring=[];
  if(!D.budgets)D.budgets={};
}
function getAccounts(){ensureAccounts();return D.accounts}
var cashlyWrites=new Map();
var syncStatus="local",syncConflict=null;
function readSyncRecord(key){
  var current=localStorage.getItem(key+"_v81");
  if(current)return JSON.parse(current);
  var old=localStorage.getItem(key);
  return {version:1,token:null,base:null,data:old?JSON.parse(old):emptyD(),hasLocal:!!old,profile:""};
}
function validateCashlyData(data){
  if(!data||!Array.isArray(data.transactions))throw Error("Missing transaction list");
  var safeId=value=>typeof value==="string"&&/^[a-zA-Z0-9_.-]{1,150}$/.test(value);
  for(var type of ["transactions","accounts","splits","recurring"]){
    if(data[type]===undefined&&type!=="transactions")continue;
    if(!Array.isArray(data[type]))throw Error("Invalid "+type);
    var seen=new Set();
    for(var item of data[type]){
      if(!safeId(item?.id)||seen.has(item.id))throw Error("Invalid or duplicated record ID in "+type);
      seen.add(item.id);
      if(type==="transactions"&&(!["expense","income","transfer"].includes(item.type)||!Number.isFinite(Number(item.amount))||
        (item.category&&!safeId(item.category))||
        (item.receipt&&!/^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(item.receipt))))throw Error("Invalid transaction");
      if(type==="splits"&&item.ledgerVersion===1)validateSplitLedger(item);
    }
  }
  if(data.budgets&&Object.keys(data.budgets).some(key=>!safeId(key)))throw Error("Invalid budget category");
  return data;
}
function persistSyncRecord(key,record){
  localStorage.setItem(key+"_v81",JSON.stringify(record));
  try{localStorage.setItem(key,JSON.stringify(record.data))}catch(error){console.warn("Legacy mirror unavailable",error.name)}
}
function syncOwner(userId){return fbOk&&uid===userId&&auth.currentUser?.uid===userId}
function showSyncStatus(status){
  syncStatus=status;
  var label=document.getElementById("cashly-sync-status");
  if(label)label.textContent=({local:"Saved on device",pending:"Sync pending",synced:"Synced",offline:"Offline · saved on device",failed:"Sync failed · retry",conflict:"Sync conflict · review"})[status];
}
var syncSeenToken=null;
function sv(){
  if(!uid||!syncOwner(uid))return;
  try{
    var record=readSyncRecord(DK);
    if(record.token!==syncSeenToken){
      // Preserve this tab's edits separately instead of overwriting another tab's pending work.
      localStorage.setItem(DK+"_recovery_"+crypto.randomUUID(),JSON.stringify(D));
      showSyncStatus("conflict");toast("Another tab saved changes. This tab's edits were kept for recovery.");
      return;
    }
    D.splits=(D.splits||[]).map(addSplitIdentifiers);
    validateCashlyData(D);
    record={...record,data:JSON.parse(JSON.stringify(D)),hasLocal:true,token:crypto.randomUUID(),profile:ad?.name||""};
    persistSyncRecord(DK,record);
    syncSeenToken=record.token;
  }catch(error){showSyncStatus("failed");toast("This change could not be saved on this device.");return;}
  cloudLoad();
}
function cloudSync(){sv()}
function cloudLoad(resolution){
  var userId=uid,key=DK;
  if(!userId||!syncOwner(userId))return Promise.resolve();
  var active=cashlyWrites.get(userId);
  if(active){if(!resolution)active.again=true;return active.task;}
  var state={again:false,task:null};
  cashlyWrites.set(userId,state);
  state.task=(async function(){
    do{
      state.again=false;
      var proposed;
      try{
        proposed=readSyncRecord(key);
        if(proposed.token!==syncSeenToken){showSyncStatus("conflict");return;}
        var ref=db.collection("users").doc(userId);
        showSyncStatus(navigator.onLine?"pending":"offline");
        var result=await cashlySyncModel.runRevisionTransaction(callback=>db.runTransaction(callback),async function(){
          if(!syncOwner(userId))throw Error("Account changed");
          return Number((await ref.get({source:"server"})).data()?.cashlyRevision)||0;
        },async function(tx,observe){
          var snapshot=await tx.get(ref);
          if(!syncOwner(userId))throw Error("Account changed");
          var payload=snapshot.data()||{};
          if(snapshot.exists&&(!payload.data||!Array.isArray(payload.data.transactions))){
            return {conflicts:["Cloud data is not in a recognized format"],remote:null};
          }
          if(snapshot.exists)validateCashlyData(payload.data);
          var remote=snapshot.exists?{data:payload.data,profile:payload.name||"",revision:Number(payload.cashlyRevision)||0}:null;
          observe(remote?.revision||0);
          var merged=cashlySyncModel.decide(proposed,remote);
          if(resolution){
            if(!cashlySyncModel.equal(remote,resolution.remote))return {conflicts:["Cloud data changed again"],remote:remote};
            if(!remote)return {conflicts:["Cloud data unavailable"],remote:null};
            merged=resolution.choice==="remote"?remote:{data:proposed.data,profile:proposed.profile};
          }
          if(merged.conflicts?.length)return {...merged,remote:remote};
          if(remote&&cashlySyncModel.equal(remote.data,merged.data)&&remote.profile===merged.profile)return {base:remote};
          if(!remote&&!proposed.hasLocal)return {base:null};
          var base={data:merged.data,profile:merged.profile,revision:(remote?.revision||0)+1};
          tx.set(ref,{data:base.data,name:base.profile,cashlyRevision:base.revision,cashlySchema:81,updated:Date.now()},{merge:true});
          return {base:base};
        });
        resolution=null;
        if(!syncOwner(userId))return;
        if(result.conflicts){
          syncConflict=result.remote?result:null;
          showSyncStatus("conflict");return;
        }
        if(!result.base){syncConflict=null;showSyncStatus("synced");return;}
        var current=readSyncRecord(key);
        if(current.token!==proposed.token){
          if(current.token!==syncSeenToken){showSyncStatus("conflict");return;}
          // Preserve in-flight edits and incorporate the acknowledged remote changes.
          var carried=cashlySyncModel.reconcile(proposed.data,current.data,result.base.data);
          if(carried.conflicts.length){syncConflict={remote:result.base,conflicts:carried.conflicts};showSyncStatus("conflict");return;}
          syncSeenToken=crypto.randomUUID();
          persistSyncRecord(key,{...current,token:syncSeenToken,data:carried.data,base:result.base});
          D=carried.data;
          state.again=true;
        }else{
          var changed=!cashlySyncModel.equal(current.data,result.base.data);
          var promoted={...current,token:crypto.randomUUID(),hasLocal:true,data:result.base.data,profile:result.base.profile,base:result.base};
          persistSyncRecord(key,promoted);
          syncSeenToken=promoted.token;
          D=promoted.data;
          if(ad&&result.base.profile&&ad.name!==result.base.profile){ad.name=result.base.profile;persistCashlyProfile();}
          if(changed&&!$("AS").classList.contains("hidden")){ensureAccounts();rC(true);}
          syncConflict=null;
          showSyncStatus("synced");
        }
      }catch(error){
        if(syncOwner(userId))showSyncStatus(navigator.onLine?"failed":"offline");
        return;
      }
    }while(state.again&&syncOwner(userId));
  })().finally(function(){if(cashlyWrites.get(userId)===state)cashlyWrites.delete(userId)});
  return state.task;
}
function downloadCashlyRecovery(copies){
  var url=URL.createObjectURL(new Blob([JSON.stringify(copies)],{type:"application/json"}));
  var link=document.createElement("a");link.href=url;link.download="Cashly-sync-recovery.json";link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function reviewCashlySync(){
  if(!syncConflict){
    if(syncStatus==="conflict"&&uid){
      var copies=[];
      for(var i=0;i<localStorage.length;i++){
        var key=localStorage.key(i);
        if(key?.startsWith(DK+"_recovery_"))copies.push(JSON.parse(localStorage.getItem(key)));
      }
      if(copies.length){downloadCashlyRecovery(copies);return;}
    }
    cloudLoad();return;
  }
  var conflict=syncConflict;
  var dialog=document.createElement("dialog");
  dialog.className="ledger-dialog";
  dialog.innerHTML='<div class="ledger-heading"><h2>Review cloud conflict</h2><button class="cashly-action" data-choice="cancel">Close</button></div>'+
    '<p>Cashly retained both versions. Keeping a version replaces the other active version after saving a recovery copy on this device.</p>'+
    '<p>'+esc(conflict.conflicts.join(", "))+'</p>'+
    '<button class="cashly-action" data-choice="backup">Download both versions</button> '+
    '<button class="cashly-action" data-choice="remote">Keep cloud version</button> '+
    '<button class="cashly-action" data-choice="local">Keep device version</button>';
  dialog.addEventListener("click",function(event){
    var choice=event.target.dataset.choice;
    if(!choice)return;
    if(choice==="cancel"){dialog.close();return;}
    var versions={device:readSyncRecord(DK),cloud:conflict.remote};
    if(choice==="backup"){
      downloadCashlyRecovery(versions);
      return;
    }
    if(!confirm("Keep this version and replace the other active version?"))return;
    try{localStorage.setItem(DK+"_recovery_"+crypto.randomUUID(),JSON.stringify(versions))}
    catch(error){toast("Unable to save a recovery copy");return;}
    dialog.close();
    cloudLoad({choice:choice,remote:conflict.remote});
  });
  document.body.append(dialog);
  dialog.addEventListener("close",()=>dialog.remove(),{once:true});
  dialog.showModal();
}
window.addEventListener("online",()=>cloudLoad());
var cV="spends",cF="all",sT="",dateFrom="",dateTo="",catFilter="all",groupFilter="all";
function homeNav(kind){
  sV("transactions",function(){
    if(["income","expense"].includes(kind))cF=kind;
    else if(["need","want","savings"].includes(kind)){cF="expense";groupFilter=kind;}
  });
}



// ===== SMS Auto-import (PWA-friendly) =====
// Full background SMS read needs a native Android layer.
// Here we provide: paste SMS, share-target friendly parser, and common Indian bank patterns.

function parseIndianBankSMS(text){
  if(!text || typeof text !== "string") return null;
  var t = text.replace(/\s+/g, " ").trim();
  if(/\b(?:otp|one.time password|failed|declined|unsuccessful|pending|due date|minimum due)\b/i.test(t))return null;
  var incoming=/\b(?:credited|deposited|received)\b/i.test(t);
  var outgoing=/\b(?:debited|spent|paid|withdrawn|sent)\b/i.test(t);
  if(incoming===outgoing)return null;
  var amount=null,type=incoming?"income":"expense",merchant="",account="",date="";

  // Amount patterns: Rs.1,234.56 | INR 1234 | ₹1234.00 | Rs 1234
  var amtMatch = t.match(/(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.\d{1,2})?)/i);
  if(amtMatch) amount = parseFloat(amtMatch[1].replace(/,/g,""));
  if(!amount || !Number.isFinite(amount) || amount > 9999999999.99) return null;

  // VPA / merchant hints
  var merchMatch = t.match(/(?:to|at|from|info:)\s+([A-Za-z0-9@._\-\s]{3,40})/i);
  if(merchMatch) merchant = merchMatch[1].trim().slice(0,40);

  // Account last 4
  var accMatch = t.match(/(?:A\/c|Ac|Account|XX|x{2,})[\s\-]*([0-9]{3,4})/i);
  if(accMatch) account = accMatch[1];

  // Date
  var dMatch = t.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/);
  if(dMatch){
    var parts = dMatch[1].split(/[-\/]/);
    if(parts.length===3){
      var dd = parts[0].padStart(2,"0"), mm = parts[1].padStart(2,"0"), yy = parts[2];
      if(yy.length===2) yy = "20"+yy;
      date = yy+"-"+mm+"-"+dd;
    }
  }
  if(!date){
    var now = new Date();
    date = now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");
  }

  if(!Number.isFinite(Date.parse(date+"T00:00:00Z"))||new Date(date+"T00:00:00Z").toISOString().slice(0,10)!==date)return null;
  // Category guess
  var cat = "other";
  var low = (merchant+" "+t).toLowerCase();
  if(/swiggy|zomato|restaurant|cafe|food|dominos|pizza/.test(low)) cat = "food";
  else if(/uber|ola|rapido|petrol|fuel|irctc|metro/.test(low)) cat = "transport";
  else if(/amazon|flipkart|myntra|ajio|meesho/.test(low)) cat = "shopping";
  else if(/electricity|water|gas|recharge|jio|airtel|vi /.test(low)) cat = "bills";
  else if(/salary|payroll/.test(low)) cat = "salary";

  if(type==="income"&&cat!=="salary")cat="family";
  return {
    amount: amount,
    type: type,
    note: merchant || "SMS Import",
    category: cat,
    date: date,
    accountHint: account,
    raw: t
  };
}

function openSMSImport(){
  cM();
  var html = '<div class="mh"><span class="xmt">Import from SMS</span><button class="xmc" onclick="cM()">×</button></div>';
  html += '<div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;line-height:1.5">Paste bank/UPI SMS below. Cashly will detect amount, type and merchant.<br><b>Note:</b> Automatic background SMS reading needs the Android app wrapper. In browser/PWA, paste or share SMS text here.</div>';
  html += '<div class="ig"><label class="il">Paste SMS text</label><textarea class="inp" id="smsText" rows="5" placeholder="e.g. Rs.499.00 debited from A/c XX1234 on 12-11-26 at SWIGGY. Avl Bal Rs.12,340.50" style="resize:vertical;min-height:100px"></textarea></div>';
  html += '<button class="sub" onclick="runSMSParse()">Detect transactions</button>';
  html += '<div id="smsPreview" style="margin-top:14px"></div>';
  var m = $("ML"); if(m){ m.innerHTML = html; }
  var overlay = $("OV"); if(overlay) overlay.classList.remove("hidden");
  window._smsParsed=[];

}

function runSMSParse(){
  var el = $("smsText");
  if(!el) return;
  var text = el.value || "";
  // Support multiple SMS separated by blank lines
  var blocks = text.split(/\n\s*\n/).filter(function(b){return b.trim()});
  var parsed=[];
  window._smsParsed=[];
  blocks.forEach(function(b){
    var p = parseIndianBankSMS(b);
    if(p) parsed.push(p);
  });
  var box = $("smsPreview");
  if(!box) return;
  if(!parsed.length){
    box.innerHTML = '<div style="color:#EF4444;font-size:13px">Could not detect confirmed transactions. Check the SMS format.</div><a href="support.html">Report an undetected format without sharing the original message</a>';
    return;
  }
  window._smsParsed = parsed;
  var h = '<div style="font-weight:700;font-size:14px;margin-bottom:10px">Detected '+parsed.length+' transaction'+(parsed.length>1?"s":"")+'</div>';
  parsed.forEach(function(p,i){
    h += '<div class="set-card" style="padding:10px 12px"><div class="set-text"><div class="set-title">'+esc(p.note)+' · '+p.type+'</div><div class="set-sub">'+p.date+' · '+(p.accountHint?"A/c "+p.accountHint+" · ":"")+esc(p.raw.slice(0,40))+'...</div></div><div style="font-weight:700;color:'+(p.type==="income"?"#16A34A":"#1a1a1a")+'">'+fF(p.amount)+'</div></div>';
  });
  h += '<button class="sub" style="margin-top:12px" onclick="importParsedSMS()">Import all</button>';
  box.innerHTML = h;
}

async function importParsedSMS(){
  var list=window._smsParsed||[],owner=uid;
  if(!list.length){toast("Nothing to import");return;}
  window._smsParsed=[];
  var count=0,seen=new Set(D.transactions.map(transaction=>transaction.smsImportId).filter(Boolean));
  try{
    for(var item of list){
      var basis=String(item.raw||"").trim().replace(/\s+/g," ").toLowerCase();
      var digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(basis));
      var fingerprint=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("");
      if(!syncOwner(owner))return;
      if(seen.has(fingerprint)||D.transactions.some(t=>t.smsImportId===fingerprint))continue;
      seen.add(fingerprint);
      D.transactions.unshift({id:"sms_"+fingerprint,type:item.type,amount:item.amount,category:item.category,
        note:item.note,date:item.date,tags:["sms-import"],excluded:false,smsImportId:fingerprint});
      count++;
    }
    if(count)sv();
    cM();toast(count?"Imported "+count+" transaction"+(count===1?"":"s"):"These messages have already been imported");rC();
  }catch(error){window._smsParsed=list;toast("Unable to review this import on this device.");}
}
