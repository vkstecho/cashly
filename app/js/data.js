/* Cashly – data.js */
function goApp(){
  $("LS").classList.add("hidden");
  $("AS").classList.remove("hidden");
  uid=auth.currentUser?auth.currentUser.uid:null;
  // Isolate each user's local data under their own key (prevents cross-user data leak)
  if(uid){
    DK="mf_data_v5_"+uid;
    try{var s=localStorage.getItem(DK);D=s?JSON.parse(s):emptyD()}catch(e){D=emptyD()}
  }else{
    D=emptyD();
  }
  ensureAccounts();
  checkRecurring();
  rH();rN();rC();
  function afterReady(){
    checkRecurring();rH();rC();
    var nm=ad&&ad.name?String(ad.name).trim():"";
    if(!nm||nm==="User"){
      oM("name");
    }else{
      setTimeout(startOnboarding,400);
    }
    setTimeout(function(){scheduleReminder();checkBudgetAlert()},2000);
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
function ensureAccounts(){
  if(!D.accounts||!D.accounts.length){
    D.accounts=[
      {id:"cash",name:"Cash",type:"cash",balance:0,color:"#2E7D32",icon:"💵"},
      {id:"sbi",name:"SBI",type:"bank",balance:0,color:"#00B5E2",icon:"🏦"},
      {id:"hdfc",name:"HDFC",type:"bank",balance:0,color:"#004C8F",icon:"🏦"},
      {id:"hdfc_cc",name:"HDFC Credit",type:"credit",balance:0,color:"#004C8F",icon:"💳"},
      {id:"icici",name:"ICICI",type:"bank",balance:0,color:"#F58220",icon:"🏦"},
      {id:"gpay",name:"Google Pay",type:"wallet",balance:0,color:"#4285F4",icon:"📱"},
      {id:"phonepe",name:"PhonePe",type:"wallet",balance:0,color:"#5F259F",icon:"📱"}
    ];
  }
}
var D=emptyD();
function ensureAccounts(){if(!D.accounts||!D.accounts.length){D.accounts=[{id:"cash",name:"Cash",type:"cash",balance:0,color:"#2E7D32",icon:"💵"},{id:"bank",name:"Bank",type:"bank",balance:0,color:"#1565C0",icon:"🏦"},{id:"card",name:"Credit Card",type:"credit",balance:0,color:"#E65100",icon:"💳"}]}}
function getAccounts(){ensureAccounts();return D.accounts}
function sv(){try{localStorage.setItem(DK,JSON.stringify(D))}catch(e){}cloudSync()}
function cloudSync(){
  if(!fbOk||!uid||syncing)return;
  syncing=true;
  db.collection("users").doc(uid).set({data:D,name:(ad&&ad.name)||"User",updated:Date.now()},{merge:true})
    .then(function(){syncing=false})
    .catch(function(e){syncing=false;console.warn("Sync failed:",e.message)});
}
function cloudLoad(){
  if(!fbOk||!uid)return Promise.resolve();
  return db.collection("users").doc(uid).get().then(function(doc){
    if(doc.exists){
      var dd=doc.data();
      var cn=dd.name;
      if(cn&&cn!=="User"&&ad){
        if(!ad.name||ad.name==="User"||ad.name!==cn){ad.name=cn;localStorage.setItem(AK,JSON.stringify(ad));rH()}
      }
      var cloudData=dd.data;
      if(cloudData&&cloudData.transactions){
        // Merge: cloud wins if newer, otherwise keep local
        var cloudCount=cloudData.transactions.length;
        var localCount=D.transactions.length;
        if(cloudCount>=localCount){
          D=cloudData;
          ensureAccounts();
          localStorage.setItem(DK,JSON.stringify(D));
          toast("Synced "+cloudCount+" transactions from cloud");
        }else{
          // Local has more, push to cloud
          cloudSync();
        }
      }
    }
  }).catch(function(e){console.warn("Load failed:",e.message)});
}
var cV="learn",cF="all",sT="",dateFrom="",dateTo="",catFilter="all",groupFilter="all";
function homeNav(kind){
  cV="transactions";sT="";catFilter="all";dateFrom="";dateTo="";
  if(kind==="income"){cF="income";groupFilter="all"}
  else if(kind==="expense"){cF="expense";groupFilter="all"}
  else if(kind==="need"||kind==="want"||kind==="savings"){cF="expense";groupFilter=kind}
  else{cF="all";groupFilter="all"}
  rN();rC();
}



// ===== SMS Auto-import (PWA-friendly) =====
// Full background SMS read needs a native Android layer.
// Here we provide: paste SMS, share-target friendly parser, and common Indian bank patterns.

function parseIndianBankSMS(text){
  if(!text || typeof text !== "string") return null;
  var t = text.replace(/\s+/g, " ").trim();
  var amount = null, type = "expense", merchant = "", account = "", date = "";

  // Amount patterns: Rs.1,234.56 | INR 1234 | ₹1234.00 | Rs 1234
  var amtMatch = t.match(/(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.\d{1,2})?)/i);
  if(amtMatch) amount = parseFloat(amtMatch[1].replace(/,/g,""));
  if(!amount || isNaN(amount)) return null;

  // Debit / Credit
  if(/\b(credited|credit|received|deposited|cr\.?)\b/i.test(t)) type = "income";
  if(/\b(debited|debit|spent|paid|purchase|dr\.?)\b/i.test(t)) type = "expense";

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

  // Category guess
  var cat = "other";
  var low = (merchant+" "+t).toLowerCase();
  if(/swiggy|zomato|restaurant|cafe|food|dominos|pizza/.test(low)) cat = "food";
  else if(/uber|ola|rapido|petrol|fuel|irctc|metro/.test(low)) cat = "transport";
  else if(/amazon|flipkart|myntra|ajio|meesho/.test(low)) cat = "shopping";
  else if(/electricity|water|gas|recharge|jio|airtel|vi /.test(low)) cat = "bills";
  else if(/salary|payroll/.test(low)) cat = "salary";

  return {
    amount: amount,
    type: type,
    note: merchant || "SMS Import",
    category: cat,
    date: date,
    accountHint: account,
    raw: t.slice(0,200)
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
  // also try reading from clipboard
  if(navigator.clipboard && navigator.clipboard.readText){
    navigator.clipboard.readText().then(function(t){
      if(t && /(?:Rs\.?|INR|₹)/i.test(t)){
        var el = $("smsText"); if(el) el.value = t;
      }
    }).catch(function(){});
  }
}

function runSMSParse(){
  var el = $("smsText");
  if(!el) return;
  var text = el.value || "";
  // Support multiple SMS separated by blank lines
  var blocks = text.split(/\n\s*\n/).filter(function(b){return b.trim()});
  if(blocks.length <= 1 && text.indexOf("Rs")!==-1){
    // try split by common SMS start patterns
    blocks = text.split(/(?=(?:Rs\.?|INR|₹)\s*[0-9])/i).filter(function(b){return b.trim().length>10});
    if(!blocks.length) blocks = [text];
  }
  var parsed = [];
  blocks.forEach(function(b){
    var p = parseIndianBankSMS(b);
    if(p) parsed.push(p);
  });
  var box = $("smsPreview");
  if(!box) return;
  if(!parsed.length){
    box.innerHTML = '<div style="color:#EF4444;font-size:13px">Could not detect transactions. Check the SMS format.</div>';
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

function importParsedSMS(){
  var list = window._smsParsed || [];
  if(!list.length){ toast("Nothing to import"); return; }
  var cats = typeof eCats === "function" ? eCats() : [];
  list.forEach(function(p){
    var catId = p.category;
    // map soft names to existing category ids if possible
    if(typeof CATS !== "undefined"){
      for(var i=0;i<CATS.length;i++){
        if(CATS[i].id===p.category || CATS[i].l.toLowerCase().indexOf(p.category)!==-1){
          catId = CATS[i].id; break;
        }
      }
    }
    D.transactions.unshift({
      id: "sms_"+Date.now()+"_"+Math.random().toString(36).slice(2,7),
      type: p.type,
      amount: p.amount,
      category: catId,
      note: p.note,
      date: p.date,
      tags: ["sms-import"],
      excluded: false
    });
  });
  sv();
  cM();
  toast("Imported "+list.length+" transaction"+(list.length>1?"s":""));
  rC();
}
