/* Original compact line icons; no external icon dependency. */
function v7Icon(n){var paths={bell:'<path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5zm5 3h4"/>',bookmark:'<path d="M6 4h12v17l-6-5-6 5z"/>',play:'<path d="m8 5 12 7-12 7z"/>',calculator:'<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h2m4 0h2M8 15h2m4 0h2M8 19h2m4 0h2"/>',search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',book:'<path d="M12 5v16M3 4h5l4 2 4-2h5v15h-5l-4 2-4-2H3z"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',user:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3"/>',exit:'<path d="M10 3H4v18h6m4-14 5 5-5 5m-6-5h11"/>',chart:'<path d="M4 20V4m0 16h16M8 15l4-5 4 2 4-7"/>',wallet:'<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M21 10h-6v5h6"/>',split:'<path d="M4 7h16l-4-4m4 14H4l4 4M20 7l-4 4M4 17l4-4"/>'};return '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+(paths[n]||paths.wallet)+'</svg>'}
var v7Calcs=[['retire-today','Can I Retire Today?','Guided retirement readiness assessment','clock'],['retirement','Retirement Amount Required','Estimate the corpus you may need','wallet'],['sip','SIP Calculator','Estimate systematic investment growth','chart'],['emi','Loan EMI Calculator','Estimate monthly loan repayments','calculator'],['inflation','Inflation Calculator','Estimate future purchasing power','chart']];var v7Selected=0;
function v7Back(title,dest){return '<div class="wk-header cashly-back-header"><button class="wk-back" aria-label="Back" onclick="goBackRoute(\''+dest+'\')">←</button><div class="wk-title">'+esc(title)+'</div></div>'}
function rCashlyCalculators(){return '<section><h1 class="v7-title">Calculators</h1><p class="v7-sub">Plan your money with educational estimates.</p><div class="v7-list">'+v7Calcs.map(function(c,i){return '<button class="cashly-row" onclick="v7Selected='+i+';sV(\'calculatorDetail\')"><span class="cashly-row-icon">'+v7Icon(c[3])+'</span><span class="cashly-row-main"><strong>'+c[1]+'</strong><small>'+c[2]+'</small></span><span>›</span></button>'}).join('')+'</div></section>'}
function rV7CalculatorDetail(){var c=v7Calcs[v7Selected];return '<section class="cashly-calcs-inapp">'+v7Back(c[1],'calculators')+'<iframe data-calculator="'+c[0]+'" onload="restoreCalculatorDraft(this)" title="'+c[1]+'" src="../calculators.html?app=1&amp;theme='+getTheme()+'#'+c[0]+'"></iframe></section>'}

var cashlyCategoryShapes={
  food:'<path d="M5 3v8M8 3v8M11 3v8M5 8h6M8 11v10M17 21V3c-2 1-3 4-3 8h3"/>',
  groceries:'<path d="M3 5h2l3 11h11l2-8H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
  vegetables:'<path d="M12 21c-5 0-8-5-8-9 0-3 4-4 8-2 4-2 8-1 8 2 0 4-3 9-8 9zm0-11c-1-4 1-6 5-7 1 4-2 6-5 7z"/>',
  shopping:'<path d="M4 8h16l1 13H3zm4 0V6a4 4 0 0 1 8 0v2"/>',
  bills:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 7h6m-6 4h6m-6 4h4"/>',
  transport:'<rect x="4" y="4" width="16" height="13" rx="3"/><path d="M4 11h16M7 17v3m10-3v3M8 14h1m6 0h1"/>',
  fuel:'<path d="M3 21h12M5 21V4h8v17M5 11h8m0 3h2c2 0 1 5 4 5 1 0 2-1 2-3v-4l-3-4"/>',
  health:'<path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5z"/>',
  education:'<path d="m2 9 10-5 10 5-10 5zm5 3v5c3 2 7 2 10 0v-5m5-3v7"/>',
  entertainment:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m10 8 6 4-6 4z"/>',
  rent:'<path d="m3 11 9-8 9 8M5 10v11h14V10m-10 11v-7h6v7"/>',
  insurance:'<path d="M12 3 4 6v5c0 5 4 8 8 10 4-2 8-5 8-10V6zm-3 9 2 2 4-4"/>',
  salary:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18m-11 0v3h4v-3"/>',
  family:'<circle cx="12" cy="7" r="3"/><path d="M5 20v-2a7 7 0 0 1 14 0v2M3 11h2m14 0h2"/>',
  transfer:'<path d="M4 7h16l-4-4m4 14H4l4 4M20 7l-4 4M4 17l4-4"/>',
  investment:'<path d="M3 20h18M6 17v-5m6 5V9m6 8V5M5 9l6-4 4 1 5-3"/>',
  withdrawal:'<rect x="3" y="4" width="18" height="10" rx="2"/><path d="M7 10h10m-8 0v10h6V10"/>',
  dailycare:'<rect x="7" y="8" width="10" height="13" rx="2"/><path d="M10 8V4h6m-6 11h4"/>',
  other:'<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 12h8m-4-4v8"/>'
};
function categoryIcon(id){
  var aliases={cash:"withdrawal",cash_withdrawal:"withdrawal",other_income:"family"};
  var key=Object.hasOwn(aliases,id)?aliases[id]:id;
  var shape=Object.hasOwn(cashlyCategoryShapes,key)?cashlyCategoryShapes[key]:cashlyCategoryShapes.other;
  return '<svg class="category-svg" aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+shape+'</svg>';
}

var calculatorDrafts=new Map();
function rememberCalculatorDraft(){
  var frame=document.querySelector("iframe[data-calculator]");
  var id=frame?.dataset.calculator;
  var panel=id&&frame.contentDocument?.getElementById(id);
  if(!panel)return;
  if(id==="retire-today"&&frame.contentWindow.cashlyRetirementDraft){
    calculatorDrafts.set(id,frame.contentWindow.cashlyRetirementDraft.read());
    return;
  }
  var inputs=[...panel.querySelectorAll("input[id],select[id]")].map(input=>[input.id,input.value]);
  calculatorDrafts.set(id,inputs);
}
function restoreCalculatorDraft(frame){
  var id=frame.dataset.calculator,draft=calculatorDrafts.get(id),doc=frame.contentDocument;
  if(!draft||!doc)return;
  if(id==="retire-today"){frame.contentWindow.cashlyRetirementDraft?.restore(draft);return;}
  for(var [name,value] of draft){
    var input=doc.getElementById(name);
    if(input){input.value=value;input.dispatchEvent(new Event("input",{bubbles:true}));}
  }
  var method={retirement:"calcRetirement",sip:"calcSip",emi:"calcEmi",inflation:"calcInflation"}[id];
  if(method)frame.contentWindow[method]?.();
}
