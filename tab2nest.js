const fs = require('fs');
const debug = require('debug')('app');

const data = fs.readFileSync('jsonTab.json', 'utf8');
const jstf = JSON.parse(data);
const jn = {};
let cnt = 0;
const itout = (jst) => {
  for (const prop in jst) {
    jn[prop] = jst[prop];
    cnt++;
    debug(cnt);
    if (typeof jst[prop] === 'object') {
      itout(jst[prop]);
    }
  }
};
itout(jstf);
jn;
