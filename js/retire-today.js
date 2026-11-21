/* Cashly retirement-readiness wizard. No personal inputs are transmitted or stored. */
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
  const answers = Object.fromEntries(questions.map(q => [q.id, q.def]));
  let step = 0, liveGold = null, lifeEdited = false;
  const suggestedAge = () => answers.sex==='male'?90:92;
  const number = key => Number(answers[key]) || 0;
  function show() {
    const q = questions[step];
    $('wizardStep').textContent = `Question ${step + 1} of ${questions.length} · ${Math.round((step / questions.length) * 100)}% complete`;
    $('wizardBar').style.width = `${100 * step / questions.length}%`;
    $('wizardQuestion').textContent = q.title;
    $('wizardHelp').textContent = q.help;
    $('goldStatus').textContent = q.id === 'goldManual' ? (liveGold ? `Indicative live spot conversion: ${INR(liveGold.price)}/g (24K), checked ${liveGold.time}. Not an Indian retail quote; verify manually.` : 'Checking indicative gold price… If unavailable, enter a verified local 24K price manually.') : '';
    const host = $('wizardField'); host.replaceChildren();
    const label = document.createElement('label'); label.htmlFor = 'wizardInput'; label.textContent = q.unit || 'Select an option'; host.append(label);
    let el;
    if(q.type === 'select') {
      el = document.createElement('select');
      for(const [value,text] of q.options){ const opt=document.createElement('option'); opt.value=value; opt.textContent=text; el.append(opt); }
      el.value = answers[q.id];
    } else {
      el=document.createElement('input');el.type='number';el.inputMode='decimal';el.min=q.min ?? 0;el.max=q.max ?? 1e15;el.step=q.step ?? 'any';el.value=answers[q.id];el.required=true;
    }
    el.id='wizardInput'; el.setAttribute('aria-label',q.title); host.append(el);
    $('wizardBack').disabled = step===0;
    updateMood();
    $('wizardNext').textContent = step===questions.length-1 ? 'See my result →' : 'Next →';
    if(q.id==='goldManual' && !liveGold) fetchGold();
  }
  function save(){
    const q=questions[step], el=$('wizardInput');
    if(q.type==='select'){answers[q.id]=el.value;return true;}
    if(el.value.trim()==='' || !el.checkValidity() || !Number.isFinite(Number(el.value))){el.reportValidity();return false;}
    answers[q.id]=Number(el.value);if(q.id==='life')lifeEdited=true;return true;
  }
  function goNext(){if(!save())return;if(questions[step].id==='sex' && !lifeEdited)answers.life=suggestedAge();if(step<questions.length-1){step++;show();}else results();}
  function goBack(){if(step>0){save();step--;show();}}
  $('wizardNext').addEventListener('click',goNext);
  $('wizardBack').addEventListener('click',goBack);
  $('wizardField').addEventListener('input',()=>{const q=questions[step],el=$('wizardInput');if(q.type==='select')answers[q.id]=el.value;else if(el.value!=='' && el.checkValidity())answers[q.id]=Number(el.value);if(q.id==='sex'&&!lifeEdited)answers.life=suggestedAge();updateMood();});
  $('wizardField').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();goNext();}});
  // External price requests transmit no user financial data. Both endpoints must support CORS.
  async function fetchGold(){
    try {
      const abort = new AbortController(); const timer=setTimeout(()=>abort.abort(),6500);
      let gold,fx;
      try {
        [gold,fx]=await Promise.all([
          fetch('https://api.gold-api.com/price/XAU',{signal:abort.signal,cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Gold unavailable');return r.json();}),
          fetch('https://open.er-api.com/v6/latest/USD',{signal:abort.signal,cache:'no-store'}).then(r=>{if(!r.ok)throw Error('FX unavailable');return r.json();})
        ]);
      } finally {clearTimeout(timer);}
      const usdOz=Number(gold.price),inr=Number(fx.rates?.INR);
      if(!Number.isFinite(usdOz)||!Number.isFinite(inr)||usdOz<500||inr<20)throw Error('Invalid feed');
      const price=usdOz*inr/31.1034768;
      liveGold={price:Math.round(price),time:new Date().toLocaleString('en-IN')};
      if(number('goldManual')===0){answers.goldManual=liveGold.price;if(questions[step].id==='goldManual')$('wizardInput').value=liveGold.price;}
      if(questions[step].id==='goldManual')$('goldStatus').textContent=`Indicative international 24K spot conversion: ${INR(price)}/g, checked ${liveGold.time}. Not Indian retail or buyback rate; verify manually.`;
    } catch(e){if(questions[step].id==='goldManual')$('goldStatus').textContent='Live rate unavailable. Please enter a current verified local 24K gold rate per gram. Gold will be excluded if the rate stays at 0.';}
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
    if(horizon<=0){alert('Planning age must be greater than current age. Please correct the ages.');step=questions.findIndex(q=>q.id==='life');show();return;}
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
      <p class="note"><strong>Model assumptions:</strong> after-tax return ${number('returnRate')}% yearly; expense inflation ${number('inflation')}% yearly; net rent = 75% of gross (25% vacancy/maintenance/tax allowance); gold valued at 90% of purity-adjusted reference rate; debts, emergency reserve and one-time goals deducted from liquid assets. Salary stops at retirement. Loan EMI is excluded from long-term living costs after outstanding debt is deducted; this assumes debts can be settled from the deducted funds. Self-occupied homes, land, rental-property sale value, and restricted savings are excluded from retirement liquidity. Annual withdrawal timing is approximated.</p>
      <p class="note"><strong>Important limitations:</strong> No certainty about lifelong solvency, actual future gold prices, investment sequence risk, changing taxes, medical inflation, pension eligibility, asset saleability, rental vacancies, or future loan schedules. An apparent YES is not a recommendation to quit work. Gold pricing uses a reference spot conversion and may not match Indian retail or resale rates. Review with a qualified financial planner before major decisions.</p>
      <div class="wizard-actions"><button type="button" class="btn" id="wizardEdit">← Edit answers</button><button type="button" class="btn btn-primary" id="wizardRestart">Start again</button></div>`;
    $('wizardForm').hidden=true;
    $('wizardResults').hidden=false;
    $('wizardResults').innerHTML=html;updateMood(true,ready,coverage);
    $('wizardEdit').addEventListener('click',()=>{step=0;$('wizardResults').hidden=true;$('wizardForm').hidden=false;show();});
    $('wizardRestart').addEventListener('click',()=>{for(const q of questions)answers[q.id]=q.def;lifeEdited=false;step=0;$('wizardResults').hidden=true;$('wizardForm').hidden=false;show();});
  }

  function updateMood(final=false, ready=false, coverage=0){
    const node=$('retireMood');if(!node)return;
    const completed=step+1, total=questions.length;
    if(final){
      const state=ready?'😊':coverage>=0.5?'😟':'😢';
      node.textContent=state+' '+(ready?'Potentially funded through your planning age — review the stress test.':coverage>=0.5?'Not enough to retire today; a funding gap remains.':'Large retirement funding gap — keep building your safety net.');
      node.dataset.state=ready?'good':'bad';return;
    }
    // Never show a reassuring smile based on incomplete financial information.
    const entered=questions.slice(0,step).length;
    const expenseIndex=questions.findIndex(q=>q.id==='misc');
    const assetIndex=questions.findIndex(q=>q.id==='mutualFunds');
    if(entered<=expenseIndex){node.textContent='🧮 Enter income and expenses to begin your assessment ('+completed+'/'+total+').';}
    else if(entered<=assetIndex){node.textContent='😐 Current budget entered. Add all assets and debts before assessing retirement.';}
    else{node.textContent='🤔 Nearly there. Remaining debts, goals and assumptions can change the answer. No verdict yet.';}
    node.dataset.state='pending';
  }
  // Only one calculator open at once, including keyboard and browser-native details interaction.
  document.querySelectorAll('.calc-grid > details').forEach(detail => detail.addEventListener('toggle',()=>{
    if(detail.open)document.querySelectorAll('.calc-grid > details').forEach(other=>{if(other!==detail)other.open=false;});
  }));
  show();
  // Deep link #retire-today opens its section; others remain collapsed by default.
  const hash=location.hash.slice(1);if(hash && $(hash)?.matches('details.calc-card'))$(hash).open=true;
})();
