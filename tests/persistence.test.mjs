import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';

const paths=['sync','splits','data'];
const code=paths.map(name=>readFileSync(new URL('../app/js/'+name+'.js',import.meta.url),'utf8')).join('\n');
const clone=value=>value===undefined?undefined:structuredClone(value);
function firestore(){
  const remote=new Map(), versions=new Map();
  let fault=null;
  return {
    remote, fault(value){fault=value;},
    collection:()=>({doc:uid=>uid}),
    async runTransaction(callback){
      if(fault==='offline')throw Error('Network interruption');
      while(true){
        let key,version,patch;
        const result=await callback({
          async get(k){
            key=k;
            version=versions.get(k)||0;
            const data=clone(remote.get(k));
            return {exists:!!data,data:()=>data};
          },
          set(ref,value){assert.equal(ref,key);patch=clone(value);}
        });
        if((versions.get(key)||0)!==version)continue;
        if(fault==='beforeCommit'){fault=null;throw Error('Write rejected');}
        if(patch){remote.set(key,{...remote.get(key),...patch});versions.set(key,version+1);}
        if(fault==='lostAck'){fault=null;throw Error('Response interrupted');}
        return result;
      }
    }
  };
}
function client(db,user='owner',clock=0){
  const storage=new Map();
  const auth={currentUser:{uid:user}};
  const sandbox=vm.createContext({db,auth,fbOk:true,uid:user,ad:{name:'Test'},crypto:webcrypto,navigator:{onLine:true},
    addEventListener(){},document:{getElementById:()=>null},$:()=>({classList:{contains:()=>true}}),rC(){},console,
    persistCashlyProfile(){},toast(){},Date:class extends Date{static now(){return 1800000000000+clock;}},
    localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)}});
  sandbox.window=sandbox;
  vm.runInContext(code,sandbox);
  sandbox.DK='mf_data_v5_'+user;
  const evalIn=script=>vm.runInContext(script,sandbox);
  return {sandbox,storage,auth,evalIn,async change(data){
    sandbox.D=clone(data);evalIn('sv()');
    await (sandbox.cashlyWrites.get(user)?.task||Promise.resolve());
  },async sync(){await evalIn('cloudLoad()');}, get status(){return sandbox.syncStatus;}};
}
const row=(id,amount=17)=>({id,amount,date:'2026-11-25',type:'expense',category:'food'});
const data=(transactions=[],splits=[])=>({transactions,splits,accounts:[{id:'cash'}],recurring:[],budgets:{}});
async function pair(initial){
  const db=firestore(),a=client(db,'owner',-86400000),b=client(db,'owner',86400000);
  await a.change(initial);await b.sync();return {db,a,b};
}
test('isolated clients add and then edit different records under clock skew',async()=>{
  const {db,a,b}=await pair(data());
  await Promise.all([a.change(data([row('a')])),b.change(data([row('b')]))]);
  assert.deepEqual(db.remote.get('owner').data.transactions.map(t=>t.id).sort(),['a','b']);
  await Promise.all([a.sync(),b.sync()]);
  await Promise.all([a.change(data([row('a',11),row('b')])),b.change(data([row('a'),row('b',22)]))]);
  assert.deepEqual(Object.fromEntries(db.remote.get('owner').data.transactions.map(t=>[t.id,t.amount])),{a:11,b:22});
});
test('conflicting edits and delete-versus-edit preserve both active versions',async()=>{
  for(const local of [[row('a',20)],[]]){
    const {db,a,b}=await pair(data([row('a')]));
    await a.change(data([row('a',19)]));
    await b.change(data(local));
    assert.equal(b.status,'conflict');
    assert.equal(db.remote.get('owner').data.transactions[0].amount,19);
    assert.deepEqual(JSON.parse(b.storage.get('mf_data_v5_owner_v81')).data.transactions,local);
  }
});
test('a deletion, an offline addition and a committed operation with lost acknowledgment reconcile',async()=>{
  const {db,a,b}=await pair(data([row('delete')]));
  db.fault('offline');b.sandbox.navigator.onLine=false;
  await b.change(data([row('delete'),row('offline')]));
  assert.equal(b.status,'offline');
  db.fault(null);await a.change(data([]));
  b.sandbox.navigator.onLine=true;
  db.fault('beforeCommit');await b.sync();
  assert.equal(b.status,'failed');
  assert.deepEqual(db.remote.get('owner').data.transactions,[]);
  db.fault('lostAck');await b.sync();
  const accepted=db.remote.get('owner').cashlyRevision;
  await b.sync();await b.sync();
  assert.equal(b.status,'synced');
  assert.equal(db.remote.get('owner').cashlyRevision,accepted);
  assert.deepEqual(db.remote.get('owner').data.transactions.map(t=>t.id),['offline']);
});
test('independent settlement records merge and preserve zero-sum balances',async()=>{
  const group={id:'g',ledgerVersion:1,total:1.01,people:[{id:'p1',name:'You'},{id:'p2',name:'Alex'}],
    expenses:[{id:'e',payer:0,total:101,shares:[51,50],participants:[0,1]}],settlements:[]};
  const {db,a,b}=await pair(data([], [group]));
  await Promise.all([a.change(data([],[{...group,settlements:[{id:'s1',from:1,to:0,total:20}]}])),
    b.change(data([],[{...group,settlements:[{id:'s2',from:1,to:0,total:10}]}]))]);
  const saved=db.remote.get('owner').data.splits[0];
  assert.equal(saved.settlements.length,2);
  b.sandbox.fixture=saved;
  assert.deepEqual([...b.evalIn('splitBalances(fixture)')],[20,-20]);
});
test('account switch prevents the stale transaction from writing to either account',async()=>{
  const {db,a}=await pair(data([row('a')]));
  a.sandbox.D=data([row('a'),row('private')]);
  const task=a.evalIn('sv(); cashlyWrites.get("owner").task');
  a.auth.currentUser={uid:'different'};
  a.sandbox.uid='different';
  await task;
  assert.deepEqual(db.remote.get('owner').data.transactions.map(t=>t.id),['a']);
  assert.equal(db.remote.has('different'),false);
});
test('legacy local data and cloud data with different contents require review',async()=>{
  const {db}=await pair(data([row('remote')]));
  const b=client(db);
  b.storage.set('mf_data_v5_owner',JSON.stringify(data([row('legacy'),row('larger')])));
  await b.sync();
  assert.equal(b.status,'conflict');
  assert.deepEqual(db.remote.get('owner').data.transactions.map(t=>t.id),['remote']);
  assert.equal(b.storage.has('mf_data_v5_owner_v81'),false);
});
test('malformed imported transaction IDs and nonconserving split shares are rejected',()=>{
  const a=client(firestore());
  a.sandbox.fixture=data([row("x');unsafe")]);
  assert.throws(()=>a.evalIn('validateCashlyData(fixture)'),/record ID/);
  a.sandbox.fixture={ledgerVersion:1,people:[{name:'A'},{name:'B'}],settlements:[],expenses:[{total:100,payer:0,shares:[1,2]}]};
  assert.throws(()=>a.evalIn('validateSplitLedger(fixture)'),/split expense/i);
});
test('Indian SMS parser requires confirmed debit/credit and rejects alerts',()=>{
  const a=client(firestore());
  const parse=a.evalIn('parseIndianBankSMS');
  assert.equal(parse('Rs.499.50 debited from A/c XX1234 on 12-11-26 at SWIGGY. Avl Bal Rs.12,340.50').amount,499.50);
  assert.equal(parse('INR 45000 credited to account XX1234 on 12/11/26 from SALARY').type,'income');
  for(const text of ['OTP 777444 for Rs.200 paid','Rs.15,000 available balance','Rs.500 debited payment failed','Credit card bill Rs.1500 due date 10-12-26']){
    assert.equal(parse(text),null);
  }
});
