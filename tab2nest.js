// npx eslint tab2nest.js --fix
// DEBUG=app node tab2nest.js

const debug = require('debug')('app');
// const fs = require('fs');
// const data = fs.readFileSync('jsonTab.json', 'utf8');
// const jstf = JSON.parse(data);

const jstf = {
  'row-0': {
    "['rec-0']['date']": 20220121,
    "['rec-0']['tags'][0]": 'val-0',
    "['rec-1']['date']": 20220116,
    "['rec-1']['url']": 'https://example.com/a',
    "['rec-1']['tags'][0]": 'val-0',
    "['rec-1']['tags'][1]": 'val-1',
  },
  'row-1': {
    "['rec-0']['date']": 20220116,
    "['rec-0']['url'']": 'https://example.com/b',
  },
};

const jn = {};
let cnt = 0;
const itout = (jst) => {
  Object.entries(jst).forEach(([key, value]) => {
    jn[key] = value;
    cnt += 1;
    debug(cnt);
    if (typeof jst[key] === 'object') {
      itout(value);
    }
  });
};
debug(jstf);
// itout({ jstf: { a: 1 } });
itout(jstf);
debug(jn);
