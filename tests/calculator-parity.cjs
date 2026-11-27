const { chromium } = require('playwright');
const assert = require('node:assert/strict');

async function results(browser, origin) {
  const page = await browser.newPage({viewport: {width: 390, height: 844}, isMobile:true});
  try {
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.goto(origin + '/calculators.html#retire-today');
    const scenarios = await page.evaluate(() => {
      const val = id => document.getElementById(id).textContent;
      const capture = () => ['retValue','sipValue','emiValue','infValue'].map(val);
      const defaults = capture();
      const inputs = {retInflation:7,retReturn:7,retExpense:42500,sipAmt:7350,sipRate:0,emiRate:0,infRate:8.5};
      for (const [id,value] of Object.entries(inputs)) document.getElementById(id).value = value;
      calcRetirement(); calcSip(); calcEmi(); calcInflation();
      const altered=capture();
      const expanded={emiPrincipal:7654321.25,emiYears:30,sipAmt:7500.55,sipRate:8.25,infRate:0,retInflation:0};
      for(const [id,value] of Object.entries(expanded))document.getElementById(id).value=value;
      calcRetirement();calcSip();calcEmi();calcInflation();
      return {defaults,altered,expanded:capture()};
    });
    await page.locator('#field-age').fill('46');
    for (let i=0; i<12 && !await page.locator('#wizardResults').isVisible(); i++) await page.locator('#wizardNext').click();
    await page.locator('#wizardResults').waitFor();
    scenarios.retirement = await page.locator('#wizardResults').innerText();
    return scenarios;
  } finally {await page.close()}
}
(async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM || '/usr/bin/chromium',args:['--no-sandbox']});
  try {
    const before = await results(browser,process.env.CASHLY_V6_URL || 'http://127.0.0.1:8766');
    const after = await results(browser,process.env.CASHLY_TEST_URL || 'http://127.0.0.1:8765');
    assert.deepEqual(after,before);
    console.log('All five V6 calculator comparisons passed');
  } finally {await browser.close()}
})().catch(error => {console.error(error);process.exitCode=1});
