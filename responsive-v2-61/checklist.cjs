const fs = require('node:fs');
const path = require('node:path');
const dir = path.join(__dirname, 'verification');
const read = name => JSON.parse(fs.readFileSync(path.join(dir, name + '.json')));
const layout = read('layout-acceptance'), functions = read('functions'), reservation = read('reservation');
const groups = {'T-M':6, 'T-B':10, 'T-BS':7, 'T-S':1, 'T-C':5, 'T-SD':1, 'M-B':10, 'M-BS':3, 'M-R':2, 'M-C':4, 'M-S':6, 'M-SD':6};
const rows = [];
for (const [prefix, count] of Object.entries(groups)) {
  for (let i = 1; i <= count; i++) {
    const id = prefix + i;
    let evidence = layout.filter(r => r.id === id), file = 'layout-acceptance.json';
    if (['T-B4', 'M-B3'].includes(id)) {
      evidence = functions.filter(r => r.name.startsWith('Mood ') && r.name.endsWith(id === 'T-B4' ? '1024' : '390'));
      file = 'functions.json';
    } else if (['T-C1', 'M-C1'].includes(id)) {
      evidence = functions.filter(r => r.name.startsWith('Showcase reaches last photo ') && r.name.endsWith(id === 'T-C1' ? '1024' : '390'));
      file = 'functions.json';
    } else if (id === 'M-R2') {
      evidence = reservation.filter(r => r.name.startsWith('Occasion '));
      file = 'reservation.json';
    }
    rows.push({id, pass:evidence.length > 0 && evidence.every(r => r.pass), evidenceFile:file, measurements:evidence.length,
      ...(['T-C4','T-C5'].includes(id) ? {mapping:'Shop Tablet: specified selectors do not exist in either Collection.'} : {})});
  }
}
const output = {startingHead:require('./qa.cjs').HEAD, scope:'Local Chrome, with visual review recorded in REPORT.md; not physical Safari approval.',
  tablet:{pass:rows.filter(r=>r.id.startsWith('T-')&&r.pass).length,total:30},
  mobile:{pass:rows.filter(r=>r.id.startsWith('M-')&&r.pass).length,total:31}, requirements:rows};
fs.writeFileSync(path.join(dir,'61-checklist.json'),JSON.stringify(output,null,2));
console.log(output.tablet,output.mobile); if(rows.some(r=>!r.pass)) process.exitCode=1;
