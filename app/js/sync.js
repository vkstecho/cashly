/* Deterministic three-way merge using an acknowledged server snapshot. */
(function (root) {
  "use strict";
  function equal(a,b){
    if(a===b)return true;
    if(!a||!b||typeof a!=="object"||typeof b!=="object"||Array.isArray(a)!==Array.isArray(b))return false;
    var keys=Object.keys(a);
    return keys.length===Object.keys(b).length&&keys.every(function(k){return Object.hasOwn(b,k)&&equal(a[k],b[k])});
  }
  var entityArrays=new Set(["transactions","splits","recurring","accounts","expenses","settlements"]);
  function indexed(value){
    if(!Array.isArray(value))return null;
    var indexed=new Map();
    for(var row of value){
      if(typeof row?.id!=="string"||!row.id||indexed.has(row.id))return null;
      indexed.set(row.id,row);
    }
    return indexed;
  }
  function reconcile(base,local,remote){
    var conflicts=[];
    function mapValues(b,l,r,path,merge){
      var keys=new Set([...r.keys(),...l.keys(),...b.keys()]);
      var values=new Map();
      for(var key of keys){
        var value=merge(b.get(key),l.get(key),r.get(key),path.concat(key));
        if(value!==undefined)values.set(key,value);
      }
      return values;
    }
    function merge(b,l,r,path){
      if(equal(l,r))return l;
      if(equal(b,l))return r;
      if(equal(b,r))return l;
      var field=path[path.length-1];
      if(entityArrays.has(field)){
        var oldOrdinal=field==="expenses"||field==="settlements";
        var keyed=value=>oldOrdinal&&Array.isArray(value)?value.map((row,index)=>row?.id?row:{...row,id:field+"_"+index}):value;
        var bi=indexed(keyed(b)),li=indexed(keyed(l)),ri=indexed(keyed(r));
        if(bi&&li&&ri)return Array.from(mapValues(bi,li,ri,path,merge).values());
      }
      var split=path.length===2&&path[0]==="splits"&&b?.ledgerVersion===1&&l?.ledgerVersion===1&&r?.ledgerVersion===1;
      if((path.length===0||field==="budgets"||split)&&[b,l,r].every(value=>value&&typeof value==="object"&&!Array.isArray(value))){
        var asMap=value=>new Map(Object.entries(value).filter(pair=>!split||pair[0]!=="total"));
        var result=Object.fromEntries(mapValues(asMap(b),asMap(l),asMap(r),path,merge));
        if(split)result.total=result.expenses.reduce((amount,entry)=>amount+entry.total,0)/100;
        return result;
      }
      conflicts.push(path.join(".")||"data");
      return l;
    }
    return {data:merge(base,local,remote,[]),conflicts:conflicts};
  }
  function decide(record,remote){
    if(!remote)return record.base?{conflicts:["Previously acknowledged cloud data is missing"]}:{data:record.data,profile:record.profile};
    if(!record.base){
      if(!record.hasLocal)return {data:remote.data,profile:remote.profile};
      if(!equal(record.data,remote.data))return {conflicts:["Legacy local and cloud versions differ"]};
      return {data:remote.data,profile:remote.profile||record.profile};
    }
    // A legacy writer cannot advance the V8.1 revision.
    if(remote.revision<record.base.revision||
      (remote.revision===record.base.revision&&!equal(remote.data,record.base.data))){
      return {conflicts:["A cloud write bypassed the revision protocol"]};
    }
    var data=reconcile(record.base.data,record.data,remote.data);
    var baseName=record.base.profile,localName=record.profile,remoteName=remote.profile;
    var profile=equal(baseName,localName)?remoteName:localName;
    if(!equal(baseName,localName)&&!equal(baseName,remoteName)&&!equal(localName,remoteName))data.conflicts.push("profile");
    return {...data,profile:profile};
  }
  async function runRevisionTransaction(run,readRevision,work){
    for(var attempt=0;;attempt++){
      var observed=null;
      try{
        return await run(tx=>work(tx,revision=>{observed=revision}));
      }catch(error){
        // Some rules engines evaluate the revision before returning a transaction precondition error.
        if(attempt>=2||error.code!=="permission-denied"||observed===null||await readRevision()<=observed)throw error;
      }
    }
  }
  root.cashlySyncModel={equal,reconcile,decide,runRevisionTransaction};
})(typeof window==="undefined"?globalThis:window);
