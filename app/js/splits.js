/* Versioned manual ledgers. Legacy one-off splits retain their original settlement records. */
function validateSplitLedger(group){
  var count=group.people?.length;
  if(!Number.isInteger(count)||count<2||!group.people.every(person=>typeof person?.name==="string")||
    !Array.isArray(group.expenses)||!Array.isArray(group.settlements))throw Error("Malformed split ledger");
  var member=index=>Number.isInteger(index)&&index>=0&&index<count;
  var paise=value=>Number.isSafeInteger(value)&&value>=0;
  for(var expense of group.expenses){
    if(!member(expense?.payer)||!paise(expense.total)||!expense.total||!Array.isArray(expense.shares)||
      expense.shares.length!==count||!expense.shares.every(paise)||expense.shares.reduce((a,b)=>a+b,0)!==expense.total||
      (expense.participants&&(!Array.isArray(expense.participants)||!expense.participants.every(member)||new Set(expense.participants).size!==expense.participants.length))){
      throw Error("Invalid split expense");
    }
  }
  for(var payment of group.settlements){
    if(!member(payment?.from)||!member(payment.to)||payment.from===payment.to||!paise(payment.total)||!payment.total)throw Error("Invalid settlement");
  }
  if(!paise(group.expenses.concat(group.settlements).reduce((sum,item)=>sum+item.total,0)))throw Error("Split balance out of range");
  return group;
}
function addSplitIdentifiers(group){
  if(group.ledgerVersion!==1)return group;
  return {...group,...Object.fromEntries(["people","expenses","settlements"].map(key=>[key,group[key].map((row,index)=>
    row.id?row:{...row,id:key+"_"+index})]))};
}

function splitUnits(value) {
  var match = /^(\d{1,10})(?:\.(\d{1,2}))?$/.exec(String(value).trim());
  return match ? Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0')) : null;
}
function splitShares(total, method, values) {
  if (!['equal','amount','percent'].includes(method)) throw Error('Invalid split method.');
  if (!Number.isSafeInteger(total) || total <= 0 || !values.length) throw Error('Enter a positive expense and select participants.');
  var numbers = method === 'equal' ? values.map(function () { return 1 }) : values.map(splitUnits);
  if (numbers.some(function (n) { return n === null })) throw Error('Enter each share with up to two decimal places.');
  var sum = numbers.reduce(function (a, b) { return a + b }, 0);
  if (method === 'amount' && sum === total) return numbers;
  if (method === 'amount' || (method === 'percent' && sum !== 10000)) {
    throw Error(method === 'amount' ? 'Shares must add up to the expense.' : 'Percentages must add up to 100%.');
  }
  var allocated = numbers.map(function (weight, index) {
    var product = BigInt(total) * BigInt(weight);
    return { index: index, share: Number(product / BigInt(sum)), remainder: Number(product % BigInt(sum)) };
  });
  var remaining = total - allocated.reduce(function (amount, entry) { return amount + entry.share }, 0);
  allocated.sort(function (a, b) { return b.remainder - a.remainder || a.index - b.index });
  for (var i = 0; i < remaining; i++) allocated[i].share++;
  return allocated.sort(function (a, b) { return a.index - b.index }).map(function (entry) { return entry.share });
}
function splitBalances(group) {
  var balances = group.people.map(function () { return 0 });
  group.expenses.forEach(function (expense) {
    balances[expense.payer] += expense.total;
    expense.shares.forEach(function (share, i) { balances[i] -= share });
  });
  group.settlements.forEach(function (payment) {
    balances[payment.from] += payment.total;
    balances[payment.to] -= payment.total;
  });
  return balances;
}
function splitMoney(amount) {
  return '₹' + (amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function splitTotal(group) {
  return group.expenses.reduce(function (sum, expense) { return sum + expense.total }, 0);
}
function currentSplit() {
  return D.splits.find(function (group) { return group.id === activeSplitId });
}
function openSplitAt(index) {
  var group = D.splits[index];
  if (group) openSplit(group.id);
}
function splitOverview(groups) {
  return groups.reduce(function (overview, group) {
    if (group.ledgerVersion !== 1) return overview;
    var net = splitBalances(group)[0];
    if (net > 0) overview.receivable += net;
    else overview.payable -= net;
    return overview;
  }, { receivable: 0, payable: 0 });
}
var splitQuery = '';
function searchSplitGroups(query) {
  splitQuery = query;
  document.getElementById('splitGroupList').innerHTML = splitGroupRows();
}
function splitGroupRows() {
  var query = splitQuery.trim().toLocaleLowerCase();
  var rows = D.splits.map(function (group, index) {
    var people = group.people || [];
    if (query && ![group.title].concat(people.map(function (member) { return member.name }))
      .some(function (value) { return String(value || '').toLocaleLowerCase().includes(query) })) return '';
    var ledger = group.ledgerVersion === 1;
    var net = ledger ? splitBalances(group)[0] : 0;
    var settled = ledger && splitBalances(group).every(balance => balance === 0);
    var status = ledger ? (settled ? 'Settled' : net === 0 ? 'Other members have balances' : net > 0 ? 'You are owed' : 'You owe') : 'Legacy split';
    var amount = ledger ? (net === 0 ? splitMoney(splitTotal(group)) : splitMoney(Math.abs(net))) : fF(group.total);
    var initials = people.slice(0, 4).map(function (member) {
      return '<span class="split-initial">'+esc(String(member.name || '?').charAt(0).toUpperCase())+'</span>';
    }).join('');
    return '<button class="split-group-card" onclick="openSplitAt('+index+')"><span class="split-group-icon">'+v7Icon('split')+
      '</span><span class="split-group-details"><strong>'+esc(group.title)+'</strong><span class="split-members" aria-label="'+
      people.length+' members">'+initials+(people.length>4?'<span class="split-initial">+'+(people.length-4)+'</span>':'')+
      '</span></span><span class="split-group-balance"><small>'+status+'</small><strong>'+amount+'</strong></span></button>';
  }).join('');
  return rows || '<p class="learn-empty">No groups match your search.</p>';
}
function rSpl() {
  var heading = '<div class="cashly-page-title"><h1>Splits</h1><button class="cashly-action" onclick="splitEditor(\'group\')">Create group</button></div>';
  if (!D.splits.length) return heading + '<div class="learn-empty">' + v7Icon('split') + '<h2>No groups yet</h2><p>Create a group to share expenses and record settlements.</p></div>';
  var overview = splitOverview(D.splits);
  return heading + '<div class="split-overview"><div><small>You are owed</small><strong>'+splitMoney(overview.receivable)+
    '</strong></div><div><small>You owe</small><strong>'+splitMoney(overview.payable)+'</strong></div></div>'+
    '<label class="learn-search">'+v7Icon('search')+'<input type="search" aria-label="Search groups" placeholder="Find a group or member"'+
    ' value="'+esc(splitQuery)+'" oninput="searchSplitGroups(this.value)"></label>'+
    '<div class="split-group-list" id="splitGroupList">'+splitGroupRows()+'</div>';
}
function rSplitDetail() {
  var group = currentSplit();
  if (!group || group.ledgerVersion !== 1) return rLegacySplitDetail();
  var balances = splitBalances(group);
  var heading = v7Back(group.title, 'splits');
  var members = group.people.map(function (member, index) {
    var balance = balances[index];
    return '<div class="cashly-row"><span class="cashly-avatar">' + esc(member.name.charAt(0).toUpperCase()) + '</span>' +
      '<strong class="cashly-row-main">' + esc(member.name) + '</strong><span>' +
      (balance ? (balance > 0 ? 'Receives ' : 'Owes ') + splitMoney(Math.abs(balance)) : 'Settled') + '</span></div>';
  }).join('');
  var expenses = group.expenses.map(function (expense, index) {
    return '<div class="cashly-row"><div class="cashly-row-main"><strong>' + esc(expense.title) + ' · ' + splitMoney(expense.total) +
      '</strong><small>Paid by ' + esc(group.people[expense.payer].name) + '</small><small>' + expense.shares.map(function (share, i) {
        return share ? esc(group.people[i].name) + ' ' + splitMoney(share) : '';
      }).filter(Boolean).join(' · ') + '</small></div><button class="cashly-action" onclick="splitEditor(\'expense\',' + index + ')">Edit</button></div>';
  }).join('');
  var payments = group.settlements.map(function (payment, index) {
    return '<div class="cashly-row"><span class="cashly-row-main"><strong>' + esc(group.people[payment.from].name) + ' paid ' +
      esc(group.people[payment.to].name) + '</strong><small>' + esc(payment.date) + '</small></span><strong>' +
      splitMoney(payment.total) + '</strong><button class="cashly-action" onclick="splitRemove(\'settlements\',' + index +
      ')">Undo</button></div>';
  }).join('');
  return heading + '<div class="cashly-summary"><span class="cashly-caption">Group expenses</span><div class="cashly-large">' +
    splitMoney(splitTotal(group)) + '</div></div><h2 class="cashly-section">Balances</h2>' + members +
    '<div class="ledger-heading"><h2>Expenses</h2><button class="cashly-action" onclick="splitEditor(\'expense\')">Add expense</button></div>' +
    (expenses || '<p class="learn-status">No expenses recorded.</p>') +
    '<div class="ledger-heading"><h2>Settlements</h2><button class="cashly-action" onclick="splitEditor(\'payment\')">Record settlement</button></div>' +
    (payments || '<p class="learn-status">No settlements recorded.</p>');
}
function splitEditor(kind, index) {
  var group = currentSplit();
  var expense = kind === 'expense' && group.expenses[index];
  var options = group && group.people.map(function (person, i) {
    return '<option value="' + i + '"' + (expense && expense.payer === i ? ' selected' : '') + '>' + esc(person.name) + '</option>';
  }).join('');
  var amount = '<label>Amount (₹)<input name="total" inputmode="decimal" required value="' + (expense ? (expense.total / 100).toFixed(2) : '') + '"></label>';
  var date='<label>Date<input name="date" type="date" required max="'+tdy()+'" value="'+esc(expense?.date||tdy())+'"></label>';
  var method=expense?.method||(expense?'amount':'equal');
  var fields;
  if (kind === 'group') {
    fields = '<label>Group name<input name="title" maxlength="80" required></label><label>Other members, one name per line<textarea name="members" rows="4" maxlength="840" required></textarea></label>';
  } else if (kind === 'payment') {
    fields = '<p>Record a payment already made. An overpayment reverses the balance between the selected members.</p><label>Paid by<select name="from">' + options + '</select></label><label>Received by<select name="to">' + options + '</select></label>' + amount + date;
  } else {
    fields = '<label>Description<input name="title" maxlength="100" required value="' + (expense ? esc(expense.title) : '') + '"></label>' + amount + date +
      '<label>Paid by<select name="payer">' + options + '</select></label><label>Split method<select name="method" onchange="splitShareFields(this.form)">' +
      [['equal','Equal'],['amount','Custom amount'],['percent','Percentage']].map(option=>'<option value="'+option[0]+'"'+(method===option[0]?' selected':'')+'>'+option[1]+'</option>').join('')+'</select></label>' +
      '<fieldset><legend>Participants</legend>' + group.people.map(function (person, i) {
        var active = expense ? (expense.participants ? expense.participants.includes(i) : expense.shares[i] > 0) : true;
        return '<div class="ledger-participant"><label><input type="checkbox" name="participant" value="' + i + '"' +
          (active ? ' checked' : '') + ' onchange="splitShareFields(this.form)">' + esc(person.name) + '</label><input aria-label="Share for ' +
          esc(person.name) + '" name="share' + i + '" inputmode="decimal" value="' + esc(expense?.input?.[i] ?? (expense ? (expense.shares[i] / 100).toFixed(2) : '')) + '"></div>';
      }).join('') + '</fieldset>';
  }
  var title = kind === 'group' ? 'Create group' : kind === 'payment' ? 'Record settlement' : expense ? 'Edit expense' : 'Add expense';
  var dialog = document.createElement('dialog');
  dialog.className = 'ledger-dialog';
  dialog.innerHTML = '<form><div class="ledger-heading"><h2>' + title + '</h2><button type="button" class="cashly-action" onclick="this.closest(\'dialog\').close()">Close</button></div>' +
    fields + '<p class="ledger-error" role="alert"></p><button class="sub" type="submit">Save</button>' +
    (expense ? '<button class="cashly-action" type="button" onclick="this.closest(\'dialog\').close();splitRemove(\'expenses\',' + index + ')">Delete expense</button>' : '') + '</form>';
  document.body.append(dialog);
  var form = dialog.querySelector('form');
  if (kind === 'expense') splitShareFields(form);
  dialog.addEventListener('close', function () { dialog.remove() }, { once: true });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    try {
      saveSplitEntry(kind, index, new FormData(form), group);
      dialog.close();
    } catch (error) { form.querySelector('.ledger-error').textContent = error.message }
  });
  dialog.showModal();
}
function splitShareFields(form) {
  form.querySelectorAll('input[name="participant"]').forEach(function (input) {
    var share = form.elements['share' + input.value];
    share.hidden = share.disabled = !input.checked || form.elements.method.value === 'equal';
  });
}
function saveSplitEntry(kind, index, form, group) {
  var title = (form.get('title') || '').trim();
  if (kind === 'group') {
    var names = form.get('members').split('\n').map(function (name) { return name.trim() }).filter(Boolean);
    if (!title || !names.length || names.length > 30) throw Error('Enter a group name and 1–30 other members.');
    names.unshift('You');
    if (new Set(names.map(function (name) { return name.toLowerCase() })).size !== names.length) throw Error('Use a unique name for each member.');
    var created = { id: crypto.randomUUID(), title: title, ledgerVersion: 1, total: 0,
      people: names.map(function (name) { return { id:crypto.randomUUID(), name: name } }), expenses: [], settlements: [] };
    D.splits.push(created);
    sv();
    openSplit(created.id);
    return;
  }
  if (group !== currentSplit()) throw Error('This group is no longer open.');
  var total = splitUnits(form.get('total'));
  if (!total) throw Error('Enter a positive amount with up to two decimal places.');
  var date=form.get('date');
  if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>tdy())throw Error('Choose a valid date through today.');
  if(group.expenses.concat(group.settlements).reduce((sum,entry)=>sum+entry.total,0)+total>Number.MAX_SAFE_INTEGER)throw Error('Group balance out of range.');
  if (kind === 'expense') {
    if (!title) throw Error('Enter a description.');
    var participants=form.getAll('participant').map(Number),payer=Number(form.get('payer'));
    if(!Number.isInteger(payer)||!group.people[payer]||participants.some(i=>!Number.isInteger(i)||!group.people[i])||
      new Set(participants).size!==participants.length)throw Error('Choose valid members and participants.');
    var shares=group.people.map(()=>0),method=form.get('method');
    var input=Object.fromEntries(participants.map(i=>[i,String(form.get('share'+i)||'')]));
    splitShares(total,method,participants.map(i=>input[i])).forEach((share,i)=>{shares[participants[i]]=share});
    var entry={id:group.expenses[index]?.id||crypto.randomUUID(),title,total,payer,shares,participants,method,input,date};
    if(index===undefined)group.expenses.push(entry);
    else group.expenses[index]=entry;
    group.total=splitTotal(group)/100;
  }else{
    var from=Number(form.get('from')),to=Number(form.get('to'));
    if(!Number.isInteger(from)||!Number.isInteger(to)||!group.people[from]||!group.people[to]||from===to)throw Error('Choose two different people.');
    group.settlements.push({id:crypto.randomUUID(),from,to,total,date});
  }
  sv();
  rC();
}
function splitRemove(type, index) {
  var group = currentSplit();
  if (!group || !group[type][index]) return;
  showConfirm(type === 'expenses' ? 'Delete expense?' : 'Undo settlement?', 'This updates the group balances.', function () {
    group[type].splice(index, 1);
    group.total = splitTotal(group) / 100;
    sv();
    rC();
  });
}
