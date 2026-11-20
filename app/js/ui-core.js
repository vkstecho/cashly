/* Cashly – ui-core.js */
function rH(){
  var nm=ad?ad.name:"User",ini=nm.charAt(0).toUpperCase();
  $("AH").innerHTML='<div class="hl"><div class="hav">'+ini+'</div><div class="hn">Hi '+esc(nm)+'</div></div><div class="ha"><button class="hb" onclick="sV(\'transactions\')" aria-label="Search">🔍</button></div>';
}


var TABS=[["home","🏠","Home"],["reports","📊","Trends"],["splits","👥","Splits"],["itr","•••","More"]];
var txnTab="txns"; // txns | cats | merch
function rN(){
  var icons = {
    home: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z"/></svg>',
    reports: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>',
    splits: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>',
    itr: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
    transactions: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>',
    budgets: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
  };
  var h="";
  for(var i=0;i<TABS.length;i++){
    var t=TABS[i];
    var icon = icons[t[0]] || t[1];
    h+='<button class="xnb'+(cV===t[0]?" a":"")+'" onclick="sV(\''+t[0]+'\')"><span class="xni">'+icon+'</span><span class="xnl">'+t[2]+'</span></button>';
  }
  $("NV").innerHTML=h;
}
function sV(v){cV=v;sT="";cF="all";catFilter="all";groupFilter="all";dateFrom="";dateTo="";if(v==="transactions")txnTab="txns";rN();rC()}
function rC(){
  var e=$("CT");e.scrollTop=0;
  var hideNav = (cV==="weekly"||cV==="preferences"||cV==="recurring"||cV==="transactions"||cV==="budgets");
  var nv=$("NV"); if(nv) nv.style.display = hideNav ? "none" : "";
  if(cV==="home")e.innerHTML=rHome();
  else if(cV==="transactions")e.innerHTML=rTxns();
  else if(cV==="reports")e.innerHTML=rReports();
  else if(cV==="budgets")e.innerHTML=rBdg();
  else if(cV==="itr")e.innerHTML=rITR();
  else if(cV==="splits")e.innerHTML=rSpl();
  else if(cV==="recurring")e.innerHTML=rRec();
  else if(cV==="weekly")e.innerHTML=rWeekly();
  else if(cV==="preferences")e.innerHTML=rPreferences();
}

function tH(t,d){
  var c=gC(t.category),ii=t.type==="income",isT=t.type==="transfer";
  var amtCol=t.excluded?"#aaa":ii?"#16A34A":isT?"#1565C0":"#1a1a1a";
  var arrow = ii ? "\u2199" : "\u2197"; // down-left for income, up-right for expense (Axio style)
  var note = t.note || c.l;
  var sub = "";
  if(t.note && t.note !== c.l) sub = '<div class="td" style="display:flex;align-items:center;gap:4px"><span style="opacity:.7">'+c.i+'</span> '+esc(c.l)+'</div>';
  else sub = '<div class="td">'+esc(t.date)+'</div>';
  return '<div class="tr" onclick="editT(\''+t.id+'\')" style="cursor:pointer'+(t.excluded?";opacity:.7":"")+'">'+
    '<div class="ti" style="background:'+c.c+'14">'+c.i+'</div>'+
    '<div class="tf"><div class="tn">'+esc(note)+'</div>'+sub+'</div>'+
    '<div style="text-align:right;flex-shrink:0"><div class="xta" style="color:'+amtCol+'">'+fF(t.amount)+' <span style="font-size:12px;opacity:.5">'+arrow+'</span></div>'+
    '<div class="td" style="text-align:right">'+esc(t.date.slice(8))+' '+(MO[parseInt(t.date.slice(5,7),10)-1]||"")+'</div></div></div>';
}


function getNWS(txns){var n=0,w=0,sv=0;txns.forEach(function(t){if(t.type!=="expense"||t.excluded)return;var c=gC(t.category);if(c.g==="need")n+=t.amount;else if(c.g==="want")w+=t.amount;else if(c.g==="savings")sv+=t.amount});return{need:n,want:w,savings:sv}}

function rHome(){
  ensureAccounts();
  var cm=tMo(),mt=D.transactions.filter(function(t){return t.date&&t.date.indexOf(cm)===0});
  var inc=0,exp=0;mt.forEach(function(t){if(t.excluded)return;if(t.type==="income")inc+=t.amount;else if(t.type==="expense")exp+=t.amount});
  var net=inc-exp;
  var buPct=D.monthlyBudget>0?(exp/D.monthlyBudget*100):0;
  var bu=Math.min(buPct,100);
  var overBudget=buPct>100;
  var dl=new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate()-new Date().getDate();
  var sts=dl>0?Math.max(0,(D.monthlyBudget-exp)/dl):0;
  var nws=getNWS(mt);
  var cd={};mt.forEach(function(t){if(t.type==="expense"&&!t.excluded){cd[t.category]=(cd[t.category]||0)+t.amount}});
  var pie=[];for(var k in cd){var c=gC(k);pie.push({l:c.l,i:c.i,c:c.c,v:cd[k],g:c.g,id:k})}pie.sort(function(a,b){return b.v-a.v});
  var pT=0;pie.forEach(function(p){pT+=p.v});

    // Axio-style dual-color ring: blue for budget portion, red when over
  var R=58,C=2*Math.PI*R;
  var underPct = Math.min(buPct,100)/100;
  var overPct = overBudget ? Math.min((buPct-100)/100, 1) : 0;
  // When over: show full blue ring + red arc on top representing overflow intensity
  var blueDash = underPct * C;
  var blueGap = C - blueDash;
  var redDash = overBudget ? C : 0; // full red underlay when over
  var ringSvg='<svg class="axio-ring" viewBox="0 0 140 140">'+
    '<circle cx="70" cy="70" r="'+R+'" fill="none" stroke="#E5E7EB" stroke-width="11"/>';
  if(overBudget){
    // Red full circle base when over budget
    ringSvg += '<circle cx="70" cy="70" r="'+R+'" fill="none" stroke="#EF4444" stroke-width="11" stroke-linecap="round" '+
      'stroke-dasharray="'+C.toFixed(1)+' 0" transform="rotate(-90 70 70)"/>';
    // Blue arc for the "budget" portion (how much of the over is the original budget)
    var budgetShare = D.monthlyBudget > 0 ? (D.monthlyBudget/exp) : 0;
    budgetShare = Math.min(1, Math.max(0, budgetShare));
    var bDash = budgetShare * C;
    ringSvg += '<circle cx="70" cy="70" r="'+R+'" fill="none" stroke="#3B82F6" stroke-width="11" stroke-linecap="round" '+
      'stroke-dasharray="'+bDash.toFixed(1)+' '+(C-bDash).toFixed(1)+'" transform="rotate(-90 70 70)"/>';
  } else {
    ringSvg += '<circle cx="70" cy="70" r="'+R+'" fill="none" stroke="#3B82F6" stroke-width="11" stroke-linecap="round" '+
      'stroke-dasharray="'+blueDash.toFixed(1)+' '+blueGap.toFixed(1)+'" transform="rotate(-90 70 70)"/>';
  }
  ringSvg += '<text x="70" y="60" text-anchor="middle" fill="#9CA3AF" font-size="12">\u2197</text>'+
    '<text x="70" y="82" text-anchor="middle" fill="var(--text)" font-size="17" font-weight="700">'+fF(exp)+'</text>'+
    '</svg>';

  // Last month summary
  var lm=new Date();lm.setMonth(lm.getMonth()-1);
  var lmKey=lm.getFullYear()+"-"+String(lm.getMonth()+1).padStart(2,"0");
  var lmInc=0,lmExp=0;
  D.transactions.forEach(function(t){if(t.date&&t.date.indexOf(lmKey)===0&&!t.excluded){if(t.type==="income")lmInc+=t.amount;else if(t.type==="expense")lmExp+=t.amount}});

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
  h+='<div class="axio-ring-wrap" onclick="sV(\'transactions\')" style="cursor:pointer">'+ringSvg+'</div>';
  var pctClass = overBudget ? "axio-pct over" : "axio-pct";
  var pctIcon = overBudget ? "\uD83D\uDD34" : "\uD83D\uDD35";
  h+='<div style="text-align:center"><span class="'+pctClass+'">'+pctIcon+' '+buPct.toFixed(0)+'%</span></div>';
  h+='<div class="axio-stats">';
  var prevM = MO[(new Date().getMonth()+11)%12];
  h+='<div class="axio-stat" onclick="homeNav(\'income\')" style="cursor:pointer"><div class="axio-stat-label">Income ('+prevM+')</div><div class="axio-stat-val">'+fF(lmInc)+'</div></div>';
  h+='<div class="axio-stat" onclick="sV(\'budgets\')" style="cursor:pointer"><div class="axio-stat-label">Budget</div><div class="axio-stat-val">'+fF(D.monthlyBudget||0)+'</div></div>';
  h+='<div class="axio-stat"><div class="axio-stat-label">Safe to spend</div><div class="axio-stat-val">'+(overBudget?"\u20B90/day":fm(sts)+"/day")+'</div></div>';
  h+='</div></div>';

  // Trends + Categories pills (Axio style)
  h+='<div class="axio-pills">';
  h+='<div class="axio-pill" onclick="sV(\'reports\')"><span style="font-size:16px">\uD83D\uDCCA</span> Trends</div>';
  h+='<div class="axio-pill primary" onclick="txnTab=\'cats\';sV(\'transactions\')"><span style="font-size:16px;color:#8B5CF6">●</span> Categories</div>';
  h+='</div>';

  // Last Month card
  h+='<div class="axio-last" onclick="sV(\'reports\')" style="cursor:pointer">';
  h+='<div class="axio-last-icon">\uD83D\uDCCA</div>';
  h+='<div style="flex:1"><div class="axio-last-title">'+fF(lmExp)+' spent & '+fF(lmInc)+' earned</div>';
  h+='<div class="axio-last-sub">Review transactions in '+MO[lm.getMonth()]+'</div></div>';
  h+='<div style="color:var(--text-muted);font-size:18px">\u203A</div></div>';

  // Recent transactions
  h+='<div class="sec"><div class="sh"><div class="st">Recent transactions</div>';
  h+='<button class="xsa" style="background:var(--primary);color:#fff;padding:6px 12px;border-radius:20px;font-size:12px" onclick="oM(\'add\')">+ Add</button></div>';
  if(!D.transactions.length){
    h+='<div class="emp"><div class="empty-illust">\uD83D\uDCB8</div><div style="font-size:15px;font-weight:600;margin-bottom:6px">No transactions yet</div><div class="eps">Tap + Add to record your first expense</div></div>';
  } else {
    D.transactions.slice(0,5).forEach(function(t){h+=tH(t,false)});
  }
  h+='</div>';

  // Dues & Reminders
  if(upcoming.length){
    h+='<div class="sec"><div class="sh"><div class="st">Dues & Reminders</div><button class="xsa" onclick="sV(\'recurring\')">See all \u203A</button></div>';
    upcoming.forEach(function(r){
      var c=gC(r.category);
      h+='<div class="upcom-row" onclick="sV(\'recurring\')" style="cursor:pointer"><div class="upcom-day"><b>'+(r.dayOfMonth||1)+'</b></div><div style="flex:1"><div style="font-size:13px;font-weight:600">'+esc(r.name)+'</div><div style="font-size:11px;color:var(--text-muted)">'+c.i+' '+c.l+'</div></div><div style="font-weight:700;color:#E65100">'+fF(r.amount)+'</div></div>';
    });
    h+='</div>';
  }

  // Top Categories (quick view)
  if(pie.length>0){
    h+='<div class="sec"><div class="sh"><div class="st">Categories</div><button class="xsa" onclick="sV(\'budgets\')">See all \u203A</button></div><div class="wc">';
    pie.slice(0,4).forEach(function(p){
      var pc=pT?(p.v/pT*100).toFixed(0):0;
      h+='<div class="cr" onclick="fltrCat(\''+p.id+'\')" style="cursor:pointer"><div class="xci" style="background:'+p.c+'18">'+p.i+'</div><div style="flex:1"><div class="xcn">'+p.l+'</div><div class="bt"><div class="bf" style="width:'+pc+'%;background:'+p.c+'"></div></div></div><div class="xca">'+fF(p.v)+'</div></div>';
    });
    h+='</div></div>';
  }

  // Accounts strip
  h+='<div class="sec"><div class="sh"><div class="st">Accounts</div><button class="xsa" onclick="oM(\'settings\')">Manage \u203A</button></div>';
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
  var h = '<div class="wk-header" style="margin-bottom:4px"><button class="wk-back" onclick="sV(\'home\')">\u2190</button><div class="wk-title">All spends</div><div style="width:36px"></div></div>';
  h += '<div class="axio-tabs">';
  h += '<button class="axio-tab'+(txnTab==="txns"?" a":"")+'" onclick="txnTab=\'txns\';rC()">Transactions</button>';
  h += '<button class="axio-tab'+(txnTab==="cats"?" a":"")+'" onclick="txnTab=\'cats\';rC()">Categories</button>';
  h += '<button class="axio-tab'+(txnTab==="merch"?" a":"")+'" onclick="txnTab=\'merch\';rC()">Merchants</button>';
  h += '</div>';

  if(txnTab==="cats"){
    // Categories breakdown (Axio style)
    var cm=tMo();
    var mt=D.transactions.filter(function(t){return t.date&&t.date.indexOf(cm)===0&&t.type==="expense"&&!t.excluded});
    var cs={}, total=0, counts={};
    mt.forEach(function(t){cs[t.category]=(cs[t.category]||0)+t.amount; counts[t.category]=(counts[t.category]||0)+1; total+=t.amount});
    var list=[]; for(var k in cs){var c=gC(k); list.push({id:k,l:c.l,i:c.i,c:c.c,v:cs[k],n:counts[k]})}
    list.sort(function(a,b){return b.v-a.v});

    // Donut
    if(list.length){
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

    // Spends / Budget / Safe-to-spend row (Axio)
    var daysLeft = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate() - new Date().getDate() + 1;
    var rem = Math.max(0, D.monthlyBudget - total);
    var sts = daysLeft > 0 ? rem / daysLeft : 0;
    h += '<div class="cat-stats-row">';
    h += '<div class="cat-stat"><div class="cat-stat-label">Spends</div><div class="cat-stat-val">'+fF(total)+'</div></div>';
    h += '<div class="cat-stat"><div class="cat-stat-label">Budget</div><div class="cat-stat-val">'+fF(D.monthlyBudget)+'</div></div>';
    h += '<div class="cat-stat"><div class="cat-stat-label">Safe to spend</div><div class="cat-stat-val">'+(total>D.monthlyBudget?"₹0/day":fF(sts)+"/day")+'</div></div>';
    h += '</div>';

    h += '<div class="wc">';
    list.forEach(function(p){
      var pct = total ? (p.v/total*100).toFixed(1) : 0;
      h += '<div class="tr" onclick="txnTab=\'txns\';catFilter=\''+p.id+'\';rC()" style="cursor:pointer">';
      h += '<div class="ti" style="background:'+p.c+'18">'+p.i+'</div>';
      h += '<div class="tf"><div class="tn">'+esc(p.l)+'</div><div class="td">'+p.n+' Spend'+(p.n>1?"s":"")+'</div></div>';
      h += '<div style="text-align:right"><div class="xta">'+fF(p.v)+'</div>';
      h += '<div style="font-size:11px;color:var(--primary);font-weight:600;margin-top:2px" onclick="event.stopPropagation();sV(\'budgets\')">Set budget ›</div></div></div>';
    });
    if(!list.length) h += '<div class="emp"><div class="empty-illust">📊</div><div style="font-size:15px;font-weight:600">No expenses this month</div></div>';
    h += '</div>';
    return h;
  }

  if(txnTab==="merch"){
    // Merchants list (Axio style)
    var cm=tMo();
    var mt=D.transactions.filter(function(t){return t.date&&t.date.indexOf(cm)===0&&t.type==="expense"&&!t.excluded});
    var mer={};
    mt.forEach(function(t){
      var name = (t.note||"").trim() || gC(t.category).l;
      // Clean common patterns
      name = name.split(" - ")[0].split(" @")[0].trim();
      if(!name) name = "Unknown";
      if(!mer[name]) mer[name]={name:name, amt:0, count:0};
      mer[name].amt += t.amount;
      mer[name].count++;
    });
    var list = Object.keys(mer).map(function(k){return mer[k]});
    list.sort(function(a,b){return b.amt-a.amt});

    h += '<div class="axio-spend-header"><div class="axio-spend-amt">'+list.length+'</div><div class="axio-spend-sub">Merchants this month</div></div>';
    h += '<div class="wc">';
    list.forEach(function(m){
      h += '<div class="tr" style="cursor:default">';
      h += '<div class="ti" style="background:#E0F2FE">🏪</div>';
      h += '<div class="tf"><div class="tn">'+esc(m.name)+'</div><div class="td">'+m.count+' spend'+(m.count>1?"s":"")+'</div></div>';
      h += '<div class="xta">'+fF(m.amt)+'</div></div>';
    });
    if(!list.length) h += '<div class="emp"><div class="empty-illust">🏪</div><div style="font-size:15px;font-weight:600">No merchants yet</div></div>';
    h += '</div>';
    return h;
  }

  // Default: Transactions list
  var fl=D.transactions.filter(function(t){
    if(cF==="income"&&t.type!=="income")return false;
    if(cF==="expense"&&t.type!=="expense")return false;
    if(catFilter!=="all"&&t.category!==catFilter)return false;
    if(groupFilter!=="all"&&gC(t.category).g!==groupFilter)return false;
    if(dateFrom&&t.date<dateFrom)return false;
    if(dateTo&&t.date>dateTo)return false;
    if(sT){var s=sT.toLowerCase();if((t.note||"").toLowerCase().indexOf(s)===-1&&gC(t.category).l.toLowerCase().indexOf(s)===-1)return false}
    return true;
  });
  var gr={};fl.forEach(function(t){var d=t.date||"?";if(!gr[d])gr[d]=[];gr[d].push(t)});
  var ds=Object.keys(gr).sort(function(a,b){return b.localeCompare(a)});

  h += '<input class="xsi2" placeholder="🔍 Search..." value="'+esc(sT)+'" oninput="sT=this.value;rC()">';
  h += '<div class="fr">';
  h += '<button class="fb'+(cF==="all"?" a":"")+'" onclick="cF=\'all\';rC()">All</button>';
  h += '<button class="fb'+(cF==="income"?" a":"")+'" onclick="cF=\'income\';rC()">Income</button>';
  h += '<button class="fb'+(cF==="expense"?" a":"")+'" onclick="cF=\'expense\';rC()">Expense</button>';
  h += '<button class="fb" onclick="toggleFilters()" style="margin-left:auto">🔍 Filters</button></div>';
  h += '<div id="advFilters" style="display:none;background:var(--card);border-radius:14px;padding:14px;margin-bottom:10px;box-shadow:0 1px 6px rgba(0,0,0,.04)">';
  h += '<div style="display:flex;gap:8px;margin-bottom:10px"><div style="flex:1"><label style="font-size:11px;color:#888">From</label><input class="inp" type="date" value="'+dateFrom+'" oninput="dateFrom=this.value;rC()" style="margin-top:4px;padding:8px"></div>';
  h += '<div style="flex:1"><label style="font-size:11px;color:#888">To</label><input class="inp" type="date" value="'+dateTo+'" oninput="dateTo=this.value;rC()" style="margin-top:4px;padding:8px"></div></div>';
  h += '<div><label style="font-size:11px;color:#888">Category</label><select class="inp" onchange="catFilter=this.value;rC()" style="margin-top:4px;padding:8px"><option value="all">All Categories</option>';
  h += CATS.map(function(c){return'<option value="'+c.id+'" '+(catFilter===c.id?"selected":"")+'>'+c.i+' '+c.l+'</option>'}).join("");
  h += '</select></div>';
  h += '<button class="fb" onclick="dateFrom=\'\';dateTo=\'\';catFilter=\'all\';groupFilter=\'all\';rC()" style="margin-top:10px;width:100%">Clear All Filters</button></div>';

  if(!ds.length){
    h += '<div class="emp"><div class="empty-illust">🔍</div><div style="font-size:15px;font-weight:600;margin-bottom:6px">No transactions match your filters</div><div class="eps">Try adjusting the date range or category filter above.</div></div>';
  } else {
    ds.forEach(function(d){
      h += '<div class="dh">'+d+'</div>';
      gr[d].forEach(function(t){h+=tH(t,true)});
    });
  }
  return h;
}
function editT(id){
  var t=null;for(var i=0;i<D.transactions.length;i++)if(D.transactions[i].id===id){t=D.transactions[i];break}
  if(!t)return;
  oM("add");
  mS={type:t.type,category:t.category,amount:t.amount,note:t.note||"",date:t.date,editId:id,tags:t.tags||[],receipt:t.receipt||null,excluded:!!t.excluded};
  rM();
}
function toggleFilters(){var f=document.getElementById("advFilters");if(f)f.style.display=f.style.display==="none"?"block":"none"}
function dT(id){showConfirm("Delete transaction?","This action cannot be undone.",function(){D.transactions=D.transactions.filter(function(t){return t.id!==id});sv();toast("Transaction deleted");cM();rC()},"Delete")}

function rBdg(){var cm=tMo(),mt=D.transactions.filter(function(t){return t.date&&t.date.indexOf(cm)===0});var ts=0,cs={};mt.forEach(function(t){if(t.type==="expense"&&!t.excluded){ts+=t.amount;cs[t.category]=(cs[t.category]||0)+t.amount}});var pc=D.monthlyBudget>0?Math.min(100,ts/D.monthlyBudget*100):0;var nws=getNWS(mt);var ec=eCats();
var h='<div class="st">Budgets</div><div class="bmc"><div class="xsp1"></div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span style="opacity:.7;font-size:13px">Monthly Budget</span><button style="background:rgba(255,255,255,.15);border:none;color:#fff;font-size:12px;padding:5px 14px;border-radius:8px;cursor:pointer" onclick="eMB()">Edit</button></div><div style="font-size:30px;font-weight:700">'+fF(D.monthlyBudget)+'</div><div class="bt" style="background:rgba(255,255,255,.15);margin-top:12px;height:6px"><div class="bf" style="width:'+pc+'%;background:#FFD54F;height:6px"></div></div><div style="display:flex;justify-content:space-between;margin-top:8px;font-size:12px;opacity:.6"><span>'+fF(ts)+' spent</span><span>'+pc.toFixed(0)+'%</span></div></div>';
h+='<div class="nws-row"><div class="nws-card nws-need"><div class="nws-label">Needs</div><div class="nws-val" style="color:#2E7D32">'+fF(nws.need)+'</div></div><div class="nws-card nws-want"><div class="nws-label">Wants</div><div class="nws-val" style="color:#E65100">'+fF(nws.want)+'</div></div><div class="nws-card nws-savings"><div class="nws-label">Savings</div><div class="nws-val" style="color:#1565C0">'+fF(nws.savings)+'</div></div></div>';
// Group by Need/Want/Savings
["need","want","savings"].forEach(function(grp){var label=grp==="need"?"Needs (Essential)":grp==="want"?"Wants (Lifestyle)":"Savings & Investment";var cats=ec.filter(function(c){return c.g===grp});h+='<div class="st" style="margin-top:16px">'+label+'</div>';cats.forEach(function(cat){var sp=cs[cat.id]||0,bg=D.budgets[cat.id]||0,p=bg>0?Math.min(100,sp/bg*100):0;h+='<div class="cbr" onclick="fltrCat(\''+cat.id+'\');" style="cursor:pointer"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="font-size:18px">'+cat.i+'</span><span style="font-size:13px;font-weight:500;flex:1">'+cat.l+'</span><button class="eb" onclick="eCB(\''+cat.id+'\','+bg+')">'+(bg>0?fF(bg):"Set")+'</button></div>'+(bg>0?'<div class="bt"><div class="bf" style="width:'+p+'%;background:'+(p>90?"#E53935":cat.c)+'"></div></div><div style="color:#aaa;font-size:10px;margin-top:3px">'+fF(sp)+' / '+fF(bg)+'</div>':'')+(bg===0&&sp>0?'<div style="color:#aaa;font-size:10px">'+fF(sp)+' spent</div>':'')+'</div>'});
});return h}
function fltrCat(catId){cV='transactions';cF='all';catFilter=catId;groupFilter='all';sT='';dateFrom='';dateTo='';rN();rC();}
function eMB(){var v=window.prompt?window.prompt("Monthly budget (\u20B9):",D.monthlyBudget):null;if(v===null){var inp=document.createElement("input");inp.type="number";inp.value=D.monthlyBudget;inp.placeholder="Monthly budget";inp.style.cssText="width:100%;padding:12px;border:1.5px solid #16A34A;border-radius:12px;font-size:16px;margin:8px 0";var wrap=document.createElement("div");wrap.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999;display:flex;align-items:center;justify-content:center;padding:20px";var card=document.createElement("div");card.style.cssText="background:#fff;border-radius:20px;padding:24px;width:100%;max-width:340px";card.innerHTML="<div style='font-weight:700;font-size:16px;margin-bottom:8px'>Monthly Budget (\u20B9)</div>";card.appendChild(inp);var btn=document.createElement("button");btn.textContent="Save";btn.style.cssText="width:100%;padding:12px;background:linear-gradient(135deg,#16A34A,#16A34A);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;margin-top:8px;cursor:pointer";btn.onclick=function(){D.monthlyBudget=Number(inp.value)||0;sv();rC();document.body.removeChild(wrap)};wrap.appendChild(card);document.body.appendChild(wrap);setTimeout(function(){inp.focus()},100);return}D.monthlyBudget=Number(v)||0;sv();rC()}
function eCB(id,c){var v=window.prompt?window.prompt(gC(id).l+" budget (\u20B9):",c):null;if(v===null){var inp=document.createElement("input");inp.type="number";inp.value=c;inp.placeholder="Budget amount";inp.style.cssText="width:100%;padding:12px;border:1.5px solid #16A34A;border-radius:12px;font-size:16px;margin:8px 0";var wrap=document.createElement("div");wrap.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999;display:flex;align-items:center;justify-content:center;padding:20px";var card=document.createElement("div");card.style.cssText="background:#fff;border-radius:20px;padding:24px;width:100%;max-width:340px";card.innerHTML="<div style='font-weight:700;font-size:16px;margin-bottom:8px'>"+gC(id).l+" Budget (\u20B9)</div>";card.appendChild(inp);var btn=document.createElement("button");btn.textContent="Save";btn.style.cssText="width:100%;padding:12px;background:linear-gradient(135deg,#16A34A,#16A34A);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;margin-top:8px;cursor:pointer";btn.onclick=function(){D.budgets[id]=Number(inp.value)||0;sv();rC();document.body.removeChild(wrap)};wrap.appendChild(card);document.body.appendChild(wrap);setTimeout(function(){inp.focus()},100);return}D.budgets[id]=Number(v)||0;sv();rC()}

function rSpl(){
  var h='<div class="wk-header" style="margin-bottom:8px"><div class="wk-title" style="flex:1">Splits</div><button class="ab" onclick="oM(\'split\')" style="margin:0">+</button></div>';
  if(!D.splits.length){
    h+='<div class="emp"><div class="empty-illust">👥</div><div style="font-size:15px;font-weight:600;margin-bottom:6px">No splits yet</div><div class="eps">Split bills with friends and family</div></div>';
  } else {
    h+='<div class="split-grid">';
    D.splits.forEach(function(s){
      var per = s.people && s.people.length ? s.total/s.people.length : s.total;
      var avatars = (s.people||[]).slice(0,4).map(function(p){return '<div class="split-av">'+(p.name[0]||"?").toUpperCase()+'</div>'}).join("");
      if((s.people||[]).length>4) avatars += '<div class="split-av">+'+(s.people.length-4)+'</div>';
      h+='<div class="split-card">';
      h+='<div class="split-card-top"><div class="split-card-title">'+esc(s.title)+'</div>';
      h+='<button class="dl" onclick="dS(\''+s.id+'\')" style="color:#fff;opacity:.8">×</button></div>';
      h+='<div class="split-card-sub">Split with</div>';
      h+='<div class="split-avatars">'+avatars+'</div>';
      h+='<div class="split-card-bottom"><span>You get</span><span class="split-youget">'+fF(per)+' <span style="font-size:12px">↗</span></span></div>';
      h+='</div>';
    });
    h+='</div>';
  }
  // Tags section like Axio
  var tags = typeof getAllTags==="function" ? getAllTags() : [];
  h+='<div class="wk-card" style="margin-top:16px"><div class="wk-card-title">Tags</div>';
  if(tags.length){
    h+='<div style="display:flex;flex-wrap:wrap;gap:8px">';
    tags.slice(0,12).forEach(function(t){h+='<span class="tag" style="background:#EEF2FF;color:#4F46E5;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600">#'+esc(t)+'</span>'});
    h+='</div>';
  } else {
    h+='<div style="color:var(--text-muted);font-size:13px">No tags yet — add tags when creating transactions</div>';
  }
  h+='</div>';
  h+='<div style="text-align:center;color:var(--text-muted);font-size:12px;margin:20px 0 8px">Made with ❤️ in India.</div>';
  return h;
}
function rRec(){var h='<div class="sh"><div class="st" style="margin-bottom:0">Recurring Bills</div><button class="ab" onclick="oM(\'recurring\')">+ Add Bill</button></div>';if(!D.recurring.length)h+='<div class="emp"><div class="epi">🔄</div><div>No recurring bills</div></div>';else D.recurring.forEach(function(r){var c=gC(r.category);h+='<div class="xrc"><div style="display:flex;align-items:center;gap:12px"><div class="ti" style="background:'+c.c+'12">'+c.i+'</div><div style="flex:1"><div style="font-weight:600">'+esc(r.name)+'</div><div style="color:#aaa;font-size:12px">'+r.frequency+' - Day '+r.dayOfMonth+'</div></div><div style="font-weight:700;font-size:15px;color:#E64A19">'+fF(r.amount)+'</div><button class="dl" onclick="dR(\''+r.id+'\')">×</button></div></div>'});return h}
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
function rWeekly(){
  var wr = getWeekRange(0);
  var prev = getWeekRange(-1);
  function inRange(t, range){
    if(!t.date) return false;
    var d = new Date(t.date + "T12:00:00");
    return d >= range.start && d <= range.end;
  }
  var thisTx = D.transactions.filter(function(t){ return t.type==="expense" && !t.excluded && inRange(t, wr); });
  var prevTx = D.transactions.filter(function(t){ return t.type==="expense" && !t.excluded && inRange(t, prev); });
  var thisTotal = thisTx.reduce(function(s,t){return s+t.amount},0);
  var prevTotal = prevTx.reduce(function(s,t){return s+t.amount},0);
  var change = prevTotal > 0 ? ((thisTotal - prevTotal)/prevTotal*100) : 0;

  // Daily bars
  var days = [];
  for(var i=0;i<7;i++){
    var d = new Date(wr.start);
    d.setDate(wr.start.getDate()+i);
    var key = d.toISOString().slice(0,10);
    var dayAmt = thisTx.filter(function(t){return t.date===key}).reduce(function(s,t){return s+t.amount},0);
    days.push({date:d, key:key, amt:dayAmt, label:fmtDay(d)});
  }
  var maxDay = Math.max.apply(null, days.map(function(d){return d.amt}).concat([1]));

  var h = '<div class="wk-header">';
  h += '<button class="wk-back" onclick="sV(\'home\')">\u2190</button>';
  h += '<div class="wk-title">Weekly summary</div>';
  h += '<div style="width:36px"></div></div>';

  // This week card
  h += '<div class="wk-hero">';
  h += '<div class="wk-hero-icon">\uD83D\uDED2</div>';
  h += '<div><div class="wk-hero-label">This week</div>';
  h += '<div class="wk-hero-amt">'+fF(thisTotal)+'</div></div></div>';

  h += '<div class="wk-range">'+fmtShortDate(wr.start)+' - '+fmtShortDate(wr.end);
  if(change !== 0){
    h += '<span class="wk-change '+(change>0?"up":"down")+'">'+(change>0?"\u2191":"\u2193")+' '+Math.abs(change).toFixed(0)+'%</span>';
  }
  h += '</div>';

  // Bar chart
  h += '<div class="wk-bars">';
  days.forEach(function(d){
    var hgt = Math.max(4, (d.amt / maxDay) * 100);
    var label = d.amt >= 1000 ? (d.amt/1000).toFixed(d.amt>=10000?1:1)+"K" : (d.amt>0?Math.round(d.amt):"");
    h += '<div class="wk-bar-col">';
    h += '<div class="wk-bar-val">'+(label||"")+'</div>';
    h += '<div class="wk-bar" style="height:'+hgt+'%"></div>';
    h += '<div class="wk-bar-label">'+d.label+'</div></div>';
  });
  h += '</div>';

  h += '<div style="text-align:center;margin:8px 0 16px"><button class="wk-add" onclick="oM(\'add\')">+ Add a spend</button></div>';

  // Map (OpenStreetMap - no API key)
  var city = getMapCity();
  h += '<div class="wk-card" style="padding:0;overflow:hidden">';
  h += '<div id="wkMap" style="height:180px;background:#E5E7EB;position:relative">';
  h += '<iframe title="Map" style="width:100%;height:100%;border:0" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="'+mapEmbedUrl(city)+'"></iframe>';
  h += '</div>';
  h += '<div style="padding:12px;display:flex;justify-content:space-between;align-items:center;gap:8px">';
  h += '<span style="font-size:12px;color:var(--text-muted)">📍 '+esc(city.name)+'</span>';
  h += '<div style="display:flex;gap:10px;align-items:center">';
  h += '<button class="wk-add" style="padding:0;background:none;border:none;cursor:pointer" onclick="sV(\'preferences\')">Change city</button>';
  h += '<a class="wk-add" style="text-decoration:none" href="'+mapLinkUrl(city)+'" target="_blank" rel="noopener">Show map</a>';
  h += '</div></div></div>';


  // Mini budget
  var cm = tMo();
  var mt = D.transactions.filter(function(t){return t.date && t.date.indexOf(cm)===0 && t.type==="expense" && !t.excluded});
  var spent = mt.reduce(function(s,t){return s+t.amount},0);
  var buPct = D.monthlyBudget > 0 ? (spent/D.monthlyBudget*100) : 0;
  var over = buPct > 100;
  var daysLeft = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate() - new Date().getDate() + 1;
  var rem = Math.max(0, D.monthlyBudget - spent);
  var sts = daysLeft > 0 ? rem / daysLeft : 0;

  h += '<div class="wk-card">';
  h += '<div class="wk-card-title">Budget</div>';
  h += '<div style="display:flex;align-items:center;gap:16px">';
  h += '<div class="wk-mini-ring" style="--pct:'+Math.min(buPct,100)+';--col:'+(over?"#EF4444":"#6366F1")+'"><span>'+fF(spent).replace("₹","")+'</span></div>';
  h += '<div style="flex:1">';
  h += '<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:12px;color:var(--text-muted)">Spend</span><span style="font-size:13px;font-weight:600">'+fF(spent/Math.max(1,new Date().getDate()))+' <span style="font-weight:400;color:var(--text-muted);font-size:11px">per day</span></span></div>';
  h += '<div style="display:flex;justify-content:space-between"><span style="font-size:12px;color:var(--text-muted)">Safe to spend</span><span style="font-size:13px;font-weight:600">'+(over?"₹0":fF(sts))+' <span style="font-weight:400;color:var(--text-muted);font-size:11px">per day</span></span></div>';
  if(over) h += '<div style="color:#EF4444;font-size:12px;margin-top:8px;font-weight:600">You are over budget by '+fF(spent - D.monthlyBudget)+'</div>';
  h += '</div></div></div>';

  // Top spends this week
  var top = thisTx.slice().sort(function(a,b){return b.amount-a.amount}).slice(0,5);
  if(top.length){
    h += '<div class="wk-card"><div class="wk-card-title">Top spends</div>';
    top.forEach(function(t){
      var c = gC(t.category);
      h += '<div class="tr" style="padding:10px 0;cursor:pointer" onclick="editT(\''+t.id+'\')">';
      h += '<div class="ti" style="background:'+c.c+'18">'+c.i+'</div>';
      h += '<div class="tf"><div class="tn">'+esc(t.note||c.l)+'</div><div class="td">'+t.date+'</div></div>';
      h += '<div class="xta">'+fF(t.amount)+'</div></div>';
    });
    h += '</div>';
  }

  // Top categories this week
  var cs = {};
  thisTx.forEach(function(t){cs[t.category]=(cs[t.category]||0)+t.amount});
  var catList = Object.keys(cs).map(function(k){var c=gC(k);return {id:k,l:c.l,i:c.i,c:c.c,v:cs[k]}}).sort(function(a,b){return b.v-a.v}).slice(0,5);
  if(catList.length){
    h += '<div class="wk-card"><div class="wk-card-title">Top categories</div>';
    catList.forEach(function(p){
      var pct = thisTotal ? (p.v/thisTotal*100).toFixed(0) : 0;
      h += '<div class="tr" style="padding:10px 0">';
      h += '<div class="ti" style="background:'+p.c+'18">'+p.i+'</div>';
      h += '<div class="tf"><div class="tn">'+esc(p.l)+'</div><div class="td">'+pct+'%</div></div>';
      h += '<div class="xta">'+fF(p.v)+'</div></div>';
    });
    h += '</div>';
  }

  return h;
}

function rPreferences(){
  var h = '<div class="wk-header">';
  h += '<button class="wk-back" onclick="oM(\'settings\')">\u2190</button>';
  h += '<div class="wk-title">Preferences</div>';
  h += '<div style="width:36px"></div></div>';


  // Map city
  var curCity = getMapCity();
  var cityKey = "delhi";
  try{ cityKey = localStorage.getItem("cashly_map_city") || "delhi"; }catch(e){}
  h += '<div class="wk-card"><div class="wk-card-title">Map city</div>';
  h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px">Weekly summary map centers on this city</div>';
  h += '<select class="inp" id="mapCitySelect" onchange="setMapCity(this.value);toast(\'Map city: \'+getMapCity().name)" style="padding:10px">';
  var keys = Object.keys(MAP_CITIES).sort(function(a,b){return MAP_CITIES[a].name.localeCompare(MAP_CITIES[b].name)});
  var seen = {};
  keys.forEach(function(k){
    var n = MAP_CITIES[k].name;
    if(seen[n]) return; seen[n]=1;
    h += '<option value="'+k+'"'+(MAP_CITIES[k].name===curCity.name?" selected":"")+'>'+n+'</option>';
  });
  h += '</select></div>';

  var darkOn = getTheme()==="dark";
  h += '<div class="wk-card">';
  h += '<div class="set-card" style="border:none;padding:12px 0" onclick="toggleTheme()"><div class="set-icon" style="background:'+(darkOn?"#1a1d27":"#FFF3E0")+'">'+(darkOn?"🌙":"☀️")+'</div><div class="set-text"><div class="set-title">Dark Mode</div><div class="set-sub">'+(darkOn?"On":"Off")+'</div></div><div class="set-toggle'+(darkOn?" on":"")+'"></div></div>';
  h += '</div>';

  h += '<div class="wk-card">';
  h += '<div class="set-card" style="border:none;padding:12px 0" onclick="oM(\'settings\');setTimeout(function(){document.getElementById(\'accSection\')&&document.getElementById(\'accSection\').scrollIntoView()},200)"><div class="set-icon" style="background:#E0F2FE">🏦</div><div class="set-text"><div class="set-title">Manage Accounts</div><div class="set-sub">Banks, cards & wallets</div></div><div class="set-arrow">›</div></div>';
  h += '<div class="set-card" style="border:none;padding:12px 0" onclick="addCustomCategory()"><div class="set-icon" style="background:#E8F5E9">➕</div><div class="set-text"><div class="set-title">Custom Categories</div><div class="set-sub">Add or edit categories</div></div><div class="set-arrow">›</div></div>';
  h += '</div>';

  var bioOn=isBiometricEnabled();
  var bioSupp=isBiometricSupported();
  var pinOn=isPinSet();
  h += '<div class="wk-card"><div class="wk-card-title">Security</div>';
  if(bioSupp){
    h += '<div class="set-card" style="border:none;padding:12px 0" onclick="'+(bioOn?"disableBiometric()":"setupBiometric()")+'"><div class="set-icon" style="background:#E8F5E9">🔒</div><div class="set-text"><div class="set-title">Fingerprint Login</div><div class="set-sub">'+(bioOn?"Enabled":"Disabled")+'</div></div><div class="set-toggle'+(bioOn?" on":"")+'"></div></div>';
  }
  h += '<div class="set-card" style="border:none;padding:12px 0" onclick="'+(pinOn?"disablePin()":"setupPin()")+'"><div class="set-icon" style="background:#FFF3E0">🔢</div><div class="set-text"><div class="set-title">PIN Lock</div><div class="set-sub">'+(pinOn?"Enabled":"Disabled")+'</div></div><div class="set-toggle'+(pinOn?" on":"")+'"></div></div>';
  h += '</div>';

  h += '<div class="wk-card"><div class="wk-card-title">Data</div>';
  h += '<div class="set-card" style="border:none;padding:12px 0" onclick="exportJSON()"><div class="set-icon" style="background:#E0F2FE">📤</div><div class="set-text"><div class="set-title">Export Data</div><div class="set-sub">Download JSON backup</div></div><div class="set-arrow">›</div></div>';
  h += '<div class="set-card" style="border:none;padding:12px 0" onclick="oM(\'pdfrange\')"><div class="set-icon" style="background:#FCE7F3">📄</div><div class="set-text"><div class="set-title">Export Statement</div><div class="set-sub">PDF report</div></div><div class="set-arrow">›</div></div>';
  h += '</div>';

  return h;
}


function rReports(){
  var now=new Date();
  var thisMonth=getMonthData(now.getFullYear(),now.getMonth());
  var lastMonthDate=new Date(now.getFullYear(),now.getMonth()-1,1);
  var lastMonth=getMonthData(lastMonthDate.getFullYear(),lastMonthDate.getMonth());
  var changeExp=lastMonth.exp>0?((thisMonth.exp-lastMonth.exp)/lastMonth.exp*100):0;
  var changeInc=lastMonth.inc>0?((thisMonth.inc-lastMonth.inc)/lastMonth.inc*100):0;
  var dayAvg=getDayAvg(thisMonth.txns);
  var topMerchants=getTopMerchants(thisMonth.txns,5);
  var savings=thisMonth.inc-thisMonth.exp;
  var savingsRate=thisMonth.inc>0?(savings/thisMonth.inc*100):0;
  
  var h='<div style="animation:fadeUp .4s ease"><div class="st">Reports - '+MO[now.getMonth()]+' '+now.getFullYear()+'</div>';
  
  // Stats grid
  h+='<div class="stat-grid">';
  h+='<div class="stat-card"><div class="stat-label">Spent</div><div class="stat-value" style="color:#E53935">'+fF(thisMonth.exp)+'</div><div class="stat-change '+(changeExp>0?"stat-up":"stat-down")+'">'+(changeExp>0?"\u2191":"\u2193")+' '+Math.abs(changeExp).toFixed(0)+'% vs last month</div></div>';
  h+='<div class="stat-card"><div class="stat-label">Earned</div><div class="stat-value" style="color:#2E7D32">'+fF(thisMonth.inc)+'</div><div class="stat-change '+(changeInc>=0?"stat-down":"stat-up")+'">'+(changeInc>=0?"\u2191":"\u2193")+' '+Math.abs(changeInc).toFixed(0)+'% vs last month</div></div>';
  h+='<div class="stat-card"><div class="stat-label">Saved</div><div class="stat-value" style="color:'+(savings>=0?"#1565C0":"#E53935")+'">'+fF(savings)+'</div><div class="stat-change">'+savingsRate.toFixed(0)+'% of income</div></div>';
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
function uploadITRFile(){
  var inp=document.createElement("input");
  inp.type="file";inp.accept=".xlsx,.xls";
  inp.onchange=function(e){
    var file=e.target.files[0];if(!file)return;
    if(file.size>5*1024*1024){toast("File too large (max 5MB)");return}
    // Parse the file locally FIRST — the user sees their data even if cloud backup fails
    parseITRFile(file);
    // Then attempt a cloud backup in the background (non-blocking)
    if(fbOk&&uid&&storage){
      try{
        var path="users/"+uid+"/itr/"+file.name;
        var ref=storage.ref(path);
        ref.put(file).then(function(snap){
          return snap.ref.getDownloadURL();
        }).then(function(url){
          D.itrFile={url:url,uploadedAt:Date.now(),fileName:file.name,path:path};
          sv();rC();
        }).catch(function(err){
          D.itrFile={fileName:file.name,uploadedAt:Date.now(),localOnly:true};
          sv();
          toast("Data parsed. Cloud backup unavailable.");
          console.warn("ITR cloud backup failed:",err&&err.message);
        });
      }catch(err){
        D.itrFile={fileName:file.name,uploadedAt:Date.now(),localOnly:true};
        sv();
      }
    }else{
      D.itrFile={fileName:file.name,uploadedAt:Date.now(),localOnly:true};
      sv();
    }
  };
  inp.click();
}

function fetchITRFromCloud(){
  if(!D.itrFile||!D.itrFile.url||!storage){toast("No file uploaded");return}
  toast("Fetching from cloud...");
  fetch(D.itrFile.url).then(function(res){return res.blob()}).then(function(blob){
    parseITRFile(blob);
  }).catch(function(e){toast("Fetch failed: "+e.message)});
}

function deleteITRFile(){
  if(!D.itrFile){toast("No file to delete");return}
  if(!confirm("Delete uploaded Excel file?"))return;
  if(D.itrFile.path&&storage){
    storage.ref(D.itrFile.path).delete().catch(function(){});
  }
  D.itrFile=null;D.itrData={fyData:{},earnings:[],cashback:[],locked:true};
  sv();toast("Deleted");rC();
}

// ===== EXCEL PARSER =====
function parseITRFile(file){
  if(!window.XLSX){toast("Excel library not loaded");return}
  var reader=new FileReader();
  reader.onload=function(e){
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

function parseNum(v){if(v===null||v===undefined||v==="")return 0;if(typeof v==="number")return v;if(v instanceof Date)return 0;var s=""+v;if(s.charAt(0)==="="){var expr=s.slice(1);if(/^[\d+\-*/.() ]+$/.test(expr)){try{var r=parseFloat(Function("return "+expr)());if(!isNaN(r))return r}catch(e){}}return 0;}var n=parseFloat(s.replace(/[, \u20B9]/g,""));return isNaN(n)?0:n}
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
