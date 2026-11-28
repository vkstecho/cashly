/* Cashly – ui-core.js */
var accountReturn="spends";
function openAccountProfile(){
  if(TABS.some(function(tab){return tab[0]===cV}))accountReturn=cV;
  sV("account");
}
function accountAvatar(fallback){
  var photo=ad&&ad.pic;
  return /^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(photo||"")?
    '<img src="'+esc(photo)+'" alt="">':esc(fallback);
}
function rH(){
  var nm=ad&&ad.name?String(ad.name):"User",ini=accountAvatar(nm.charAt(0).toUpperCase());
  $("AH").innerHTML='<div class="hl"><button class="hav" onclick="openAccountProfile()" aria-label="Open account profile" style="border:0;cursor:pointer">'+ini+'</button><div class="hn">Hi '+esc(nm)+'</div></div><div class="ha">'+(cV==="learn"?learnHeaderActions():cV==="calculators"||(cV==="splits"&&!D.splits.length)?"":'<button class="hb" onclick="cashlyHeaderSearch()" aria-label="Search">'+v7Icon("search")+'</button>')+'</div>';
}


var TABS=[["learn","","Learn"],["spends","","Spends"],["splits","","Splits"],["calculators","","Calculators"]];
var txnAccount="all",txnMerchant="",txnIncludedOnly=false,txnTrendReview=null;
function matchesTransactionScope(t){
  return (txnAccount==="all"||t.accountId===txnAccount||t.toAccountId===txnAccount)&&
    (!dateFrom||(t.date&&t.date>=dateFrom))&&(!dateTo||(t.date&&t.date<=dateTo));
}
function transactionQueryMatch(t){
  if(!sT.trim())return true;
  var query=sT.trim().toLocaleLowerCase();
  var tags=(Array.isArray(t.tags)?t.tags:[]).map(tag=>"#"+String(tag).toLocaleLowerCase());
  if(query.startsWith("#"))return tags.includes(query);
  return [t.note||"",gC(t.category).l,...tags].join(" ").toLocaleLowerCase().includes(query);
}
function scopedCategoryTransactions(){
  return D.transactions.filter(function(t){
    return t.type===(cF==="income"?"income":"expense")&&!t.excluded&&matchesTransactionScope(t)&&
      (dateFrom||dateTo||String(t.date||"").startsWith(tMo()))&&
      (catFilter==="all"||t.category===catFilter)&&(!txnTrendReview||matchesTrend(t,txnTrendReview))&&
      (groupFilter==="all"||gC(t.category).g===groupFilter)&&(!txnMerchant||merchantName(t)===txnMerchant)&&transactionQueryMatch(t);
  });
}
function keepExpenseRange(){
  if(dateFrom||dateTo)return;
  var now=new Date();
  dateFrom=tMo()+"-01";
  dateTo=localDateKey(new Date(now.getFullYear(),now.getMonth()+1,0));
}
function merchantName(t){
  return String(t.note||gC(t.category).l).trim().split(" - ")[0].split(" @")[0].trim()||"Unknown";
}
function filterByMerchant(index){
  var record=merchantTotals()[index];
  if(!record)return;
  txnMerchant=record.name;
  txnIncludedOnly=true;
  sT="";
  keepExpenseRange();
  if(cF!=="income")cF="expense";
  txnTab="txns";
  rC();
}
function merchantTotals(){
  var grouped=new Map();
  scopedCategoryTransactions().forEach(function(t){
    var name=merchantName(t),entry=grouped.get(name)||{name:name,paise:0,count:0};
    entry.paise+=financePaise(t.amount);
    entry.count++;
    grouped.set(name,entry);
  });
  return Array.from(grouped.values()).sort(function(a,b){return b.paise-a.paise});
}
function filterByCategory(id){
  catFilter=id;
  txnMerchant="";
  txnIncludedOnly=true;
  sT="";
  keepExpenseRange();
  if(cF!=="income")cF="expense";
  txnTab="txns";
  rC();
}
var txnTab="txns"; // txns | cats | merch
function rN(){
  var icons = {learn:v7Icon("book"), spends:v7Icon("wallet"), splits:v7Icon("split"), calculators:v7Icon("calculator")};
  var h="";
  for(var i=0;i<TABS.length;i++){
    var t=TABS[i];
    var icon = icons[t[0]] || t[1];
    h+='<button class="xnb'+(cV===t[0]?" a":"")+'"'+(cV===t[0]?' aria-current="page"':'')+' onclick="sV(\''+t[0]+'\')"><span class="xni">'+icon+'</span><span class="xnl">'+t[2]+'</span></button>';
  }
  $("NV").innerHTML=h;
}
var viewStack=new Map(),viewKey=null,viewDepth=0;
function captureCashlyRoute(){
  return {view:cV,scroll:$("CT").scrollTop,sT,cF,catFilter,groupFilter,dateFrom,dateTo,txnTab,txnAccount,txnMerchant,
    txnIncludedOnly,txnTrendReview,trendOffset,trendFilter,weeklyOffset,weeklyDay,learnFilter,learnLanguage,learnQuery,learnPlaylist,learnItem,learnSavedQuery,splitQuery,activeSplitId,v7Selected,accountReturn};
}
function applyCashlyRoute(state){
  ({view:cV,sT,cF,catFilter,groupFilter,dateFrom,dateTo,txnTab,txnAccount,txnMerchant,txnIncludedOnly,txnTrendReview,
    trendOffset,trendFilter,weeklyOffset,weeklyDay,learnFilter,learnLanguage,learnQuery,learnPlaylist,learnItem,learnSavedQuery,splitQuery,activeSplitId,v7Selected,accountReturn}=state);
  rN();rC();
  $("CT").scrollTop=state.scroll;
}
function resetCashlyRoutes(){
  viewStack.clear();viewKey=null;viewDepth=0;
  sT="";catFilter="all";groupFilter="all";dateFrom="";dateTo="";cF="all";txnTab="txns";txnAccount="all";txnMerchant="";txnIncludedOnly=false;txnTrendReview=null;
  trendOffset=0;trendFilter={account:"all",categories:[],income:true,months:6};weeklyOffset=0;weeklyDay=null;
  learnFilter="all";learnLanguage="all";learnQuery="";learnPlaylist="";learnSavedQuery="";learnItem=null;activeSplitId=null;splitQuery="";accountReturn="spends";v7Selected=0;
  history.replaceState(null,"");
}
function sV(v,prepare){
  if(v==="home")v="spends";
  if(!viewKey){viewKey=crypto.randomUUID();history.replaceState({cashly:viewKey,depth:0},"");}
  viewStack.set(viewKey,captureCashlyRoute());
  if(v!==cV){
    viewKey=crypto.randomUUID();
    history.pushState({cashly:viewKey,depth:++viewDepth},"");
  }
  if(v==="weekly"&&cV!==v){weeklyOffset=0;weeklyDay=null;}
  if(v==="transactions"&&cV!==v){
    sT="";cF="all";catFilter="all";groupFilter="all";dateFrom="";dateTo="";txnTab="txns";
    txnAccount="all";txnMerchant="";txnIncludedOnly=false;txnTrendReview=null;
  }
  cV=v;
  if(prepare)prepare();
  viewStack.set(viewKey,captureCashlyRoute());
  rN();rC();
}
function closeRouteOverlay(){
  var dialog=document.querySelector("dialog[open]");
  if(dialog){dialog.close();return true;}
  if($("pinPrompt")){
    if($("pinPrompt").querySelector('[aria-label="Cancel PIN entry"]'))closePinModal();
    return true;
  }
  if(!$("OV").classList.contains("hidden")){cM();return true;}
  return false;
}
function goBackRoute(fallback){
  if(closeRouteOverlay())return;
  if(viewDepth>0)history.back();
  else if(fallback)sV(fallback);
}
window.addEventListener("popstate",function(event){
  if($("AS").classList.contains("hidden"))return;
  var current=viewKey,state=event.state;
  if(closeRouteOverlay()){
    if(current)history.pushState({cashly:current,depth:viewDepth},"");
    return;
  }
  var saved=viewStack.get(state?.cashly);
  if(!saved)return;
  if(current&&current!==state.cashly)viewStack.set(current,captureCashlyRoute());
  viewKey=state.cashly;viewDepth=state.depth;applyCashlyRoute(saved);
});
function cashlyHeaderSearch(){
  if(cV==="spends")sV("transactions");
  $("CT").querySelector('input[type="search"]')?.focus();
}
function rC(keepScroll){
  rememberCalculatorDraft();
  cleanLearnPlayer();
  var e=$("CT"),top=keepScroll?e.scrollTop:0;e.scrollTop=0;
  var hideNav = (cV==="article"||cV==="learnSaved"||cV==="learnAlerts"||cV==="calculatorDetail"||cV==="itr"||cV==="reports"||cV==="weekly"||cV==="preferences"||cV==="security"||cV==="notificationPrefs"||cV==="recurring"||cV==="transactions"||cV==="budgets"||cV==="account"||cV==="splitdetail");
  var nv=$("NV"); if(nv) nv.style.display = hideNav ? "none" : "";
  $("AH").style.display=hideNav?"none":"";
  
  if(cV==="calculatorDetail")e.innerHTML=rV7CalculatorDetail();
  else if(cV==="learn") {e.innerHTML=rLearn();loadCashlyBlogs();}
  else if(cV==="article")e.innerHTML=rLearnArticle();
  else if(cV==="learnSaved")e.innerHTML=rLearnSaved();
  else if(cV==="learnAlerts")e.innerHTML=rLearnAlerts();
  else if(cV==="calculators")e.innerHTML=rCashlyCalculators();
  else if(cV==="home")e.innerHTML=rHome();
  else if(cV==="spends")e.innerHTML=rHome();
  else if(cV==="transactions")e.innerHTML=rTxns();
  else if(cV==="account")e.innerHTML=rAccount();
  else if(cV==="splitdetail")e.innerHTML=rSplitDetail();
  else if(cV==="reports")e.innerHTML=v7Back("Trends by month","spends")+rReports();
  else if(cV==="budgets")e.innerHTML=v7Back("Budget planner","spends")+rBdg();
  else if(cV==="itr")e.innerHTML=v7Back("Tax & Earnings","account")+rITR();
  else if(cV==="splits")e.innerHTML=rSpl();
  else if(cV==="recurring")e.innerHTML=v7Back("Bills & dues","account")+rRec();
  else if(cV==="weekly")e.innerHTML=rWeekly();
  else if(cV==="preferences")e.innerHTML=rPreferences();
  else if(cV==="security")e.innerHTML=rSecurity();
  else if(cV==="notificationPrefs")e.innerHTML=rNotificationPreferences();
  if(keepScroll)e.scrollTop=top;
  if(!hideNav)rH();
}

function tH(t,d){
  var c=gC(t.category),ii=t.type==="income",isT=t.type==="transfer";
  var amtCol=t.excluded?"#aaa":ii?"#16A34A":isT?"#1565C0":"var(--text)";
  var arrow = isT ? "" : ii ? "+" : "−";
  var shownAmount=ii&&hideIncome()?"Hidden":arrow+fF(t.amount);
  var account=t.accountId&&getAccounts().find(function(item){return item.id===t.accountId}); // down-left for income, up-right for expense (Axio style)
  var note=t.note||c.l,date=String(t.date||"");
  var detail=c.l+(account?' · '+account.name:'')+(t.excluded?' · Excluded':'');
  return '<button class="tr cashly-transaction-row" data-id="'+esc(t.id)+'" onclick="editT(this.dataset.id)">'+
    '<span class="ti" aria-hidden="true" style="background:'+c.c+'14">'+categoryIcon(isT?"transfer":c.id)+'</span>'+
    '<span class="tf"><strong class="tn">'+esc(note)+'</strong><small class="td">'+esc(detail)+'</small></span>'+
    '<span class="transaction-value"><strong class="xta" style="color:'+amtCol+'">'+shownAmount+'</strong>'+
    '<small class="td">'+esc(date.slice(8))+' '+(MO[parseInt(date.slice(5,7),10)-1]||"")+'</small></span></button>';
}


function getNWS(txns){var n=0,w=0,sv=0;txns.forEach(function(t){if(t.type!=="expense"||t.excluded)return;var c=gC(t.category);var amount=financePaise(t.amount);if(c.g==="need")n+=amount;else if(c.g==="want")w+=amount;else if(c.g==="savings")sv+=amount});return{need:n/100,want:w/100,savings:sv/100}}

function rHome(){
  ensureAccounts();
  var now=new Date(), month=getMonthData(now.getFullYear(),now.getMonth());
  var inc=month.inc, exp=month.exp;
  var buPct=D.monthlyBudget>0?(exp/D.monthlyBudget*100):0;
  var overBudget=buPct>100;
  var sts=safeToSpend(D.monthlyBudget,exp,now);
  var nws=month.nws;
  var cd=month.cat;
  var pie=[];for(var k in cd){var c=gC(k);pie.push({l:c.l,i:c.i,c:c.c,v:cd[k],g:c.g,id:k})}pie.sort(function(a,b){return b.v-a.v});
  var pT=0;pie.forEach(function(p){pT+=p.v});

    // Axio-style dual-color ring: blue for budget portion, red when over
  var R=58,C=2*Math.PI*R;
  var underPct = Math.max(0,Math.min(buPct,100))/100;
  // When over: show full blue ring + red arc on top representing overflow intensity
  var blueDash = underPct * C;
  var blueGap = C - blueDash;
  var ringSvg='<svg class="axio-ring" viewBox="0 0 140 140">'+
    '<circle cx="70" cy="70" r="'+R+'" fill="none" stroke="var(--ring-track)" stroke-width="7"/>';
  if(overBudget){
    // Red full circle base when over budget
    ringSvg += '<circle cx="70" cy="70" r="'+R+'" fill="none" stroke="#c64549" stroke-width="7" stroke-linecap="round" '+
      'stroke-dasharray="'+C.toFixed(1)+' 0" transform="rotate(-90 70 70)"/>';
    // Blue arc for the "budget" portion (how much of the over is the original budget)
    var budgetShare = D.monthlyBudget > 0 ? (D.monthlyBudget/exp) : 0;
    budgetShare = Math.min(1, Math.max(0, budgetShare));
    var bDash = budgetShare * C;
    ringSvg += '<circle cx="70" cy="70" r="'+R+'" fill="none" stroke="#3863af" stroke-width="7" stroke-linecap="round" '+
      'stroke-dasharray="'+bDash.toFixed(1)+' '+(C-bDash).toFixed(1)+'" transform="rotate(-90 70 70)"/>';
  } else if(blueDash>0) {
    ringSvg += '<circle cx="70" cy="70" r="'+R+'" fill="none" stroke="#3863af" stroke-width="7" stroke-linecap="round" '+
      'stroke-dasharray="'+blueDash.toFixed(1)+' '+blueGap.toFixed(1)+'" transform="rotate(-90 70 70)"/>';
  }
  ringSvg += '<text x="70" y="75" text-anchor="middle" fill="var(--text)" font-size="17" font-weight="700">'+fF(exp)+'</text>'+
    '</svg>';

  // Last month summary
  var lm=new Date(now.getFullYear(),now.getMonth()-1,1);
  var lastMonth=getMonthData(lm.getFullYear(),lm.getMonth());
  var lmInc=lastMonth.inc,lmExp=lastMonth.exp;

  // Upcoming
  var today=new Date(),dayOfMonth=today.getDate();
  var upcoming=D.recurring.filter(function(r){
    var d=Number(r.dayOfMonth)||1;
    return d>=dayOfMonth&&d<=dayOfMonth+10;
  }).sort(function(a,b){return (a.dayOfMonth||1)-(b.dayOfMonth||1)}).slice(0,3);

  var h='<div style="animation:fadeUp .35s ease">';

  // === Axio-style Home Card ===
  h+='<div class="axio-home">';
  h+='<div class="axio-title">Spent in '+MOFULL[new Date().getMonth()]+'</div>';
  h+='<button class="axio-ring-wrap" aria-label="View transactions" onclick="sV(\'transactions\')" style="cursor:pointer">'+ringSvg+'</button>';
  var pctClass = overBudget ? "axio-pct over" : "axio-pct";
  var pctIcon = "";
  h+='<div style="text-align:center"><span class="'+pctClass+'">'+pctIcon+' '+(D.monthlyBudget>0?buPct.toFixed(0)+'%':'No budget set')+'</span></div>';
  h+='<div class="axio-stats">';
  h+='<button class="axio-stat" onclick="homeNav(\'income\')" style="cursor:pointer"><div class="axio-stat-label">Income</div><div class="axio-stat-val">'+(hideIncome()?'Hidden':fF(inc))+'</div></button>';
  h+='<button class="axio-stat" onclick="sV(\'budgets\')" style="cursor:pointer"><div class="axio-stat-label">Budget</div><div class="axio-stat-val">'+fF(D.monthlyBudget||0)+'</div></button>';
  h+='<div class="axio-stat"><div class="axio-stat-label">Safe to spend</div><div class="axio-stat-val">'+(fF(sts)+"/day")+'</div></div>';
  h+='</div></div>';

  h+='<div class="axio-pills">'+
    '<button class="axio-pill" onclick="sV(\'reports\')">'+v7Icon("chart")+' Trends</button>'+
    '<button class="axio-pill primary" onclick="sV(\'transactions\');txnTab=\'cats\';rC()">'+v7Icon("wallet")+' Categories</button></div>';

  // Recent transactions
  h+='<section class="sec cashly-recent"><div class="sh"><h2 class="st">Recent transactions</h2>';
  h+='<button class="xsa" style="background:var(--primary);color:#fff;padding:6px 12px;border-radius:20px;font-size:12px" onclick="oM(\'add\')">+ Add</button></div>';
  if(!D.transactions.length){
    h+='<div class="emp"><div class="empty-illust">\uD83D\uDCB8</div><div style="font-size:15px;font-weight:600;margin-bottom:6px">No transactions yet</div><div class="eps">Tap + Add to record your first expense</div></div>';
  } else {
    D.transactions.slice().sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))||
      (Number(b.createdAt)||0)-(Number(a.createdAt)||0)).slice(0,5).forEach(function(t){h+=tH(t,false)});
  }
  h+='<button class="v7-see" onclick="sV(\'transactions\')">All transactions ›</button></section>';

  h+='<button class="axio-last" onclick="trendOffset=-1;sV(\'reports\')">'+
    '<span class="axio-last-icon">'+v7Icon("chart")+'</span>'+
    '<span class="cashly-row-main"><strong class="axio-last-title">'+fF(lmExp)+' spent'+(hideIncome()?'':' & '+fF(lmInc)+' earned')+'</strong>'+
    '<small class="axio-last-sub">Review transactions in '+MO[lm.getMonth()]+'</small></span>'+
    '<span aria-hidden="true">›</span></button>';

  // Dues & Reminders
  if(upcoming.length){
    h+='<div class="sec"><div class="sh"><div class="st">Dues & Reminders</div><button class="xsa" onclick="sV(\'recurring\')">See all \u203A</button></div>';
    upcoming.forEach(function(r){
      var c=gC(r.category);
      h+='<div class="upcom-row" onclick="sV(\'recurring\')" style="cursor:pointer"><div class="upcom-day"><b>'+(r.dayOfMonth||1)+'</b></div><div style="flex:1"><div style="font-size:13px;font-weight:600">'+esc(r.name)+'</div><div style="font-size:11px;color:var(--text-muted)">'+c.i+' '+esc(c.l)+'</div></div><div style="font-weight:700;color:#E65100">'+fF(r.amount)+'</div></div>';
    });
    h+='</div>';
  }

  // Top Categories (quick view)
  if(pie.length>0){
    h+='<div class="sec"><div class="sh"><div class="st">Categories</div><button class="xsa" onclick="sV(\'budgets\')">See all \u203A</button></div><div class="wc">';
    pie.slice(0,4).forEach(function(p){
      var pc=pT?(p.v/pT*100).toFixed(0):0;
      h+='<div class="cr" onclick="fltrCat(\''+p.id+'\')" style="cursor:pointer"><div class="xci" style="background:'+p.c+'18">'+categoryIcon(p.id)+'</div><div style="flex:1"><div class="xcn">'+esc(p.l)+'</div><div class="bt"><div class="bf" style="width:'+pc+'%;background:'+p.c+'"></div></div></div><div class="xca">'+fF(p.v)+'</div></div>';
    });
    h+='</div></div>';
  }

  // Accounts strip
  h+='<div class="sec"><div class="sh"><div class="st">Accounts</div><button class="xsa" onclick="openAccounts()">Manage \u203A</button></div>';
  h+='<div class="acc-strip">';
  getAccounts().forEach(function(a){
    h+='<div class="acc-card" onclick="editAccount(\''+a.id+'\')">'+bankLogoHtml(a.name,36)+'<div class="acc-name">'+esc(a.name)+'</div><div class="acc-bal">'+fF(a.balance||0)+'</div></div>';
  });
  h+='<div class="acc-card acc-add" onclick="addAccount()"><div style="font-size:22px">+</div><div style="font-size:11px;font-weight:600">Add</div></div>';
  h+='</div></div>';

  h+='</div>';
  return h;
}

function rTxns(){
  // Axio-style top tabs: Transactions | Categories | Merchants
  var h = '<div class="wk-header" style="margin-bottom:4px"><button class="wk-back" aria-label="Back" onclick="goBackRoute(\'spends\')">\u2190</button><div class="wk-title">'+(cF==="income"?"All credit transactions":cF==="expense"?"All expenses":"Transactions")+'</div><button class="wk-back" aria-label="Account" onclick="sV(\'account\')">⚙</button></div>';
  h += '<div class="axio-tabs">';
  h += '<button class="axio-tab'+(txnTab==="txns"?" a":"")+'" onclick="txnTab=\'txns\';rC()">Transactions</button>';
  h += '<button class="axio-tab'+(txnTab==="cats"?" a":"")+'" onclick="txnTab=\'cats\';rC()">Categories</button>';
  h += '<button class="axio-tab'+(txnTab==="merch"?" a":"")+'" onclick="txnTab=\'merch\';rC()">Merchants</button>';
  h += '</div>';

  if(txnTab!=="txns"){
    h+='<div class="cashly-page-title"><span>'+esc(dateFrom||dateTo?(dateFrom||"Any start")+" to "+(dateTo||"today"):"This month")+
      '</span><button class="cashly-action" onclick="toggleFilters()">Filters</button></div>';
  }
  if(txnTab==="cats"){
    // Categories breakdown (Axio style)
    var mt=scopedCategoryTransactions();
    var cs=Object.create(null), total=0, counts=Object.create(null);
    mt.forEach(function(t){cs[t.category]=(cs[t.category]||0)+financePaise(t.amount); counts[t.category]=(counts[t.category]||0)+1; total+=financePaise(t.amount)});
    var list=[]; for(var k in cs){var c=gC(k); list.push({id:k,l:c.l,i:c.i,c:c.c,v:cs[k]/100,n:counts[k]})}
    total/=100;
    list.sort(function(a,b){return b.v-a.v});

    // Donut
    if(list.length&&!(cF==='income'&&hideIncome())){
      var colors=["#8B5CF6","#06B6D4","#F59E0B","#10B981","#EF4444","#EC4899","#6366F1","#84CC16"];
      var grad=[], acc=0;
      list.forEach(function(p,i){
        var pct = total ? (p.v/total*100) : 0;
        var col = p.c || colors[i%colors.length];
        grad.push(col+" "+acc.toFixed(1)+"% "+(acc+pct).toFixed(1)+"%");
        acc += pct;
      });
      h += '<div style="display:flex;justify-content:center;margin:8px 0 12px">';
      h += '<div style="width:170px;height:170px;border-radius:50%;background:conic-gradient('+grad.join(",")+');position:relative">';
      h += '<div style="position:absolute;inset:32px;background:var(--card);border-radius:50%"></div></div></div>';
      // Legend chips
      h += '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:14px;padding:0 8px">';
      list.slice(0,6).forEach(function(p,i){
        var pct = total ? (p.v/total*100).toFixed(1) : 0;
        var col = p.c || colors[i%colors.length];
        h += '<span style="font-size:11px;color:var(--text-muted)"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+col+';margin-right:3px"></span>'+esc(p.l)+' '+pct+'%</span>';
      });
      h += '</div>';
    }

    h += '<div class="cashly-row"><div class="cashly-row-main"><strong>'+
      (cF==="income"?"Filtered income":"Filtered expense")+'</strong></div><strong>'+
      (cF==="income"&&hideIncome()?"Hidden":fF(total))+'</strong></div>';

    h += '<div class="wc">';
    list.forEach(function(p){
      var pct = total ? (p.v/total*100).toFixed(1) : 0;
      h += '<div class="tr" onclick="filterByCategory(\''+p.id+'\')" style="cursor:pointer">';
      h += '<div class="ti" style="background:'+p.c+'18">'+categoryIcon(p.id)+'</div>';
      h += '<div class="tf"><div class="tn">'+esc(p.l)+'</div><div class="td">'+p.n+' record'+(p.n>1?"s":"")+'</div></div>';
      h += '<div style="text-align:right"><div class="xta">'+(cF==='income'&&hideIncome()?'Hidden':fF(p.v))+'</div>';
      h += '</div></div>';
    });
    if(!list.length) h += '<div class="emp"><div class="empty-illust">📊</div><div style="font-size:15px;font-weight:600">No matching records</div></div>';
    h += '</div>';
    return h;
  }

  if(txnTab==="merch"){
    var list = merchantTotals();
    h += '<div class="axio-spend-header"><div class="axio-spend-amt">'+list.length+'</div><div class="axio-spend-sub">Merchants</div></div>';
    h += '<div class="wc">';
    list.forEach(function(m,index){
      h += '<button class="tr cashly-merchant" onclick="filterByMerchant('+index+')">';
      h += '<div class="ti" style="background:#E0F2FE">🏪</div>';
      h += '<div class="tf"><div class="tn">'+esc(m.name)+'</div><div class="td">'+m.count+' record'+(m.count>1?"s":"")+'</div></div>';
      h += '<div class="xta">'+(cF==='income'&&hideIncome()?'Hidden':fF(m.paise/100))+'</div></button>';
    });
    if(!list.length) h += '<div class="emp"><div class="empty-illust">🏪</div><div style="font-size:15px;font-weight:600">No merchants yet</div></div>';
    h += '</div>';
    return h;
  }

  // Default: Transactions list
  var fl=D.transactions.filter(function(t){
    if(txnTrendReview&&!matchesTrend(t,txnTrendReview))return false;
    if(!matchesTransactionScope(t)||(txnMerchant&&merchantName(t)!==txnMerchant)||(txnIncludedOnly&&t.excluded))return false;
    if(cF==="income"&&t.type!=="income")return false;
    if(cF==="expense"&&t.type!=="expense")return false;
    if(catFilter!=="all"&&t.category!==catFilter)return false;
    if(groupFilter!=="all"&&gC(t.category).g!==groupFilter)return false;
    return transactionQueryMatch(t);
  });
  var gr=Object.create(null);fl.forEach(function(t){var d=t.date||"?";if(!gr[d])gr[d]=[];gr[d].push(t)});
  var ds=Object.keys(gr).sort(function(a,b){return b.localeCompare(a)});

  h += '<input class="xsi2" type="search" aria-label="Search transactions" placeholder="Search transactions" value="'+esc(sT)+'" oninput="searchTransactions(this.value)">';
  h += '<div class="fr">';
  h += '<button class="fb'+(cF==="all"?" a":"")+'" onclick="cF=\'all\';rC()">All</button>';
  h += '<button class="fb'+(cF==="income"?" a":"")+'" onclick="cF=\'income\';rC()">Income</button>';
  h += '<button class="fb'+(cF==="expense"?" a":"")+'" onclick="cF=\'expense\';rC()">Expense</button>';
  h += '<button class="fb" onclick="toggleFilters()" style="margin-left:auto">🔍 Filters</button></div>';
  if(txnTrendReview)h+='<button class="cashly-action" onclick="txnTrendReview=null;rC()">Clear trend filters</button>';
  if(txnMerchant||txnIncludedOnly)h+='<button class="cashly-action" onclick="txnMerchant=\'\';txnIncludedOnly=false;rC()">'+esc(txnMerchant||"Counted expenses")+' ×</button>';
  h += '<div id="transactionResults">';
  if(!ds.length){
    h += '<div class="emp"><div class="empty-illust">🔍</div><div style="font-size:15px;font-weight:600;margin-bottom:6px">No transactions match your filters</div><div class="eps">Try adjusting the date range or category filter above.</div></div>';
  } else {
    ds.forEach(function(d){
      h += '<div class="dh">'+esc(d)+'</div>';
      gr[d].forEach(function(t){h+=tH(t,true)});
    });
  }
  return h+'</div>';
}
function searchTransactions(value){
  sT=value;
  var template=document.createElement("template");
  template.innerHTML=rTxns();
  document.getElementById("transactionResults").replaceWith(template.content.querySelector("#transactionResults"));
}
function editT(id){
  var t=null;for(var i=0;i<D.transactions.length;i++)if(D.transactions[i].id===id){t=D.transactions[i];break}
  if(!t)return;
  oM("add");
  mS={type:t.type,category:t.category,amount:t.amount,note:t.note||"",date:t.date,editId:id,tags:t.tags||[],receipt:t.receipt||null,excluded:!!t.excluded,accountId:t.accountId||"",toAccountId:t.toAccountId||""};
  rM();
}
function toggleFilters(){
  var dialog=document.createElement("dialog");
  dialog.className="ledger-dialog";
  function options(items,selected){
    return items.map(function(item){return '<option value="'+esc(item[0])+'"'+(selected===item[0]?' selected':'')+'>'+esc(item[1])+'</option>'}).join("");
  }
  dialog.innerHTML='<form><div class="ledger-heading"><h2>Filter transactions</h2><button type="button" class="cashly-action" onclick="this.closest(\'dialog\').close()">Close</button></div>'+
    '<label>From<input type="date" name="from" value="'+esc(dateFrom)+'"></label>'+
    '<label>Through<input type="date" name="through" value="'+esc(dateTo)+'"></label>'+
    '<label>Account<select name="account">'+options([["all","All accounts"]].concat(getAccounts().map(function(a){return [a.id,a.name]})),txnAccount)+'</select></label>'+
    '<label>Category<select name="category">'+options([["all","All categories"]].concat((cF==="income"?iCats():cF==="expense"?eCats():CATS).map(function(c){return [c.id,c.l]})),catFilter)+'</select></label>'+
    '<p class="ledger-error" role="alert"></p><div class="trend-actions"><button type="button" class="cashly-action" onclick="clearPendingTransactions(this.form)">Clear filter</button>'+
    '<button type="submit" class="cashly-action">Apply filter</button></div></form>';
  dialog.querySelector("form").addEventListener("submit",function(event){
    event.preventDefault();
    var form=event.target,pending=new FormData(form);
    if(pending.get("from")&&pending.get("through")&&pending.get("from")>pending.get("through")){
      form.querySelector(".ledger-error").textContent="Choose a through date on or after the start date.";
      return;
    }
    dateFrom=pending.get("from");dateTo=pending.get("through");txnAccount=pending.get("account");
    catFilter=pending.get("category");groupFilter="all";
    dialog.close();
    rC();
  });
  document.body.append(dialog);
  dialog.addEventListener("close",function(){dialog.remove()},{once:true});
  dialog.showModal();
}
function clearPendingTransactions(form){
  form.elements.from.value=form.elements.through.value="";
  form.elements.account.value=form.elements.category.value="all";
}
function dT(id){showConfirm("Delete transaction?","This action cannot be undone.",function(){D.transactions=D.transactions.filter(function(t){return t.id!==id});sv();toast("Transaction deleted");cM();rC(true)},"Delete")}

function rBdg(){var now=new Date(),month=getMonthData(now.getFullYear(),now.getMonth()),ts=month.exp,cs=month.cat;
var budget=Math.max(0,Number(D.monthlyBudget)||0),pc=budget>0?Math.max(0,Math.min(100,ts/budget*100)):0;var nws=month.nws;var ec=eCats();
var h='<section class="wk-card budget-overview"><div class="ledger-heading"><h2>Overall budget</h2>'+
  '<button class="cashly-action" onclick="eMB()">Edit</button></div><strong>'+fF(budget)+'</strong>'+
  '<progress class="week-budget" value="'+pc+'" max="100" aria-label="Budget used"></progress>'+
  '<div class="week-day-summary"><span>'+fF(ts)+' spent</span><span>'+(!budget?'No budget set':ts>budget?fF(ts-budget)+' over budget':fF(budget-ts)+' remaining')+'</span></div></section>';
h+='<div class="nws-row"><div class="nws-card nws-need"><div class="nws-label">Needs</div><div class="nws-val" style="color:#2E7D32">'+fF(nws.need)+'</div></div><div class="nws-card nws-want"><div class="nws-label">Wants</div><div class="nws-val" style="color:#E65100">'+fF(nws.want)+'</div></div><div class="nws-card nws-savings"><div class="nws-label">Savings</div><div class="nws-val" style="color:#1565C0">'+fF(nws.savings)+'</div></div></div>';
// Group by Need/Want/Savings
["need","want","savings"].forEach(function(grp){var label=grp==="need"?"Needs (Essential)":grp==="want"?"Wants (Lifestyle)":"Savings & Investment";var cats=ec.filter(function(c){return c.g===grp});h+='<div class="st" style="margin-top:16px">'+label+'</div>';cats.forEach(function(cat){var sp=cs[cat.id]||0,bg=Number(D.budgets[cat.id])||0,p=bg>0?Math.min(100,sp/bg*100):0;h+='<div class="cbr" onclick="fltrCat(\''+cat.id+'\');" style="cursor:pointer"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="font-size:18px">'+categoryIcon(cat.id)+'</span><span style="font-size:13px;font-weight:500;flex:1">'+esc(cat.l)+'</span><button class="eb" onclick="event.stopPropagation();eCB(\''+cat.id+'\','+bg+')">'+(bg>0?fF(bg):"Set")+'</button></div>'+(bg>0?'<div class="bt"><div class="bf" style="width:'+p+'%;background:'+(p>90?"#E53935":cat.c)+'"></div></div><div style="color:#aaa;font-size:10px;margin-top:3px">'+fF(sp)+' / '+fF(bg)+'</div>':'')+(bg===0&&sp>0?'<div style="color:#aaa;font-size:10px">'+fF(sp)+' spent</div>':'')+'</div>'});
});return h}
function fltrCat(catId){sV('transactions',()=>{catFilter=catId;keepExpenseRange();cF='expense'});}
function eMB(){openBudgetEditor(null,D.monthlyBudget)}
function eCB(id,current){openBudgetEditor(id,current)}
function openBudgetEditor(id,current){
  var dialog=document.createElement("dialog");
  dialog.className="ledger-dialog";
  dialog.innerHTML='<form><div class="ledger-heading"><h2>'+esc(id?gC(id).l+" budget":"Monthly budget")+
    '</h2><button type="button" class="cashly-action" onclick="this.closest(\'dialog\').close()">Cancel</button></div>'+
    '<label>Amount ('+esc(getCurrSym())+')<input type="number" name="amount" min="0" max="9999999999.99" step="0.01" required value="'+
    esc(Number(current)||0)+'"></label><button class="sub" type="submit">Save budget</button></form>';
  dialog.querySelector("form").addEventListener("submit",function(event){
    event.preventDefault();
    var amount=Number(event.target.elements.amount.value);
    if(id)D.budgets[id]=amount;
    else D.monthlyBudget=amount;
    sv();
    dialog.close();
    rC();
  });
  document.body.append(dialog);
  dialog.addEventListener("close",function(){dialog.remove()},{once:true});
  dialog.showModal();
}

function rRec(){var h='<div class="sh"><div class="st" style="margin-bottom:0">Recurring Bills</div><button class="ab" onclick="oM(\'recurring\')">+ Add Bill</button></div>';if(!D.recurring.length)h+='<div class="emp"><div class="epi">🔄</div><div>No recurring bills</div></div>';else D.recurring.forEach(function(r){var c=gC(r.category);h+='<div class="xrc"><div style="display:flex;align-items:center;gap:12px"><div class="ti" style="background:'+c.c+'12">'+categoryIcon(c.id)+'</div><div style="flex:1"><div style="font-weight:600">'+esc(r.name)+'</div><div style="color:#aaa;font-size:12px">'+r.frequency+' - Day '+r.dayOfMonth+'</div></div><div style="font-weight:700;font-size:15px;color:#E64A19">'+fF(r.amount)+'</div><button class="dl" onclick="dR(\''+r.id+'\')">×</button></div></div>'});return h}
function dR(id){D.recurring=D.recurring.filter(function(r){return r.id!==id});sv();toast("Deleted");rC()}


function getWeekRange(offset){
  // offset 0 = this week, -1 = last week etc. Week starts Sunday
  var now = new Date();
  var day = now.getDay(); // 0=Sun
  var start = new Date(now);
  start.setDate(now.getDate() - day + (offset*7));
  start.setHours(0,0,0,0);
  var end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23,59,59,999);
  return {start:start, end:end};
}
function fmtDay(d){
  var days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  return days[d.getDay()];
}
function fmtShortDate(d){
  return d.getDate() + (d.getDate()>3&&d.getDate()<21?"th":(d.getDate()%10===1?"st":d.getDate()%10===2?"nd":d.getDate()%10===3?"rd":"th")) + " " + MOFULL[d.getMonth()];
}
var weeklyOffset=0, weeklyDay=null;
function changeSummaryWeek(step){
  weeklyOffset=Math.min(0,weeklyOffset+step);
  weeklyDay=null;
  rC();
}
function selectSummaryDay(index){
  weeklyDay=weeklyDay===index?null:index;
  rC(true);
  document.querySelector('.week-day[data-day="'+index+'"]')?.focus({preventScroll:true});
}
function addSummaryExpense(){
  oM("add");
  var day=new Date(getWeekRange(weeklyOffset).start);
  day.setDate(day.getDate()+(weeklyDay??Math.min(6,new Date().getDay())));
  mS.date=localDateKey(day);
  rM();
}
function rWeekly(){
  var range=getWeekRange(weeklyOffset),previous=getWeekRange(weeklyOffset-1);
  function expensesForWeek(week){
    var from=localDateKey(week.start),to=localDateKey(week.end);
    return D.transactions.filter(function(t){
      return t.type==="expense"&&!t.excluded&&t.date&&t.date>=from&&t.date<=to;
    });
  }
  function totalPaise(transactions){
    return transactions.reduce(function(sum,t){return sum+financePaise(t.amount)},0);
  }
  var expenses=expensesForWeek(range),total=totalPaise(expenses),previousTotal=totalPaise(expensesForWeek(previous));
  var days=Array.from({length:7},function(_,index){
    var date=new Date(range.start);
    date.setDate(date.getDate()+index);
    var key=localDateKey(date);
    var transactions=expenses.filter(function(t){return t.date===key});
    return {date:date,amount:totalPaise(transactions),transactions:transactions};
  });
  var maxDay=Math.max(1,...days.map(function(day){return day.amount}));
  var selected=weeklyDay===null?null:days[weeklyDay];
  var scoped=selected?selected.transactions:expenses;
  var change=previousTotal?Math.round(100*(total-previousTotal)/previousTotal):null;
  var h=v7Back("Weekly summary","account")+'<div class="week-picker">'+
    '<button class="cashly-action" aria-label="Previous week" onclick="changeSummaryWeek(-1)">‹</button>'+
    '<div><strong>'+(weeklyOffset===0?"This week":"Weekly spending")+'</strong><small>'+
    fmtShortDate(range.start)+' – '+fmtShortDate(range.end)+'</small></div>'+
    '<button class="cashly-action" aria-label="Next week" onclick="changeSummaryWeek(1)"'+(weeklyOffset===0?' disabled':'')+'>›</button></div>';
  h+='<div class="week-summary"><span>'+v7Icon("chart")+'</span><div><small>Total expenses</small><strong>'+fF(total/100)+
    '</strong></div>'+(change===null?'':'<small class="week-change">'+(change>0?'+':'')+change+'% vs prior week</small>')+'</div>';
  h+='<section class="week-chart" aria-label="Daily spending">';
  days.forEach(function(day,index){
    var amount=fF(day.amount/100),future=localDateKey(day.date)>tdy();
    h+='<button class="week-day" data-day="'+index+'" aria-pressed="'+(weeklyDay===index)+'" aria-label="'+
      fmtDay(day.date)+', '+fmtShortDate(day.date)+', '+amount+'" onclick="selectSummaryDay('+index+')"'+(future?' disabled':'')+'>'+
      '<span class="week-day-track"><span style="height:'+Math.round(day.amount/maxDay*100)+'%"></span></span>'+
      '<span>'+fmtDay(day.date)+'</span></button>';
  });
  h+='</section><div class="week-day-summary" aria-live="polite">'+
    '<div><strong>'+(selected?fmtDay(selected.date)+', '+fmtShortDate(selected.date):'All days')+'</strong>'+
    '<small>'+fF(totalPaise(scoped)/100)+'</small></div>'+
    '<button class="cashly-action" onclick="addSummaryExpense()">Add expense</button></div>';
  h+='<section class="wk-card"><h2 class="wk-card-title">Top spends</h2>';
  h+=scoped.length?scoped.slice().sort(function(a,b){return Number(b.amount)-Number(a.amount)}).slice(0,5).map(tH).join(""):
    '<p class="v7-sub">No expenses for this period.</p>';
  h+='</section>';
  var now=new Date(),spent=getMonthData(now.getFullYear(),now.getMonth()).exp;
  var budget=Number(D.monthlyBudget)||0,pct=budget>0?Math.round(spent/budget*100):0;
  h+='<section class="wk-card"><div class="week-day-summary"><div><h2 class="wk-card-title">Current month budget</h2>'+
    '<small>'+fF(spent)+' spent'+(budget>0?' of '+fF(budget):' · No budget set')+'</small></div>'+
    '<button class="cashly-action" onclick="sV(\'budgets\')">Open budget</button></div>'+
    '<progress class="week-budget" value="'+Math.min(100,Math.max(0,pct))+'" max="100" aria-label="Budget used"></progress>'+
    '<div class="week-day-summary"><span>Safe to spend</span><strong>'+fF(safeToSpend(budget,spent,now))+'/day</strong></div></section>';
  var categories=new Map();
  scoped.forEach(function(t){categories.set(t.category,(categories.get(t.category)||0)+financePaise(t.amount))});
  if(categories.size){
    h+='<section class="wk-card"><h2 class="wk-card-title">Top categories</h2>';
    Array.from(categories.entries()).sort(function(a,b){return b[1]-a[1]}).slice(0,5).forEach(function(entry){
      var category=gC(entry[0]);
      h+='<div class="week-category"><span class="ti" aria-hidden="true">'+categoryIcon(category.id)+'</span><span>'+
        esc(category.l)+'</span><strong>'+fF(entry[1]/100)+'</strong></div>';
    });
    h+='</section>';
  }
  return h;
}

function preferenceRow(icon,title,detail,action){
  return '<button class="preference-row" onclick="'+action+'"><span class="preference-icon">'+v7Icon(icon)+
    '</span><span><strong>'+esc(title)+'</strong><small>'+esc(detail)+'</small></span><span aria-hidden="true">›</span></button>';
}
function preferenceGroup(title,rows){
  return '<section class="preference-group"><h2>'+esc(title)+'</h2><div>'+rows+'</div></section>';
}
function preferenceSwitch(title,detail,checked,handler){
  return '<label class="preference-row preference-switch"><span class="preference-icon">'+v7Icon("lock")+
    '</span><span><strong>'+esc(title)+'</strong><small>'+esc(detail)+'</small></span>'+
    '<input type="checkbox" role="switch" aria-label="'+esc(title)+'" '+(checked?'checked ':'')+'onchange="'+handler+'"></label>';
}
function cashlyPreferenceKey(key){return uid?key+"_"+uid:key}
function getLaunchView(){return localStorage.getItem(cashlyPreferenceKey("cashly_launch")) === "learn" ? "learn" : "spends"}
function setLaunchView(spends){localStorage.setItem(cashlyPreferenceKey("cashly_launch"),spends?"spends":"learn")}
function rPreferences(){
  return v7Back("Preferences","account")+
    preferenceGroup("Startup and appearance",
      preferenceSwitch("Launch in Money Manager","On opens Spends. Off opens Learn.",getLaunchView()==="spends","setLaunchView(this.checked)")+
      preferenceSwitch("Dark mode","Use the dark Cashly palette.",getTheme()==="dark","toggleTheme()"))+
    preferenceGroup("Money Manager",
      preferenceRow("wallet","Manage accounts","Cash, bank accounts, cards and wallets","openAccounts()")+
      preferenceRow("split","Transfers","Record a transfer between two Cashly accounts","openTransferEntry()")+
      preferenceRow("clock","Manage reminders","View and add recurring bills","sV(\'recurring\')")+
      preferenceRow("chart","Spend categories","View categories and manage custom ones","openPreferenceCategories(\'e\')")+
      preferenceRow("wallet","Credit categories","View and manage income categories","openPreferenceCategories(\'i\')")+
      preferenceRow("book","Tags","Find transactions by a tag","openPreferenceTags()"))+
    preferenceGroup("Data and security",
      preferenceRow("clock","Notifications and reminders","Browser permissions and reminder status","sV(\'notificationPrefs\')")+
      preferenceRow("book","Backup","Download a JSON copy of your Cashly records","backupJSON()")+
      preferenceRow("lock","Security","Local app lock and device PIN","sV(\'security\')")+
      preferenceRow("search","Import bank SMS",window.SmsBridge?.isNative()?"Scan supported messages":"Paste bank messages to review transactions","openSMSImport()"));
}
function openTransferEntry(){
  oM("add");
  mS.type="transfer";
  rM();
}
function rNotificationPreferences(){
  var permission=getNotifPerm();
  var status={default:"Ask before sending",granted:"Allowed",denied:"Blocked in browser settings",unsupported:"Unavailable on this device"}[permission];
  return v7Back("Notifications and reminders","preferences")+preferenceGroup("Device permission",
    '<div class="preference-row"><span class="preference-icon">'+v7Icon("clock")+'</span><span><strong>'+esc(status)+
    '</strong><small>Cashly can show budget alerts and daily reminders while the app is running.</small></span></div>'+
    (permission==="default"?preferenceRow("clock","Allow notifications","Review the browser permission prompt","requestNotifPerm()"):""))+
    preferenceGroup("Recurring bills",preferenceRow("clock","Manage reminders","View and add bill reminders","sV(\'recurring\')"));
}
function hideIncome(){return localStorage.getItem(cashlyPreferenceKey("cashly_hide_income"))==="1"}
function setHideIncome(hidden){localStorage.setItem(cashlyPreferenceKey("cashly_hide_income"),hidden?"1":"0")}
function showTrendIncome(){return trendFilter.income&&!hideIncome()}
function rSecurity(){
  var pin=isPinSet();
  return v7Back("Security","preferences")+preferenceGroup("App lock",
    preferenceRow("lock",pin?"Remove device PIN":"Set device PIN",pin?"Enter the current PIN to remove it.":"Require a PIN after sign-in and after one minute in the background.",
      pin?"disablePin()":"setupPin()")+
    (pin?preferenceRow("lock","Lock Cashly","Require the PIN now.","lockCashly()"):""))+
    preferenceGroup("Screen privacy",preferenceSwitch("Hide income","Hide income amounts from Spends, Trends and transaction rows.",hideIncome(),"setHideIncome(this.checked)"))+
    '<p class="v7-sub">The device PIN locks the Cashly screen. Firebase handles account sign-in.</p>';
}
function openPreferenceCategories(type){
  var dialog=document.createElement("dialog");
  dialog.className="ledger-dialog";
  dialog.innerHTML='<form><div class="ledger-heading"><h2>'+(type==="i"?"Credit categories":"Spend categories")+'</h2>'+
    '<button class="cashly-action" type="button" onclick="this.closest(\'dialog\').close()">Close</button></div>'+
    '<div class="preference-categories">'+(type==="i"?iCats():eCats()).map(function(category){
      return '<div><span aria-hidden="true">'+categoryIcon(category.id)+'</span> '+esc(category.l)+'</div>';
    }).join("")+'</div><label>New category<input name="title" maxlength="48" required></label>'+
    (type==="e"?'<label>Group<select name="group"><option value="need">Needs</option><option value="want">Wants</option><option value="savings">Savings</option></select></label>':'')+
    '<p class="ledger-error" role="alert"></p><button type="submit" class="cashly-action">Add category</button></form>';
  dialog.querySelector("form").addEventListener("submit",function(event){
    event.preventDefault();
    var fields=new FormData(event.target),name=String(fields.get("title")).trim();
    var existing=type==="i"?iCats():eCats();
    if(!name||existing.some(function(category){return category.l.toLocaleLowerCase()===name.toLocaleLowerCase()})){
      dialog.querySelector(".ledger-error").textContent="Enter a distinct category name.";
      return;
    }
    var custom=getCustomCats();
    custom.push({id:"cust_"+crypto.randomUUID(),l:name,i:type==="i"?"↙":"•",c:"#407770",t:type,g:fields.get("group")||null,custom:true});
    saveCustomCats(custom);
    dialog.close();
    toast("Category added");
  });
  document.body.append(dialog);
  dialog.addEventListener("close",function(){dialog.remove()},{once:true});
  dialog.showModal();
}
function openPreferenceTags(){
  var tags=getAllTags();
  var dialog=document.createElement("dialog");
  dialog.className="ledger-dialog";
  dialog.innerHTML='<div class="ledger-heading"><h2>Tags</h2><button class="cashly-action" onclick="this.closest(\'dialog\').close()">Close</button></div>'+
    (tags.length?'<div class="tag-picker">'+tags.map(function(tag,index){
      return '<button class="cashly-action" data-tag="'+index+'">#'+esc(tag)+'</button>';
    }).join("")+'</div>':'<p>Add a tag when entering or editing a transaction.</p>');
  dialog.addEventListener("click",function(event){
    var button=event.target.closest("[data-tag]");
    if(!button)return;
    dialog.close();
    sV("transactions");
    sT="#"+tags[Number(button.dataset.tag)];
    rC();
  });
  document.body.append(dialog);
  dialog.addEventListener("close",function(){dialog.remove()},{once:true});
  dialog.showModal();
}

var trendOffset=0;
var trendFilter={account:"all",categories:[],income:true,months:6};
function matchesTrend(t,filter){
  return !t.excluded && (filter.account==="all"||t.accountId===filter.account) &&
    (t.type==="income" ? filter.income : t.type==="expense"&&(!filter.categories.length||filter.categories.includes(t.category)));
}
function trendMonth(year,month){
  var result=getMonthData(year,month);
  var visible=result.txns.filter(function(t){return matchesTrend(t,trendFilter)&&(!hideIncome()||t.type!=="income")});
  var sum=function(type){return visible.reduce(function(total,t){return total+(t.type===type?financePaise(t.amount):0)},0)/100};
  return {txns:visible,exp:sum("expense"),inc:sum("income"),nws:getNWS(visible)};
}
function openTrendFilters(){
  var dialog=document.createElement("dialog");
  dialog.className="ledger-dialog";
  dialog.innerHTML='<form><div class="ledger-heading"><h2>Filter trends</h2><button type="button" class="cashly-action" onclick="this.closest(\'dialog\').close()">Close</button></div>'+
    '<label>Period<select name="months"><option value="6"'+(trendFilter.months===6?' selected':'')+'>Last 6 months</option>'+
    '<option value="9"'+(trendFilter.months===9?' selected':'')+'>Last 9 months</option></select></label>'+
    '<label>Account<select name="account"><option value="all">All accounts</option>'+
    getAccounts().map(function(account){return '<option value="'+esc(account.id)+'"'+(trendFilter.account===account.id?' selected':'')+'>'+esc(account.name)+'</option>'}).join("")+
    '</select></label><label><span><input name="income" type="checkbox" '+(trendFilter.income?'checked':'')+'> Include income</span></label>'+
    '<fieldset><legend>Expense categories</legend>'+eCats().map(function(category){
      return '<label class="trend-category"><input type="checkbox" name="category" value="'+esc(category.id)+'" '+
        (trendFilter.categories.includes(category.id)?'checked':'')+'><span>'+categoryIcon(category.id)+' '+esc(category.l)+'</span></label>';
    }).join("")+'</fieldset><div class="trend-actions"><button type="button" class="cashly-action" onclick="clearPendingTrends(this.form)">Clear filter</button>'+
    '<button type="submit" class="cashly-action">Apply filter</button></div></form>';
  dialog.querySelector("form").addEventListener("submit",function(event){
    event.preventDefault();
    var pending=new FormData(event.target);
    trendFilter={account:pending.get("account"),categories:pending.getAll("category"),income:pending.has("income"),months:Number(pending.get("months"))};
    trendOffset=Math.max(1-trendFilter.months,trendOffset);
    dialog.close();
    rC();
  });
  document.body.append(dialog);
  dialog.addEventListener("close",function(){dialog.remove()},{once:true});
  dialog.showModal();
}
function clearPendingTrends(form){
  form.elements.months.value="6";
  form.elements.account.value="all";
  form.elements.income.checked=true;
  form.querySelectorAll('[name="category"]').forEach(function(input){input.checked=false});
}
function reviewTrendMonth(){
  var today=new Date(),start=new Date(today.getFullYear(),today.getMonth()+trendOffset,1);
  sV("transactions",function(){
    dateFrom=localDateKey(start);
    dateTo=localDateKey(new Date(start.getFullYear(),start.getMonth()+1,0));
    txnAccount=trendFilter.account;
    txnTrendReview={...trendFilter,account:"all",income:showTrendIncome()};
  });
}
function selectTrendMonth(offset){
  trendOffset=offset;
  rC(true);
  document.querySelector('.cashly-trends-month[data-offset="'+offset+'"]')?.focus({preventScroll:true});
}
function cashlyMonthlyTrends(today){
  var max=1,rows=[];
  for(var offset=1-trendFilter.months;offset<=0;offset++){
    var date=new Date(today.getFullYear(),today.getMonth()+offset,1);
    var month=trendMonth(date.getFullYear(),date.getMonth());
    max=Math.max(max,month.exp,month.inc);
    rows.push({date:date,exp:month.exp,inc:month.inc,offset:offset});
  }
  var h='<section class="cashly-trends" aria-label="Monthly spending and income trends"><div class="cashly-trends-head">'+
    '<h2 class="cashly-trends-title">Monthly activity</h2><button class="cashly-action" onclick="openTrendFilters()">Filter</button></div>'+
    '<div class="trend-grid" style="--months:'+rows.length+'">';
  rows.forEach(function(row){
    var value=Math.max(0,Math.round(row.exp/max*100));
    h+='<button class="cashly-trends-month" data-offset="'+row.offset+'" aria-pressed="'+(trendOffset===row.offset)+
      '" aria-label="'+MOFULL[row.date.getMonth()]+' '+row.date.getFullYear()+', spent '+fF(row.exp)+
      (showTrendIncome()?', earned '+fF(row.inc):'')+'" onclick="selectTrendMonth('+row.offset+')">'+
      '<span class="trend-scale"><span class="trend-spend-bar" style="height:'+value+'%"></span></span>'+
      '<span class="cashly-trends-label">'+MO[row.date.getMonth()]+'</span></button>';
  });
  if(showTrendIncome()){
    var points=rows.map(function(row,index){
      return [(index+.5)*100/rows.length, 96-Math.max(0,row.inc/max)*92];
    });
    h+='<svg class="trend-income-line" aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">'+
      '<polyline points="'+points.map(function(point){return point.join(",")}).join(" ")+'" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/>'+
      points.map(function(point){return '<circle cx="'+point[0]+'" cy="'+point[1]+'" r="0.8" fill="currentColor"/>'}).join("")+'</svg>';
  }
  return h+'</div><div class="cashly-trends-legend"><span><i class="cashly-trends-dot trend-spent"></i>Spent</span>'+
    (showTrendIncome()?'<span><i class="trend-legend-line"></i>Earned</span>':'')+'</div></section>';
}

function rReports(){
  var today=new Date(),now=new Date(today.getFullYear(),today.getMonth()+trendOffset,1);
  var thisMonth=trendMonth(now.getFullYear(),now.getMonth());
  var lastMonthDate=new Date(now.getFullYear(),now.getMonth()-1,1);
  var lastMonth=trendMonth(lastMonthDate.getFullYear(),lastMonthDate.getMonth());
  var account=getAccounts().find(function(item){return item.id===trendFilter.account});
  var changeExp=lastMonth.exp>0?((thisMonth.exp-lastMonth.exp)/lastMonth.exp*100):0;
  var dayAvg=getDayAvg(thisMonth.txns);
  var topMerchants=getTopMerchants(thisMonth.txns,5);
  var savings=thisMonth.inc-thisMonth.exp;
  var savingsRate=thisMonth.inc>0?(savings/thisMonth.inc*100):0;
  
  var monthName=MOFULL[now.getMonth()]+' '+now.getFullYear();
  var budget=trendOffset===0?Number(D.monthlyBudget)||0:null;
  var h='<div class="trend-report">'+cashlyMonthlyTrends(today)+
    '<section class="wk-card trend-month-summary"><div class="week-day-summary"><h2 class="wk-card-title">'+monthName+
    '</h2><small>'+esc(account?account.name:"All accounts")+'</small></div>'+
    '<div class="trend-summary-grid'+(showTrendIncome()?'':' no-income')+'"><div class="trend-spent-card"><small>Spent</small><strong>'+fF(thisMonth.exp)+
    '</strong></div>'+(showTrendIncome()?'<div class="trend-earned-card"><small>Earned</small><strong>'+fF(thisMonth.inc)+'</strong></div>':'')+
    '<div class="trend-budget-card"><small>Overall budget</small><strong>'+(budget===null?'Unavailable':budget>0?fF(budget):'Not set')+
    '</strong></div></div><button class="cashly-action trend-review" onclick="reviewTrendMonth()">Review '+MO[now.getMonth()]+' '+now.getFullYear()+'</button></section>';

  // Stats grid
  h+='<div class="stat-grid">';
  if(lastMonth.exp>0)h+='<div class="stat-card"><div class="stat-label">Spend change</div><div class="stat-value">'+(changeExp>0?'+':'')+changeExp.toFixed(0)+'%</div><div class="stat-change">Compared with the prior month</div></div>';

  if(showTrendIncome())h+='<div class="stat-card"><div class="stat-label">Saved</div><div class="stat-value" style="color:'+(savings>=0?"#1565C0":"#E53935")+'">'+(savings < 0 ? '−' : '')+fF(savings)+'</div><div class="stat-change">'+savingsRate.toFixed(0)+'% of income</div></div>';
  h+='<div class="stat-card"><div class="stat-label">Daily Avg</div><div class="stat-value">'+fF(dayAvg)+'</div><div class="stat-change">'+thisMonth.txns.filter(function(t){return t.type==="expense"}).length+' transactions</div></div>';
  h+='</div>';
  
  // 50/30/20 Rule
  h+='<div class="report-card"><div style="font-weight:700;font-size:14px;margin-bottom:12px">50/30/20 Rule Check</div>';
  if(thisMonth.exp>0){
    var totalSpent=thisMonth.exp;
    var needPct=thisMonth.nws.need/totalSpent*100;
    var wantPct=thisMonth.nws.want/totalSpent*100;
    var savPct=thisMonth.nws.savings/totalSpent*100;
    h+='<div class="report-bar"><div class="report-bar-name">Needs</div><div class="report-bar-track"><div class="report-bar-fill" style="width:'+needPct+'%;background:#2E7D32"></div></div><div class="report-bar-val">'+needPct.toFixed(0)+'%</div></div>';
    h+='<div class="report-bar"><div class="report-bar-name">Wants</div><div class="report-bar-track"><div class="report-bar-fill" style="width:'+wantPct+'%;background:#E65100"></div></div><div class="report-bar-val">'+wantPct.toFixed(0)+'%</div></div>';
    h+='<div class="report-bar"><div class="report-bar-name">Savings</div><div class="report-bar-track"><div class="report-bar-fill" style="width:'+savPct+'%;background:#1565C0"></div></div><div class="report-bar-val">'+savPct.toFixed(0)+'%</div></div>';
    h+='<div style="font-size:11px;color:var(--text-muted);margin-top:10px">Ideal: 50% Needs, 30% Wants, 20% Savings</div>';
  }else{h+='<div style="color:#aaa;text-align:center;padding:10px">No expenses this month</div>'}
  h+='</div>';
  
  // Top Merchants
  if(topMerchants.length){
    h+='<div class="report-card"><div style="font-weight:700;font-size:14px;margin-bottom:12px">Top 5 Merchants</div>';
    var max=topMerchants[0].amt;
    topMerchants.forEach(function(m,i){
      var p=(m.amt/max*100);
      h+='<div class="report-bar"><div class="report-bar-name">'+esc(m.name.slice(0,12))+'</div><div class="report-bar-track"><div class="report-bar-fill" style="width:'+p+'%;background:linear-gradient(90deg,#16A34A,#16A34A)"></div></div><div class="report-bar-val">'+fF(m.amt)+'</div></div>';
    });
    h+='</div>';
  }
  
  // Tags overview
  var allTags=getAllTags();
  if(allTags.length){
    h+='<div class="report-card"><div style="font-weight:700;font-size:14px;margin-bottom:12px">Your Tags</div><div>';
    allTags.slice(0,15).forEach(function(t){h+='<span class="tag" style="font-size:12px;padding:4px 12px;margin:3px">#'+esc(t)+'</span>'});
    h+='</div></div>';
  }
  
  // Premium teaser
  if(!isPremium()){
    h+='<div class="report-card" style="background:linear-gradient(135deg,#FFD700,#FFA000);color:#000;cursor:pointer" onclick="showPremiumModal()"><div style="display:flex;align-items:center;gap:10px"><div style="font-size:28px">\u{1F48E}</div><div style="flex:1"><div style="font-weight:700;font-size:14px">Get Premium</div><div style="font-size:11px;opacity:.8">Unlimited features for \u20B999/year</div></div><div style="font-size:18px">\u203A</div></div></div>';
  }
  
  return h+'</div>';
}



// ===== ITR DATA STRUCTURE =====
// D.itrData = { fyData: {...}, earnings: [...], cashback: [...], locked: true }
// D.itrFile = { url, uploadedAt, fileName }

var ITR_SUBTAB = "summary"; // summary | earnings | cashback | add
var itrUnlocked = false;

function getITRData(){if(!D.itrData)D.itrData={fyData:{},earnings:[],cashback:[],locked:true};return D.itrData}

// ===== FIREBASE STORAGE UPLOAD =====
function ownItrPath(path,owner){
  var prefix="users/"+owner+"/itr/";
  return typeof path==="string"&&path.startsWith(prefix)&&/^[^/]+\.xlsx?$/i.test(path.slice(prefix.length));
}
function uploadITRFile(){
  var owner=uid,inp=document.createElement("input");
  inp.type="file";inp.accept=".xlsx,.xls";
  inp.onchange=function(event){
    var file=event.target.files[0];
    if(!file||!syncOwner(owner))return;
    if(file.size>5*1024*1024){toast("File too large (max 5MB)");return;}
    if(!/\.xlsx?$/i.test(file.name))return toast("Choose an Excel spreadsheet");
    parseITRFile(file);
    D.itrFile={fileName:file.name,uploadedAt:Date.now(),localOnly:true};
    sv();
    if(!storage)return;
    var path="users/"+owner+"/itr/"+crypto.randomUUID()+file.name.match(/\.xlsx?$/i)[0];
    storage.ref(path).put(file).then(function(){
      if(!syncOwner(owner)||D.itrFile?.fileName!==file.name)return;
      D.itrFile={uploadedAt:Date.now(),fileName:file.name,path:path};
      sv();rC(true);
    }).catch(function(){if(syncOwner(owner))toast("Data parsed. Cloud backup unavailable.");});
  };
  inp.click();
}
async function fetchITRFromCloud(){
  var owner=uid,path=D.itrFile?.path;
  if(!syncOwner(owner)||!storage||!ownItrPath(path,owner))return toast("No verified cloud file is available. Import your local spreadsheet.");
  toast("Fetching from cloud…");
  try{
    var user=auth.currentUser,token=await user.getIdToken();
    if(!syncOwner(owner))return;
    var bucket=storage.ref().bucket;
    var response=await fetch("https://firebasestorage.googleapis.com/v0/b/"+encodeURIComponent(bucket)+"/o/"+encodeURIComponent(path)+"?alt=media",
      {headers:{Authorization:"Firebase "+token},signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error("Unable to read your cloud backup");
    var blob=await response.blob();
    if(syncOwner(owner))parseITRFile(blob);
  }catch(error){if(syncOwner(owner))toast("Unable to read your cloud backup");}
}
async function deleteITRFile(){
  var owner=uid;
  if(!D.itrFile||!syncOwner(owner))return toast("No file to delete");
  if(!confirm("Delete uploaded Excel file?"))return;
  var path=D.itrFile.path;
  if(path){
    if(!storage||!ownItrPath(path,owner))return toast("The cloud backup path could not be verified");
    try{await storage.ref(path).delete();}catch(error){
      if(error.code!=="storage/object-not-found"){toast("Cloud deletion failed. Your records were kept.");return;}
    }
  }
  if(!syncOwner(owner))return;
  D.itrFile=null;D.itrData={fyData:{},earnings:[],cashback:[],locked:true};
  sv();toast("Deleted");rC();
}

// ===== EXCEL PARSER =====
function parseITRFile(file){
  var owner=uid;
  if(!window.XLSX){toast("Excel library not loaded");return}
  var reader=new FileReader();
  reader.onload=function(e){
    if(!syncOwner(owner))return;
    try{
      var data=new Uint8Array(e.target.result);
      var wb=XLSX.read(data,{type:"array"});
      var parsed={fyData:{},earnings:[],cashback:[],locked:true};
      
      wb.SheetNames.forEach(function(sn){
        var ws=wb.Sheets[sn];
        var rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:""});
        var lower=sn.toLowerCase();
        
        if(lower.indexOf("earning")>-1||lower.indexOf("expense")>-1){
          parsed.earnings=parseEarningsSheet(rows,ws);
        }else if(lower.indexOf("cashback")>-1||lower.indexOf("paytm")>-1||lower.indexOf("card")>-1){
          parsed.cashback=parseCashbackSheet(rows);
        }else{
          // Treat as FY data sheet
          var fyData=parseFYSheet(rows,ws,sn);
          Object.assign(parsed.fyData,fyData);
        }
      });
      
      D.itrData=parsed;
      sv();
      toast("Parsed "+Object.keys(parsed.fyData).length+" FYs, "+parsed.earnings.length+" years, "+parsed.cashback.length+" months");
      rC();
    }catch(err){
      toast("Parse error: "+err.message);
      console.error(err);
    }
  };
  if(file instanceof Blob)reader.readAsArrayBuffer(file);
  else reader.readAsArrayBuffer(file);
}

// Parse FY sheet (Fin. Year 2024-25 style)
function parseFYSheet(rows,ws,sheetName){
  var fys={};var currentFY=null;
  var mode=null; // income | deduction
  
  for(var i=0;i<rows.length;i++){
    var r=rows[i];var r0=(r[0]||"").toString().trim();
    
    // Detect FY header
    var fyMatch=r0.match(/Financial\s*Year\s*(\d{4})[-\s]*(\d{2,4})/i)||r0.match(/FY\s*(\d{4})[-\s]*(\d{2,4})/i)||r0.match(/(\d{4})[-\s]*(\d{2,4})\s*(?:FY|Tax|Year)/i);
    if(fyMatch){
      var y1=fyMatch[1];var y2=fyMatch[2].length===2?fyMatch[2]:fyMatch[2].slice(-2);
      currentFY=y1+"-"+y2;
      fys[currentFY]={fy:currentFY,incomes:[],exemptions:[],deductions:[],totals:{},hra:{},notes:""};
      continue;
    }
    
    if(!currentFY)continue;
    var fy=fys[currentFY];
    
    // Skip header rows
    if(r0.toLowerCase()==="period"||r0.toLowerCase().indexOf("total")===0){
      if(r0.toLowerCase().indexOf("total")===0){
        fy.totals.income=parseNum(r[1]);
        fy.totals.exemption=parseNum(r[2]);
        fy.totals.deduction=parseNum(r[11])||parseNum(r[4]);
      }
      continue;
    }
    if(r0.toLowerCase().indexOf("taxable")===0){
      fy.totals.taxable=parseNum(r[1]);continue;
    }
    if(r0.toLowerCase().indexOf("hra")===0){
      fy.hra.claim=parseNum(r[3]);continue;
    }
    
    // Income rows (Salary JPFL, Mutual Fund Interest, etc.)
    if(r0&&(r[1]||r[2])){
      var income=parseNum(r[1]);
      var exempt=parseNum(r[2]);
      if(income>0){
        var note=getCellNote(ws,i+1,0)||getCellNote(ws,i+1,1);
        fy.incomes.push({period:r0,amount:income,source:r0,note:note});
      }
    }
    
    // Exemption entries (Section + Head columns)
    if(r[3]&&r[4]){
      var sec=(r[3]||"").toString().trim();
      var head=(r[4]||"").toString().trim();
      if(sec&&head){
        var note=getCellNote(ws,i+1,4);
        fy.exemptions.push({section:sec,head:head,amount:parseNum(r[2]),note:note});
      }
    }
    
    // Deduction entries (columns L=11, M=12, N=13)
    if(r[12]&&r[13]){
      var dsec=(r[12]||"").toString().trim();
      var scheme=(r[13]||"").toString().trim();
      var damt=parseNum(r[11]);
      if(dsec){
        fy.deductions.push({section:dsec,scheme:scheme,amount:damt,note:""});
      }
    }
  }
  return fys;
}

// Parse Earnings sheet (lifetime 1994-2026)
function parseEarningsSheet(rows,ws){
  var out=[];
  for(var i=0;i<rows.length;i++){
    var r=rows[i];
    var year=parseNum(r[0]);
    if(!year||year<1990||year>2050)continue;
    out.push({
      year:year,
      fyPeriod:(r[1]||"").toString(),
      workPeriod:(r[2]||"").toString(),
      earnedActual:parseNum(r[3]),
      earnedInflation:parseNum(r[4]),
      source:(r[5]||"").toString(),
      itrFilled:(r[6]||"").toString(),
      gaveHomeActual:parseNum(r[7]),
      gaveHomeInflation:parseNum(r[8]),
      loanActual:parseNum(r[9]),
      loanInflation:parseNum(r[10]),
      savingsActual:parseNum(r[11]),
      expenseActual:parseNum(r[12]),
      expenseInflation:parseNum(r[13]),
      note:getCellNote(ws,i+1,7)||getCellNote(ws,i+1,3)||getCellNote(ws,i+1,9)||getCellNote(ws,i+1,11)
    });
  }
  return out;
}

// Parse cashback sheet
function parseCashbackSheet(rows){
  var out=[];
  for(var i=1;i<rows.length;i++){
    var r=rows[i];
    if(!r[0])continue;
    var d=null;
    // SheetJS raw:true returns Date objects for date cells
    if(r[0] instanceof Date){
      d=r[0];
    } else {
      // Fallback: try parsing string
      var s=""+r[0];
      if(s.toLowerCase().indexOf("total")>-1||s.toLowerCase().indexOf("month")>-1)continue;
      // Handle Excel serial number (44743 = days since 1899-12-30)
      var serial=parseFloat(s);
      if(!isNaN(serial)&&serial>40000&&serial<50000){
        d=new Date(Math.round((serial-25569)*86400*1000));
      } else {
        d=new Date(s);
      }
    }
    if(!d||isNaN(d.getTime()))continue;
    var earned=parseNum(r[1]);
    if(!earned)continue;
    out.push({
      month:d.toISOString().slice(0,7),
      monthLabel:d.toLocaleDateString("en-IN",{year:"numeric",month:"short"}),
      earned:earned,
      charges:parseNum(r[2]),
      rentCharges:parseNum(r[3]),
      net:parseNum(r[4])
    });
  }
  return out.sort(function(a,b){return b.month.localeCompare(a.month)});
}

function evaluateImportedArithmetic(expression){
  var input=String(expression).replace(/\s+/g,""),cursor=0;
  function take(token){
    if(!input.startsWith(token,cursor))return false;
    cursor+=token.length;return true;
  }
  function atom(){
    if(take("(")){
      var value=additive();
      if(!take(")"))throw Error("Invalid formula");
      return value;
    }
    var token=/^(?:\d+(?:\.\d*)?|\.\d+)/.exec(input.slice(cursor))?.[0];
    if(!token)throw Error("Invalid number");
    cursor+=token.length;
    return Number(token);
  }
  function power(){var value=atom();return take("**")?value**unary():value;}
  function unary(){return take("+")?unary():take("-")?-unary():power();}
  function product(){
    var value=unary();
    while(cursor<input.length){
      if(take("*"))value*=unary();
      else if(take("/"))value/=unary();
      else break;
    }
    return value;
  }
  function additive(){
    var value=product();
    while(cursor<input.length){
      if(take("+"))value+=product();
      else if(take("-"))value-=product();
      else break;
    }
    return value;
  }
  if(!input||input.length>1500||!/^[0-9.+\-*/()]+$/.test(input))return 0;
  try{
    var result=additive();
    return cursor===input.length&&Number.isFinite(result)?result:0;
  }catch(error){return 0;}
}
function parseNum(value){
  if(value===null||value===undefined||value instanceof Date)return 0;
  var text=String(value);
  if(text.startsWith("="))return evaluateImportedArithmetic(text.slice(1));
  var result=parseFloat(text.replace(/[, ₹]/g,""));
  return Number.isFinite(result)?result:0;
}
function getCellNote(ws,row,col){
  try{
    var addr=XLSX.utils.encode_cell({r:row,c:col});
    var cell=ws[addr];
    if(cell&&cell.c&&cell.c.length){return cell.c.map(function(x){return x.t}).join(" ")}
  }catch(e){}
  return "";
}

// ===== HRA CALCULATOR =====
function calcHRA(basic,hraReceived,rentPaid,isMetro){
  if(!basic||!rentPaid)return 0;
  var pct=isMetro?0.5:0.4;
  var actual=hraReceived||0;
  var pctBasic=basic*pct;
  var rentMinus10=rentPaid-(basic*0.1);
  if(rentMinus10<0)rentMinus10=0;
  return Math.min(actual,pctBasic,rentMinus10);
}

// ===== ITR RENDER =====

/* Cashly navigation and split detail — V3 */
var activeSplitId=null;
function openSplit(id){sV("splitdetail",()=>{activeSplitId=id})}
function rLegacySplitDetail(){
 var s=D.splits.find(function(x){return x.id===activeSplitId});
 if(!s)return '<div class="wk-header"><button class="wk-back" onclick="sV(\'splits\')">←</button>Split not found</div>';
 var n=(s.people||[]).length||1, share=Number(s.total||0)/n, settled=0;
 var h='<div class="wk-header"><button class="wk-back" onclick="sV(\'splits\')">←</button><div class="wk-title">'+esc(s.title)+'</div></div>';
 h+='<div class="cashly-summary"><div class="cashly-caption">Total group expense</div><div class="cashly-large">'+fF(s.total)+'</div><div class="cashly-caption">Equal share · '+n+' people · '+fF(share)+' each</div></div>';
 h+='<div class="cashly-section">Members and settlements</div>';
 (s.people||[]).forEach(function(person,i){if(person.settled)settled++;h+='<div class="cashly-row"><div class="cashly-avatar">'+esc((person.name||'?').charAt(0).toUpperCase())+'</div><div class="cashly-row-main"><strong>'+esc(person.name)+'</strong><small>'+(person.settled?'Settled':'Share due: '+fF(share))+'</small></div><button class="cashly-action" onclick="toggleSplitSettled('+i+')">'+(person.settled?'Undo':'Mark paid')+'</button></div>'});
 h+='<div class="cashly-summary" style="margin-top:16px"><div class="cashly-caption">Settlement progress</div><div class="cashly-large">'+settled+' / '+n+'</div><div class="cashly-caption">Mark paid only after confirming payment outside Cashly. No money is transferred here.</div></div>';
 return h;
}
function toggleSplitSettled(i){var s=D.splits.find(function(x){return x.id===activeSplitId});if(!s||!s.people||!s.people[i])return;s.people[i].settled=!s.people[i].settled;sv();rC()}
function openAccounts(){
  oM("settings");
  document.getElementById("accSection")?.scrollIntoView({block:"start"});
}
function rAccount(){
 var name=ad&&ad.name||'Cashly user',ini=name.charAt(0).toUpperCase(),phone=ad&&/^\d{10}$/.test(ad.phone)?'+91 '+ad.phone:'No mobile number linked';
 var h=v7Back("Account",accountReturn);
 h+='<div class="cashly-profile"><div class="cashly-profile-avatar">'+accountAvatar(ini)+'</div><div><strong>'+esc(name)+'</strong><small>'+esc(phone)+'</small><small>'+(ad&&ad.email?esc(ad.email):'Cashly by VKS Tech')+'</small></div></div>';
 function link(icon,title,sub,action){if(!icon.startsWith("<svg"))icon=v7Icon(({"Edit profile":"user","Preferences":"lock","Weekly summary":"chart","Export statement":"book","Splits":"split"})[title]||"wallet");return '<button class="cashly-row cashly-link" onclick="'+action+'"><div class="cashly-row-icon">'+icon+'</div><div class="cashly-row-main"><strong>'+title+'</strong><small>'+sub+'</small></div><span>›</span></button>'}
 h+='<div class="cashly-section">My account</div>';
 h+=link('✎','Edit profile','Name, phone and profile photo','editProfile()');
 h+=link('🏦','Accounts & sources','Bank, cash, wallet and credit cards','openAccounts()');
 h+='<div class="cashly-section">Expense tracking</div>';
 h+=link('⚙','Preferences','Spending categories, security and notifications','sV(\'preferences\')');
 h+=link('📊','Weekly summary','Review spending by day','sV(\'weekly\')');
 h+=link('📄','Export statement','Create a PDF statement','oM(\'pdfrange\')');
 h+=link('💬','Import bank SMS','Add expenses from messages','openSMSImport()');
 h+=link(v7Icon('search'),'Report undetected SMS','Send the message format with personal details removed','location.href=\'support.html\'');
 h+=link('👥','Splits','Group expenses and settlements','sV(\'splits\')');
 h+='<div class="cashly-section">Financial tools</div>';
 h+=link(v7Icon('calculator'),'Tax & Earnings','ITR and lifetime earnings','sV(\'itr\')');
 h+=link(v7Icon('clock'),'Recurring bills','Manage reminders','sV(\'recurring\')');
 h+='<div class="cashly-section">General</div>';
 h+=link('🔒','Privacy and settings','PIN, backup, theme and data controls','oM(\'settings\')');
 h+=link('✉','Contact Cashly','Cashly@vkstech.com',"window.location.href='mailto:Cashly@vkstech.com'");
 h+=link(v7Icon('book'),'Blogs','Read Cashly articles','sV(\'learn\')');
 h+=link(v7Icon('lock'),'Privacy policy','','location.href=\'privacy.html\'');
 h+=link(v7Icon('book'),'Terms and conditions','','location.href=\'terms.html\'');
 h+=link(v7Icon('user'),'Delete account','','location.href=\'delete-account.html\'');
 h+=link(v7Icon('exit'),'Logout','','logout()');
 h+=link(v7Icon('split'),'Invite friends and family','Share the official Cashly app','shareApp()');
 h+=link(v7Icon('book'),'Help and FAQ','Support resources','location.href=\'support.html\'');
 h+=link('ⓘ','About Cashly','Made with care by VKS Tech','window.location.href=\'support.html\'');
 return h;
}
