/* Cashly V6 bilingual grouped retirement planner. Data stays in page memory; no personal answers are sent to Cashly. */
(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const INR = n => Number.isFinite(n) ? '₹' + Math.round(n).toLocaleString('en-IN') : '—';
  const questions = [
    {id:'salary',title:'What is your monthly take-home salary?',help:'Start with net monthly salary after income tax and deductions. Enter 0 if you are not earning.',unit:'₹ / month',def:50000},
    {id:'otherIncome',title:'Other regular monthly income?',help:'Freelancing, pension or dependable income other than rent. Do not include investment returns already counted in assets.',unit:'₹ / month',def:0},
    {id:'age',title:'What is your current age?',help:'Used to calculate how many years your money may need to last.',unit:'years',def:35,min:18,max:100},
    {id:'sex',title:'Sex for longevity planning?',help:'Used only to suggest a conservative planning age, not to predict your lifespan. You can select Prefer not to say.',type:'select',options:[['female','Female'],['male','Male'],['other','Other / prefer not to say']],def:'other'},
    {id:'life',title:'Plan finances until what age?',help:'Suggested age is a conservative planning horizon (male 90, female 92, otherwise 92), NOT an Indian actuarial life-expectancy prediction. Change it for your own planning, including health concerns; a shorter horizon increases risk of running out of money.',unit:'age',def:92,min:40,max:110},
    {id:'dependents',title:'How many people depend on this budget?',help:'Include yourself, spouse, children, and dependent parents. This is for context; enter total household expenses below.',unit:'people',def:2,min:1,max:30},
    {id:'rent',title:'Monthly rent paid for your home?',help:'Enter 0 if you own the home and do not pay rent.',unit:'₹ / month',def:10000},
    {id:'food',title:'Monthly food and groceries?',help:'Include groceries, milk, eating out, and household essentials.',unit:'₹ / month',def:12000},
    {id:'clothes',title:'Monthly clothing and footwear?',help:'Average annual purchases over 12 months.',unit:'₹ / month',def:1500},
    {id:'water',title:'Monthly water bill?',help:'Enter 0 if included in rent or society charges.',unit:'₹ / month',def:300},
    {id:'electric',title:'Monthly electricity and cooking gas?',help:'Use your average across summer and winter.',unit:'₹ / month',def:2500},
    {id:'internet',title:'Monthly internet and mobile bills?',help:'Include broadband and all family SIM plans.',unit:'₹ / month',def:1000},
    {id:'phoneUpgrade',title:'Total phone/device upgrade spending every 3 years?',help:'Enter the combined replacement cost for family phones, laptops, and similar devices over three years. We spread it across 36 months.',unit:'₹ / 3 years',def:45000},
    {id:'transport',title:'Monthly transport and vehicle costs?',help:'Fuel, public transport, maintenance, insurance, parking and commute; exclude loan EMI entered later.',unit:'₹ / month',def:4000},
    {id:'medical',title:'Monthly medicines and out-of-pocket healthcare?',help:'Doctor visits, medicines, dental and expected healthcare not paid by insurance.',unit:'₹ / month',def:2000},
    {id:'healthPremium',title:'Health insurance premium amount?',help:'Premium for the whole household. Select whether this is monthly or annual.',unit:'₹',def:24000},
    {id:'healthFrequency',title:'How often is the health insurance premium paid?',help:'Annual premiums are divided by 12.',type:'select',options:[['annual','Yearly'],['monthly','Monthly']],def:'annual'},
    {id:'termPremium',title:'Term life insurance premium amount?',help:'Enter 0 if you do not have a term policy.',unit:'₹',def:12000},
    {id:'termFrequency',title:'How often is the term insurance premium paid?',help:'Annual premiums are divided by 12.',type:'select',options:[['annual','Yearly'],['monthly','Monthly']],def:'annual'},
    {id:'education',title:'Monthly education, childcare and dependent costs?',help:'School fees, tuition, support to parents, and other dependents. Include future major expenses separately in the one-time goal field.',unit:'₹ / month',def:3000},
    {id:'misc',title:'Other monthly living expenses?',help:'Society charges, entertainment, travel savings, subscriptions, gifts, domestic help and anything missed.',unit:'₹ / month',def:4000},
    {id:'loanEmi',title:'Monthly loan EMI payments?',help:'Home, personal, car, education and other EMIs combined. We also subtract outstanding loan balances from assets.',unit:'₹ / month',def:0},
    {id:'bank',title:'Bank account balance?',help:'Savings and current account cash available to you. Exclude funds already counted in FDs.',unit:'₹',def:200000},
    {id:'fd',title:'Total fixed deposits and recurring deposits?',help:'Current redeemable value, including accrued interest where known.',unit:'₹',def:300000},
    {id:'stocks',title:'Current value of direct shares / stock market holdings?',help:'Use the latest market value of Indian and overseas listed shares, not the original purchase price. Do not double-count mutual funds.',unit:'₹',def:0},
    {id:'mutualFunds',title:'Current value of mutual funds?',help:'Include equity, debt, hybrid and index mutual funds at current redemption value. Do not double-count stocks.',unit:'₹',def:0},
    {id:'investments',title:'Bonds, ETFs and other accessible investments?',help:'Enter current redeemable value excluding direct shares and mutual funds already entered. Exclude restricted EPF/NPS.',unit:'₹',def:0},
    {id:'locked',title:'EPF, PPF, NPS or other restricted retirement savings?',help:'Enter current balance separately. Not counted as immediately accessible unless you can withdraw it now.',unit:'₹',def:0},
    {id:'goldQty',title:'How much physical gold do you own?',help:'Enter gold weight excluding stones and gems. You can choose grams or tola next. A live reference rate will be attempted.',unit:'weight',def:0,step:'0.001'},
    {id:'goldUnit',title:'Gold weight unit?',help:'1 Indian tola ≈ 11.6638 grams.',type:'select',options:[['gram','Grams'],['tola','Tola']],def:'gram'},
    {id:'goldPurity',title:'Gold purity?',help:'Jewellery is often 22K; coins or bars may be 24K. Actual resale price is typically lower than reference spot.',type:'select',options:[['22','22 karat'],['24','24 karat'],['18','18 karat']],def:'22'},
    {id:'goldManual',title:'24K gold price per gram in ₹?',help:'We try to fetch an indicative live international gold spot rate converted to INR. Verify with your local Indian bullion/jewellery rate and overwrite if needed. Enter a manual rate if the fetch fails.',unit:'₹ / gram (24K)',def:0},
    {id:'land',title:'Estimated market value of land you own?',help:'Enter realistic resale value. Land is illiquid and is NOT included in immediately spendable retirement funds.',unit:'₹',def:0},
    {id:'home',title:'Value of your self-occupied home?',help:'A home you live in is not automatically retirement income; it is excluded from spendable corpus.',unit:'₹',def:0},
    {id:'rentalProperty',title:'Value of property you rent out?',help:'Property market value is shown in net worth, but not assumed sold. Enter actual rental income next.',unit:'₹',def:0},
    {id:'rentalIncome',title:'Gross monthly rental income received?',help:'Enter actual rent before vacancy, repairs, tax and maintenance. A 25% allowance is applied to estimate net rent.',unit:'₹ / month',def:0},
    {id:'otherAssets',title:'Other assets that could realistically be sold?',help:'Vehicle/business/other assets at conservative net resale value. Not counted as immediately accessible.',unit:'₹',def:0},
    {id:'debt',title:'Total outstanding loans and debts?',help:'Remaining principal of home, personal, car, credit card and other debts. Avoid double counting an EMI as an asset.',unit:'₹',def:0},
    {id:'goals',title:'Future major one-time expenses?',help:'Total today-value estimate for weddings, higher education, house repairs, etc. We reserve this amount from available funds; this is a simplified treatment.',unit:'₹',def:0},
    {id:'inflation',title:'Expected annual inflation?',help:'Editable India planning assumption. Medical/education costs may inflate faster. 6% is an illustration, not a forecast.',unit:'% per year',def:6,min:0,max:25,step:'0.1'},
    {id:'returnRate',title:'Expected after-tax annual investment return?',help:'A cautious assumption for your diversified portfolio, after tax and fees. Not guaranteed. 7% is illustrative.',unit:'% per year',def:7,min:0,max:25,step:'0.1'},
    {id:'buffer',title:'How many months of expenses as emergency cash?',help:'Reserve 6–12 months for emergencies before evaluating spendable investments.',unit:'months',def:12,min:0,max:60}
  ];

 const answers=Object.fromEntries(questions.map(q=>[q.id,q.def]));
 const byId=Object.fromEntries(questions.map(q=>[q.id,q]));
 const groups=[
  {en:'About you & income',hi:'आपकी उम्र और कमाई',enHelp:'How long should your money last, and what comes in each month?',hiHelp:'आपकी उम्र और महीने की कमाई से शुरुआत करें।',ids:['age','sex','life','dependents','salary','otherIncome']},
  {en:'Monthly household expenses',hi:'हर महीने का खर्च',enHelp:'Add the real cost of running your home. Use monthly averages.',hiHelp:'किराया, राशन, बिजली—सभी का मासिक औसत जोड़ें।',ids:['rent','food','clothes','water','electric','internet','phoneUpgrade','transport','medical','education','misc']},
  {en:'Insurance & protection',hi:'बीमा और सुरक्षा',enHelp:'Enter each premium and choose monthly or yearly on this same page.',hiHelp:'हेल्थ और टर्म बीमा का प्रीमियम और अवधि यहीं भरें।',ids:['healthPremium','healthFrequency','termPremium','termFrequency']},
  {en:'Savings & investments',hi:'बचत और निवेश',enHelp:'Use today’s value, not what you originally invested.',hiHelp:'बैंक, FD, शेयर और म्यूचुअल फंड की आज की कीमत भरें।',ids:['bank','fd','stocks','mutualFunds','investments','locked']},
  {en:'Gold & property',hi:'सोना और प्रॉपर्टी',enHelp:'Gold weight, unit, purity and price are all together. Your home is not ready cash.',hiHelp:'सोने का वजन, तोला/ग्राम, शुद्धता और भाव एक साथ भरें।',ids:['goldQty','goldUnit','goldPurity','goldManual','land','home','rentalProperty','rentalIncome','otherAssets']},
  {en:'Debts & future goals',hi:'कर्ज और भविष्य के खर्च',enHelp:'Loans and major planned expenses reduce your available savings.',hiHelp:'लोन और आने वाले बड़े खर्च आपकी बचत को प्रभावित करते हैं।',ids:['loanEmi','debt','goals']},
  {en:'Inflation & safety',hi:'महँगाई और सुरक्षा',enHelp:'Choose cautious assumptions; no return is guaranteed.',hiHelp:'महँगाई और रिटर्न का समझदारी से अनुमान चुनें।',ids:['inflation','returnRate','buffer']},
  {en:'Review your details',hi:'जानकारी जाँचें',enHelp:'Review everything before generating your retirement estimate.',hiHelp:'रिपोर्ट बनाने से पहले अपनी जानकारी जाँच लें।',ids:[]}
 ];
 const hiLabels={salary:'मासिक इन-हैंड सैलरी',otherIncome:'दूसरी मासिक कमाई',age:'आपकी उम्र',sex:'लिंग (वैकल्पिक)',life:'किस उम्र तक पैसों की योजना?',dependents:'परिवार में निर्भर लोग',rent:'मासिक किराया',food:'राशन और खाना',clothes:'कपड़े और जूते',water:'पानी का बिल',electric:'बिजली और गैस',internet:'मोबाइल और इंटरनेट',phoneUpgrade:'3 साल में फोन/डिवाइस पर खर्च',transport:'आना-जाना और वाहन',medical:'दवा और डॉक्टर',education:'पढ़ाई और परिवार',misc:'अन्य मासिक खर्च',healthPremium:'हेल्थ इंश्योरेंस प्रीमियम',healthFrequency:'हेल्थ प्रीमियम कितनी बार?',termPremium:'टर्म इंश्योरेंस प्रीमियम',termFrequency:'टर्म प्रीमियम कितनी बार?',bank:'बैंक बैलेंस',fd:'FD और RD',stocks:'शेयर मार्केट',mutualFunds:'म्यूचुअल फंड',investments:'अन्य निवेश',locked:'EPF / PPF / NPS',goldQty:'सोने का वजन',goldUnit:'वजन की इकाई',goldPurity:'सोने की शुद्धता',goldManual:'24K सोने का भाव (₹/ग्राम)',land:'जमीन की कीमत',home:'अपने घर की कीमत',rentalProperty:'किराये वाली प्रॉपर्टी की कीमत',rentalIncome:'मासिक किराया आय',otherAssets:'अन्य संपत्ति',loanEmi:'मासिक EMI',debt:'बकाया कर्ज',goals:'आने वाले बड़े खर्च',inflation:'अनुमानित महँगाई (%)',returnRate:'अनुमानित टैक्स-बाद रिटर्न (%)',buffer:'इमरजेंसी फंड (महीने)'};
 let step=0,lang='en',liveGold=null,lifeEdited=false, reportShown=false;
 const number=k=>Number(answers[k])||0;
 const suggestedAge=()=>answers.sex==='male'?90:92;
 const t=(en,hi)=>lang==='hi'?hi:en;
 const label=q=>lang==='hi'?(hiLabels[q.id]||q.title):q.title.replace(/\?$/,'');
 const fieldIds=()=>groups[step].ids;
 function renderField(id){
  const q=byId[id], wrap=document.createElement('div');wrap.className='cashly-group-field';
  const lab=document.createElement('label');lab.htmlFor='field-'+id;lab.textContent=label(q);wrap.append(lab);
  let el;
  if(q.type==='select'){
   el=document.createElement('select');for(const [v,text] of q.options){const opt=document.createElement('option');opt.value=v;opt.textContent=lang==='hi'?({Yearly:'सालाना',Monthly:'मासिक',Grams:'ग्राम',Tola:'तोला',Female:'महिला',Male:'पुरुष','Other / prefer not to say':'बताना नहीं चाहते','22 karat':'22 कैरेट','24 karat':'24 कैरेट','18 karat':'18 कैरेट'}[text]||text):text;el.append(opt);}el.value=String(answers[id]);
  } else {el=document.createElement('input');el.type='number';el.inputMode='decimal';el.min=q.min??0;el.max=q.max??'';el.step=q.step||'any';el.value=String(answers[id]);}
  el.id='field-'+id;el.dataset.field=id;el.addEventListener('input',()=>{if(el.type==='number'){if(el.value!==''&&el.checkValidity())answers[id]=Number(el.value);}else answers[id]=el.value;if(id==='sex'&&!lifeEdited){answers.life=suggestedAge();const life=$('field-life');if(life)life.value=answers.life;}if(id==='life')lifeEdited=true;updateMood();});
  wrap.append(el);
  if(id==='phoneUpgrade'){const note=document.createElement('small');note.textContent=t('Example: ₹36,000 every 3 years = ₹1,000/month.','उदाहरण: 3 साल में ₹36,000 = ₹1,000 प्रति माह।');wrap.append(note);}
  if(id==='goldManual'){const note=document.createElement('small');note.id='goldStatus';note.textContent=t('Enter a verified local 24K rate, or wait for indicative live rate.','24K का स्थानीय भाव भरें, या अनुमानित लाइव रेट देखें।');wrap.append(note);}
  return wrap;
 }
 function show(){
  reportShown=false;$('wizardForm').hidden=false;$('wizardResults').hidden=true;
  const g=groups[step];$('wizardStep').textContent=t('Step '+(step+1)+' of '+groups.length,'चरण '+(step+1)+' / '+groups.length);
  $('wizardBar').style.width=(100*(step+1)/groups.length)+'%';$('wizardQuestion').textContent=lang==='hi'?g.hi:g.en;$('wizardHelp').textContent=lang==='hi'?g.hiHelp:g.enHelp;
  const host=$('wizardField');host.replaceChildren();host.className='wizard-field cashly-fields';
  if(g.ids.length){for(const id of g.ids)host.append(renderField(id));}
  else {for(const group of groups.slice(0,-1)){const line=document.createElement('div');line.className='cashly-review-line';line.textContent=(lang==='hi'?group.hi:group.en)+' · '+group.ids.length+' '+t('details','जानकारियाँ');const btn=document.createElement('button');btn.type='button';btn.textContent=t('Edit','बदलें');btn.addEventListener('click',()=>{step=groups.indexOf(group);show()});line.append(btn);host.append(line);}}
  $('wizardBack').disabled=step===0;$('wizardBack').textContent=t('← Back','← पीछे');$('wizardNext').textContent=step===groups.length-1?t('See my report →','मेरी रिपोर्ट देखें →'):t('Continue →','आगे बढ़ें →');
  document.querySelectorAll('[data-cashly-lang]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.cashlyLang===lang));});
  updateMood();if(g.ids.includes('goldManual')&&!liveGold)fetchGold();
 }
 function validate(){for(const id of fieldIds()){const el=$('field-'+id);if(el&&el.type==='number'&&(el.value===''||!el.checkValidity()||!Number.isFinite(Number(el.value)))){el.reportValidity();el.focus();return false;}}if(number('life')<=number('age')&&step===0){alert(t('Planning age must exceed current age.','योजना की उम्र वर्तमान उम्र से अधिक रखें।'));$('field-life').focus();return false;}return true;}
 function next(){if(!validate())return;if(step<groups.length-1){step++;show();}else results();}
 $('wizardNext').addEventListener('click',next);$('wizardBack').addEventListener('click',()=>{if(step>0){step--;show();}});
 document.querySelectorAll('[data-cashly-lang]').forEach(b=>b.addEventListener('click',()=>{lang=b.dataset.cashlyLang;if(reportShown)results();else show();}));
 async function fetchGold(){
  try{const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),6500);let gold,fx;try{[gold,fx]=await Promise.all([fetch('https://api.gold-api.com/price/XAU',{signal:abort.signal,cache:'no-store'}).then(r=>r.json()),fetch('https://open.er-api.com/v6/latest/USD',{signal:abort.signal,cache:'no-store'}).then(r=>r.json())]);}finally{clearTimeout(timer)}
   const usd=Number(gold.price),inr=Number(fx.rates?.INR);if(!(usd>500&&inr>20))throw Error('Invalid rate');liveGold={price:Math.round(usd*inr/31.1034768),time:new Date().toLocaleString('en-IN')};if(!number('goldManual')){answers.goldManual=liveGold.price;const el=$('field-goldManual');if(el)el.value=liveGold.price;}const note=$('goldStatus');if(note)note.textContent=t('Indicative international spot conversion: '+INR(liveGold.price)+'/g at '+liveGold.time+'. Verify Indian resale price.','अनुमानित अंतरराष्ट्रीय भाव '+INR(liveGold.price)+'/ग्राम ('+liveGold.time+')। स्थानीय भाव जाँचें।');
  }catch(e){const note=$('goldStatus');if(note)note.textContent=t('Live rate unavailable. Enter a local verified 24K rate.','लाइव रेट नहीं मिला। स्थानीय 24K का भाव भरें।');}
 }
  function annualPV(monthly,years,nominal,inflation){
    // Monthly expense is annualised; annual withdrawals start after first year, escalating with inflation.
    if(years<=0 || monthly<=0)return 0;
    const r=nominal/100,g=inflation/100;
    if(Math.abs(r-g)<1e-9)return monthly*12*years/(1+r);
    return monthly*12*(1-Math.pow((1+g)/(1+r),years))/(r-g);
  }
  function results(){
    const age=number('age'),horizon=number('life')-age;
    if(horizon<=0){alert('Planning age must be greater than current age. Please correct the ages.');step=0;show();return;}
    const insurance=number('healthPremium')/(answers.healthFrequency==='annual'?12:1)+number('termPremium')/(answers.termFrequency==='annual'?12:1);
    const essential=['rent','food','clothes','water','electric','internet','transport','medical','education','misc'];
    const living=essential.reduce((sum,key)=>sum+number(key),0)+number('phoneUpgrade')/36+insurance;
    const loanEmi=number('loanEmi');
    const expenses=living+loanEmi;
    const netRent=number('rentalIncome')*.75;
    const income=number('salary')+number('otherIncome')+netRent;
    const surplus=income-expenses;
    const grams=number('goldQty')*(answers.goldUnit==='tola'?11.6638038:1);
    const gold=grams*number('goldManual')*Number(answers.goldPurity)/24*.90; // 10% resale haircut, illustrative
    const liquid=number('bank')+number('fd')+number('stocks')+number('mutualFunds')+number('investments')+gold;
    const illiquid=number('land')+number('home')+number('rentalProperty')+number('otherAssets')+number('locked');
    const netWorth=liquid+illiquid-number('debt');
    const emergency=expenses*number('buffer');
    const available=Math.max(0,liquid-number('debt')-number('goals')-emergency);
    // Salary ceases at retirement; other dependable income and conservatively netted rental income continue.
    const passive=number('otherIncome')+netRent;
    // EMI debt is assumed paid off at retirement if principal is deducted; ongoing loan EMI excluded from long-run retirement spending.
    const need=Math.max(0,living-passive);
    const target=annualPV(need,horizon,number('returnRate'),number('inflation'));
    const ready=available>=target && number('life')>age;
    const coverage=target>0?available/target:Infinity;
    const stressTarget=annualPV(need,horizon,Math.max(0,number('returnRate')-2),number('inflation')+1);
    const stressReady=available>=stressTarget;
    const months=expenses>0?liquid/expenses:Infinity;
    const html = `<div class="${ready?'good':'warn'}"><div class="big-answer">${ready?'YES — potentially':'NO — not yet'}</div><strong>${ready?'Your accessible funds cover the modelled retirement target.':'Your accessible funds do not cover the modelled retirement target.'}</strong><p class="note">This is a conditional projection, never a guarantee that you can retire for life. Check healthcare, dependents, tax, returns, and asset access before acting.</p></div>
      <h3>Monthly cash flow today</h3><table>
      <tr><td>Take-home salary</td><td>${INR(number('salary'))}</td></tr>
      <tr><td>Other income + estimated net rent</td><td>${INR(number('otherIncome')+netRent)}</td></tr>
      <tr><td>Living expenses (incl. premiums and device upgrades)</td><td>${INR(living)}</td></tr>
      <tr><td>Loan EMIs</td><td>${INR(loanEmi)}</td></tr>
      <tr><td><strong>Current monthly ${surplus>=0?'surplus':'shortfall'}</strong></td><td>${INR(Math.abs(surplus))} ${surplus>=0?'surplus':'shortfall'}</td></tr></table>
      <h3>Assets and retirement estimate</h3><table>
      <tr><td>Accessible bank + FD + shares + mutual funds + other investments + gold</td><td>${INR(liquid)}</td></tr>
      <tr><td>Illiquid/restricted assets (not retirement cash)</td><td>${INR(illiquid)}</td></tr>
      <tr><td>Outstanding debt</td><td>${INR(number('debt'))}</td></tr>
      <tr><td>Estimated total net worth</td><td>${INR(netWorth)}</td></tr>
      <tr><td>Emergency reserve (${number('buffer')} months)</td><td>${INR(emergency)}</td></tr>
      <tr><td>Major goal reserve</td><td>${INR(number('goals'))}</td></tr>
      <tr><td><strong>Conservatively available retirement corpus</strong></td><td>${INR(available)}</td></tr>
      <tr><td>Retirement living costs less passive income / month</td><td>${INR(need)}</td></tr>
      <tr><td>Required corpus until age ${number('life')}</td><td>${INR(target)}</td></tr>
      <tr><td><strong>Corpus ${ready?'above':'below'} target</strong></td><td>${INR(Math.abs(available-target))}</td></tr>
      <tr><td>Stress-test target (return −2%, inflation +1%)</td><td>${INR(stressTarget)}</td></tr></table>
      <div class="${stressReady?'good':'warn'}"><strong>Stress test: ${stressReady?'Passes':'Does not pass'}</strong><p class="note">Uses a less favorable return and inflation scenario; still excludes major unforeseen shocks.</p></div>
      <p class="note">${surplus<0?'Your present income does not cover your expenses.':'Your present income exceeds expenses by '+INR(surplus)+' per month, before any unlisted costs.'} ${Number.isFinite(months)?'Liquid assets cover roughly '+months.toFixed(1)+' months of current expenses before other reserves.':''}</p>
      <details class="calc-disclosure"><summary>How we calculated · गणना कैसे हुई</summary><p class="note"><strong>Model assumptions:</strong> after-tax return ${number('returnRate')}% yearly; expense inflation ${number('inflation')}% yearly; net rent = 75% of gross (25% vacancy/maintenance/tax allowance); gold valued at 90% of purity-adjusted reference rate; debts, emergency reserve and one-time goals deducted from liquid assets. Salary stops at retirement. Loan EMI is excluded from long-term living costs after outstanding debt is deducted; this assumes debts can be settled from the deducted funds. Self-occupied homes, land, rental-property sale value, and restricted savings are excluded from retirement liquidity. Annual withdrawal timing is approximated.</p>
      <p class="note"><strong>Important limitations:</strong> No certainty about lifelong solvency, actual future gold prices, investment sequence risk, changing taxes, medical inflation, pension eligibility, asset saleability, rental vacancies, or future loan schedules. An apparent YES is not a recommendation to quit work. Gold pricing uses a reference spot conversion and may not match Indian retail or resale rates. Review with a qualified financial planner before major decisions.</p></details>
      <div class="wizard-actions"><button type="button" class="btn" id="wizardEdit">← Edit answers</button><button type="button" class="btn btn-primary" id="wizardRestart">Reset answers</button></div>`;
    $('wizardForm').hidden=true;
    $('wizardResults').hidden=false;reportShown=true;
    $('wizardResults').innerHTML=html;updateMood(true,ready,coverage);addInlineEditor();localizeReport();
    $('wizardEdit').addEventListener('click',()=>{step=0;show();});
    $('wizardRestart').addEventListener('click',()=>{if(!confirm(t('Clear all answers and start again?','सभी उत्तर मिटाकर दोबारा शुरू करें?')))return;for(const q of questions)answers[q.id]=q.def;lifeEdited=false;step=0;show();});
  }


 function addInlineEditor(){
  const root=$('wizardResults');const panel=document.createElement('details');panel.className='cashly-inline-edit';panel.open=false;
  const summary=document.createElement('summary');summary.textContent=t('✎ Edit any amount & recalculate here','✎ यहीं रकम बदलें और रिपोर्ट अपडेट करें');panel.append(summary);
  const grid=document.createElement('div');grid.className='cashly-fields';
  for(const g of groups.slice(0,-1)){
   const section=document.createElement('details');section.className='cashly-edit-section';const heading=document.createElement('summary');heading.textContent=lang==='hi'?g.hi:g.en;section.append(heading);
   const inner=document.createElement('div');inner.className='cashly-fields';for(const id of g.ids)inner.append(renderField(id));section.append(inner);grid.append(section);
  }
  panel.append(grid);const save=document.createElement('button');save.className='btn btn-primary';save.type='button';save.textContent=t('Save & recalculate','सेव करें और फिर गणना करें');save.addEventListener('click',()=>{const invalid=[...panel.querySelectorAll('input')].find(e=>!e.checkValidity()||e.value==='');if(invalid){invalid.focus();invalid.reportValidity();return;}if(number('life')<=number('age')){alert(t('Planning age must exceed current age.','योजना की उम्र वर्तमान उम्र से अधिक रखें।'));return;}results();});panel.append(save);
  root.prepend(panel);
 }
 function localizeReport(){
  const root=$('wizardResults');if(lang!=='hi')return;
  const replacements={'Monthly cash flow today':'आज का मासिक हिसाब','Assets and retirement estimate':'संपत्ति और रिटायरमेंट अनुमान','Take-home salary':'मासिक सैलरी','Other income + estimated net rent':'अन्य आय और शुद्ध किराया','Living expenses (incl. premiums and device upgrades)':'मासिक खर्च (बीमा सहित)','Loan EMIs':'लोन EMI','Outstanding debt':'बकाया कर्ज','Estimated total net worth':'कुल अनुमानित नेट वर्थ','Major goal reserve':'भविष्य के बड़े खर्च','Conservatively available retirement corpus':'रिटायरमेंट के लिए उपलब्ध रकम','Stress-test target (return −2%, inflation +1%)':'मुश्किल स्थिति में जरूरी रकम','YES — potentially':'हाँ — अनुमान के अनुसार','NO — not yet':'अभी नहीं'};
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=walker.nextNode()){let v=n.nodeValue;for(const [a,b] of Object.entries(replacements))v=v.replaceAll(a,b);n.nodeValue=v;}
 }
 function updateMood(final=false,ready=false,coverage=0){
  const node=$('retireMood');if(!node)return;
  if(final){node.textContent=ready?t('😊 Potentially funded — check the stress test.','😊 अनुमान के अनुसार पर्याप्त — मुश्किल स्थिति भी देखें।'):coverage>=.5?t('😟 Funding gap remains.','😟 अभी कुछ रकम कम है।'):t('😢 Significant funding gap.','😢 रिटायरमेंट के लिए बड़ी कमी है।');node.dataset.state=ready?'good':'bad';return;}
  const status=step<2?t('🧐 Gathering your financial picture.','🧐 आपकी आर्थिक जानकारी जुटा रहे हैं।'):step<5?t('🤔 Assessment in progress — assets and debts may change the result.','🤔 अनुमान जारी है — संपत्ति और कर्ज से नतीजा बदल सकता है।'):t('🔎 Almost ready — finish the details for a reliable estimate.','🔎 लगभग तैयार — सही अनुमान के लिए बाकी जानकारी भरें।');
  node.textContent=status;node.dataset.state='pending';
 }
 document.querySelectorAll('.calc-grid > details').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)document.querySelectorAll('.calc-grid > details').forEach(other=>{if(other!==detail)other.open=false;});}));
 if(document.documentElement.classList.contains('cashly-embedded'))window.cashlyRetirementDraft={
    read:()=>({answers:{...answers},step,lang,lifeEdited,reportShown}),
    restore:draft=>{
      for(const key of Object.keys(answers))if(Object.hasOwn(draft.answers,key))answers[key]=draft.answers[key];
      step=Math.max(0,Math.min(groups.length-1,draft.step));
      lang=draft.lang==='hi'?'hi':'en';
      lifeEdited=!!draft.lifeEdited;
      if(draft.reportShown)results();else show();
    }
 };
 show();const hash=location.hash.slice(1);if(hash&&$(hash)?.matches('details.calc-card'))$(hash).open=true;
})();
