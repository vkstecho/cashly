const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');

async function run() {
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox']});
  try {
    const base = process.env.CASHLY_TEST_URL || 'http://127.0.0.1:8765';
    const page = await browser.newPage({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
    page.setDefaultTimeout(10000);
    const errors = [];
    let catalogUnavailable=false;
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.hostname === 'i.ytimg.com') {
        const path = url.pathname.includes('mnopqrstuvw')
          ? 'blog/002-5000-sip-compound-interest/cover.jpg'
          : 'blog/001-welcome-to-cashly/cover.jpg';
        return route.fulfill({path,contentType:'image/jpeg'});
      }
      if (url.origin !== base) return route.abort();
      if(catalogUnavailable&&url.pathname.endsWith('/content/videos.json'))return route.fulfill({status:503,body:'Fixture network error'});
      if (url.pathname.endsWith('/content/videos.json')) return route.fulfill({json: {schemaVersion: 1, channelName:'Cashly by VKS', lastSuccessfulSync:new Date().toISOString(), videos: [
        {id: 'abcdefghijk', title: 'Fixture Short', description: 'Test Short description', language: 'hi',
          contentType: 'short', publishedAt: '2026-08-05T00:00:00Z', durationSeconds: 42, embeddable: true},
        {id: 'mnopqrstuvw', title: 'Fixture Video', description: 'Learn about SIP and compound interest', language: 'hinglish', classificationSource:'creator-override',
          contentType: 'video', publishedAt: '2026-08-03T00:00:00Z', durationSeconds: 360, embeddable: true},
        {id:'aaaaabbbbbb',title:'Earlier Short',description:'Second Short',language:'hi',
          contentType:'short',publishedAt:'2026-08-02T00:00:00Z',durationSeconds:30,embeddable:true},
        {id:'bbbbbaaaaaa',title:'Unknown Video',description:'General catalog item',language:'und',
          contentType:'unknown',publishedAt:'2026-08-01T00:00:00Z',durationSeconds:100,embeddable:false}
      ]}});
      return route.continue();
    });
    await fs.mkdir(process.env.CASHLY_SCREENSHOTS || 'screenshots', {recursive: true});
    const photo = name => page.screenshot({path: (process.env.CASHLY_SCREENSHOTS || 'screenshots') + '/' + name + '.png', animations: 'disabled'});
    await page.goto(base + '/app/');
    await photo('launch');
    await page.evaluate(() => {
      ad = {name: 'Taylor', in: true};
      sv = () => {};
      D = emptyD();
      D.monthlyBudget = 26000;
      D.transactions = [
        {id: 'fixture1', type: 'expense', date: tdy(), amount: 1200.35, category: 'food', note: 'Market groceries', accountId: 'cash', tags:['household']},
        {id: 'fixture2', type: 'income', date: tdy(), amount: 45000, category: 'salary', note: 'Monthly salary'},
        {id: 'fixture3', type: 'expense', date: tdy(), amount: 149.5, category: 'transport', note: 'Train fare'},
        {id: 'fixture4', type: 'transfer', date: tdy(), amount: 5000, category: 'other', note: 'Between accounts'},
        {id: 'fixture5', type: 'expense', date: localDateKey(getWeekRange(-1).start), amount: 55, category: 'food', note: 'Last week lunch'}
      ];
      const now=new Date();
      for(let offset=1;offset<=4;offset++){
        const when=localDateKey(new Date(now.getFullYear(),now.getMonth()-offset,5));
        D.transactions.push(
          {id:'history-exp-'+offset,date:when,type:'expense',amount:8500+offset*2471,category:'food',note:'Earlier expenses',accountId:'cash'},
          {id:'history-inc-'+offset,date:when,type:'income',amount:16500+offset*1200,category:'salary',note:'Earlier income'}
        );
      }
      $('LS').classList.add('hidden');
      $('AS').classList.remove('hidden');
      rH(); rN(); rC();
    });
    const nav = name => page.locator('#NV').getByRole('button', {name, exact: true}).click();
    assert.deepEqual(await page.locator('#NV button').allTextContents(), ['Learn', 'Spends', 'Splits', 'Calculators']);
    await photo('spends');
    assert.equal(await page.locator('.fab:visible').count(), 0);
    await page.getByRole('button', {name: '+ Add', exact: true}).click();
    await photo('add-transaction');
    await page.locator('#ML .xmc').click();
    await page.getByRole('button', {name: /^Income/}).click();
    await page.getByText('Monthly salary').waitFor();
    await photo('credits');
    await page.getByRole('button',{name:'Categories',exact:true}).click();
    await page.getByText('Filtered income',{exact:true}).waitFor();
    await page.getByText('Salary',{exact:true}).last().waitFor();
    assert.equal(await page.locator('#CT').getByText('Food & Drinks',{exact:true}).count(),0);
    await photo('credit-categories');
    await page.locator('.wk-back').first().click();
    await page.getByRole('button', {name: 'Categories', exact: true}).click();
    await photo('categories');
    await page.locator('.wk-back').first().click();
    await page.getByRole('button', {name: 'View transactions', exact: true}).click();
    const search = page.getByRole('searchbox', {name: 'Search transactions'});
    await search.pressSequentially('Train');
    assert.equal(await search.inputValue(), 'Train');
    await page.getByText('Train fare').waitFor();
    assert.equal(await page.getByText('Market groceries').count(), 0);
    await search.fill('');
    await page.getByRole('button', {name: /Filters/}).click();
    await page.locator('dialog select[name=account]').selectOption('cash');
    await page.getByRole('button', {name: 'Apply filter'}).click();
    await page.getByText('Market groceries').waitFor();
    assert.equal(await page.getByText('Train fare').count(), 0);
    await page.getByRole('button', {name: 'Merchants', exact: true}).click();
    await page.getByRole('button', {name: /Market groceries/}).click();
    await page.getByText('Market groceries', {exact: true}).waitFor();
    assert.equal(await page.getByText('Train fare').count(), 0);
    await photo('transactions');
    await page.locator('.wk-back').first().click();
    await page.getByRole('button', {name: 'Trends', exact: true}).click();
    await page.getByRole('button', {name: 'Filter', exact: true}).click();
    await photo('trends-filter');
    await page.getByText('Include income', {exact: true}).click();
    await page.keyboard.press('Escape');
    await page.locator('dialog').waitFor({state: 'detached'});
    await page.getByText('Earned', {exact: true}).first().waitFor();
    await photo('trends');
    await page.locator('.cashly-trends-month[data-offset="-1"]').click();
    await page.getByText('Unavailable', {exact: true}).waitFor();
    await photo('trends-historical');
    await page.getByRole('button',{name:/^Review /}).click();
    await page.getByText('Earlier expenses',{exact:true}).waitFor();
    await photo('trends-historical-review');
    await page.goBack();
    await page.locator('.cashly-trends-month[data-offset="-1"][aria-pressed=true]').waitFor();
    await page.locator('.cashly-trends-month[data-offset="0"]').click();
    await page.getByRole('button', {name: 'Filter', exact: true}).click();
    await page.getByText('Include income', {exact: true}).click();
    await page.locator('dialog select[name=months]').selectOption('9');
    await page.locator('dialog input[name=category][value=food]').check();
    await page.getByRole('button', {name: 'Apply filter'}).click();
    assert.equal(await page.getByText('Earned', {exact: true}).count(), 0);
    assert.equal(await page.locator('.cashly-trends-month').count(), 9);
    await page.getByRole('button', {name: /^Review /}).click();
    await page.getByText('Market groceries').first().waitFor();
    assert.equal(await page.getByText('Train fare').count(), 0);
    assert.equal(await page.getByText('Monthly salary').count(), 0);
    assert.equal(await page.getByText('Between accounts').count(), 0);
    await page.getByRole('button', {name: 'Back', exact: true}).click();
    await page.locator('.cashly-trends-month[data-offset="0"][aria-pressed=true]').waitFor();
    assert.equal(await page.locator('.cashly-trends-month').count(),9);
    await page.getByRole('button', {name:'Back',exact:true}).click();
    await page.getByText('Budget', {exact: true}).click();
    await page.getByRole('button', {name: 'Edit', exact: true}).click();
    await page.getByLabel('Amount (₹)').fill('24999.99');
    await page.getByRole('button', {name: 'Save budget'}).click();
    await page.getByText('₹24,999.99').waitFor();
    await photo('budget');
    await page.getByRole('button', {name: 'Back', exact: true}).click();
    await nav('Learn');
    await page.getByText('Fixture Short').waitFor();
    await page.getByRole('heading',{name:'Featured Video'}).waitFor();
    await page.waitForFunction(()=>document.querySelector('.featured img')?.naturalWidth>0);
    assert.equal(await page.getByText('Fixture Video',{exact:true}).count(),1);
    assert.equal(await page.locator('.learn-short-rail .short-card').count(),2);
    assert.equal(await page.locator('.learn-feed-list').getByText('Fixture Short',{exact:true}).count(),0);
    assert.equal(await page.getByRole('link',{name:'Subscribe'}).getAttribute('href'),'https://youtube.com/@cashlybyVKS');
    await page.getByRole('button',{name:'Search Learn',exact:true}).click();
    assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-label')),'Search Learn');
    await photo('learn-all');
    await photo('learn-featured');
    await photo('learn-shorts-carousel');
    await page.getByRole('button',{name:'Learn notifications',exact:true}).click();
    await page.getByRole('switch',{name:'New videos'}).check();
    await page.getByText('You’re caught up.').waitFor();
    await photo('learn-notifications');
    await page.getByRole('button',{name:'Back',exact:true}).click();
    await page.getByRole('button', {name: 'Videos', exact: true}).click();
    await page.getByText('Fixture Video').waitFor();
    await page.getByLabel('Language').selectOption('hi');
    assert.equal(await page.getByText('Fixture Video',{exact:true}).count(),1);
    assert.equal(await page.getByText('Unknown Video',{exact:true}).count(),0);
    await page.getByLabel('Language').selectOption('all');
    await photo('learn-videos');
    await page.getByText('Fixture Video').click();
    await page.locator('iframe.learn-video:not(.vertical)').waitFor();
    await photo('video-detail');
    await page.getByRole('button',{name:'SIP Calculator'}).click();
    await page.frameLocator('iframe').locator('#sip[open] .calc-body').waitFor();
    await page.getByRole('button',{name:'Back',exact:true}).click();
    await page.locator('iframe.learn-video').waitFor();
    await page.getByRole('button', {name:'Back',exact:true}).click();
    await page.getByRole('button', {name: 'Shorts', exact: true}).click();
    await photo('learn-shorts');
    await page.getByLabel('Language').selectOption('hi');
    await photo('learn-hindi');
    await page.getByLabel('Language').selectOption('all');
    await page.getByRole('searchbox', {name: 'Search Learn'}).fill('fixture');
    await photo('learn-search');
    await page.getByRole('searchbox', {name: 'Search Learn'}).fill('');
    await page.getByText('Fixture Short').click();
    await page.locator('iframe.vertical').waitFor();
    await photo('short-player');
    await page.getByRole('button',{name:'Next Short'}).click();
    await page.getByRole('button',{name:'Previous Short'}).click();
    assert.equal(await page.locator('iframe.learn-video').count(),1);
    await page.getByRole('button', {name: 'Save', exact: true}).click();
    await page.getByRole('button', {name: 'Back', exact: true}).click();
    await page.getByRole('button', {name: 'Saved content', exact: true}).click();
    await page.getByText('Fixture Short').waitFor();
    await photo('learn-saved');
    await page.getByRole('button',{name:'Back',exact:true}).click();
    await page.getByRole('button', {name: 'Blogs', exact: true}).click();
    await page.locator('.learn-open').first().waitFor();
    await page.waitForFunction(() => document.querySelector('.learn-tile img')?.naturalWidth > 0);
    await photo('learn');
    await page.locator('.learn-open').first().click();
    await page.frameLocator('iframe').locator('h1:visible').first().waitFor();
    await photo('blog-reader');
    await page.getByRole('button', {name: 'Back', exact: true}).click();
    catalogUnavailable=true;
    await page.getByRole('button',{name:'Refresh',exact:true}).click();
    await page.getByText('Showing saved catalog. Connect to refresh.',{exact:true}).waitFor();
    await photo('learn-stale');
    catalogUnavailable=false;
    await nav('Splits');
    await page.getByRole('button', {name: 'Create group'}).click();
    await page.getByLabel('Group name').fill('Weekend trip');
    await page.getByLabel('Other members').fill('Alex\nMorgan');
    await page.getByRole('button', {name: 'Save', exact: true}).click();
    await page.getByRole('button', {name: 'Add expense'}).click();
    await page.getByLabel('Description').fill('Train tickets');
    await page.getByLabel('Amount (₹)').fill('100.01');
    await photo('split-expense');
    await page.getByRole('button', {name: 'Save', exact: true}).click();
    await page.getByText('Owes ₹33.34').waitFor();
    await page.getByRole('button', {name: 'Record settlement'}).click();
    await page.getByLabel('Paid by').selectOption('1');
    await page.getByLabel('Received by').selectOption('0');
    await photo('split-settlement');
    await page.getByLabel('Amount (₹)').fill('33.34');
    await page.getByRole('button', {name: 'Save', exact: true}).click();
    await page.getByText('Alex paid You').waitFor();
    await photo('split-detail');
    await page.getByRole('button', {name: 'Edit', exact: true}).click();
    await page.getByLabel('Description').fill('Train tickets updated');
    await page.getByRole('button', {name: 'Save', exact: true}).click();
    await page.getByText(/Train tickets updated/).waitFor();
    await page.getByRole('button', {name: 'Undo', exact: true}).click();
    await page.getByText('Undo settlement?', {exact: true}).waitFor();
    await page.getByRole('button', {name: 'Confirm', exact: true}).click();
    assert.equal(await page.getByText('Alex paid You').count(), 0);
    await page.getByRole('button', {name: 'Back', exact: true}).click();
    await page.getByRole('searchbox', {name:'Search groups'}).fill('missing');
    await page.getByText('No groups match your search.').waitFor();
    await page.getByRole('searchbox', {name:'Search groups'}).fill('Alex');
    await page.getByRole('button', {name:/Weekend trip/}).waitFor();
    assert.equal(await page.locator('.split-overview').innerText(), ['You are owed','₹66.67','You owe','₹0.00'].join(String.fromCharCode(10)));
    await photo('splits');
    await nav('Calculators');
    await photo('calculators');
    for (const [name, id] of [
      ['Can I Retire Today?', 'retire-today'], ['Retirement Amount Required', 'retirement'],
      ['SIP Calculator', 'sip'], ['Loan EMI Calculator', 'emi'], ['Inflation Calculator', 'inflation']
    ]) {
      await page.getByRole('button', {name: new RegExp(name.replace('?', '\\?'))}).click();
      const frame = page.frameLocator('iframe');
      await frame.locator('#' + id + '[open] .calc-body').waitFor();
      assert.equal(await frame.locator('header').isVisible(), false);
      await photo('calculator-'+id);
      if (id === 'retire-today') {
        await frame.getByRole('button', {name: 'हिंदी'}).click();
        assert.equal(await frame.getByRole('button', {name: 'हिंदी'}).getAttribute('aria-pressed'), 'true');
      }
      await page.getByRole('button', {name: 'Back', exact: true}).click();
    }
    await page.getByRole('button', {name: 'Open account profile'}).click();
    await page.getByText('Accounts & sources', {exact: true}).waitFor();
    await photo('account');
    await page.getByRole('button', {name:/Accounts & sources/}).click();
    await photo('accounts');
    await page.locator('#ML .xmc').click();
    await page.getByRole('button', {name:/Weekly summary/}).click();
    await page.locator('.week-day:not(:disabled)').last().click();
    assert.equal(await page.locator('.week-day[aria-pressed="true"]').count(), 1);
    await photo('weekly');
    await page.getByRole('button', {name:'Previous week'}).click();
    await page.getByText('Last week lunch').waitFor();
    await page.getByRole('button', {name:'Next week'}).click();
    await page.getByRole('button', {name:'Back',exact:true}).click();
    await page.getByRole('button', {name:/^Preferences/}).click();
    await photo('preferences');
    const startup = page.getByRole('switch', {name:'Launch in Money Manager'});
    await startup.uncheck();
    assert.equal(await page.evaluate(() => getLaunchView()), 'learn');
    await startup.check();
    await page.getByRole('button', {name:/^Credit categories/}).click();
    await page.getByLabel('New category').fill('Freelance income');
    await page.getByRole('button', {name:'Add category'}).click();
    assert.ok(await page.evaluate(() => iCats().some(category => category.l === 'Freelance income')));
    await page.getByRole('button', {name:/^Notifications and reminders/}).click();
    await photo('notification-preferences');
    await page.getByRole('button', {name:'Back',exact:true}).click();
    await page.getByRole('button', {name:/^Security/}).click();
    await page.locator('#TT.hidden').waitFor({state:'attached'});
    await photo('security');
    await page.getByRole('switch', {name:'Hide income'}).check();
    await page.evaluate(() => sV('spends'));
    assert.equal(await page.getByText('₹45,000', {exact:true}).count(), 0);
    assert.ok(await page.getByText('Hidden', {exact:true}).count() > 0);
    assert.equal(await page.evaluate(async () => {
      localStorage.setItem('mf_pin', '2718');
      if (await checkDevicePin('1234') || !await checkDevicePin('2718')) return false;
      const migrated=JSON.parse(localStorage.getItem('mf_pin'));
      const valid=migrated.version === 1 && migrated.salt && migrated.hash &&
        !await checkDevicePin('1234') && await checkDevicePin('2718');
      setHideIncome(false);
      return Boolean(valid);
    }), true);
    await page.evaluate(() => {
      auth={currentUser:{uid:'fixture-account'}};
      backgroundSince=Date.now()-61000;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.locator('#pinPrompt').waitFor();
    assert.equal(await page.locator('#AS').isVisible(), false);
    for(const digit of ['2','7','1','8']){
      await page.locator('#pinPrompt').getByRole('button',{name:digit,exact:true}).click();
    }
    await page.locator('#pinPrompt').waitFor({state:'detached'});
    assert.equal(await page.locator('#AS').isVisible(), true);
    await page.evaluate(() => localStorage.removeItem('mf_pin'));
    await page.evaluate(() => {setTheme('dark');sV('spends')});
    await photo('spends-dark');
    for(const width of [320,360,375,390,412,430]){
      await page.setViewportSize({width,height:width<375?640:844});
      for (const theme of ['light','dark']) {
        for (const view of ['spends','reports','learn','splits','calculators','weekly','preferences','security']) {
          const layout=await page.evaluate(({theme,view})=>{
            setTheme(theme);
            ad.name='A long synthetic profile name with multiple words';
            D.transactions[0].amount=123456789.25;
            learnLanguage='hi';
            sV(view);
            return {viewport:innerWidth,root:document.documentElement.scrollWidth,content:$('CT').scrollWidth,client:$('CT').clientWidth,
              outside:[...$('CT').querySelectorAll('*')].filter(node=>node.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(node=>[node.className,node.textContent.slice(0,30)])};
          },{theme,view});
          assert.ok(layout.root<=layout.viewport&&layout.content<=layout.client+1,
            width+' '+theme+' '+view+' '+JSON.stringify(layout));
        }
      }
    }
    assert.deepEqual(errors, []);
    console.log('Mobile Chromium smoke test passed');
  } finally {
    await browser.close();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
