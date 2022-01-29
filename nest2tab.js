// npx eslint nest2tab.js --fix
// DEBUG=app node nest2tab.js

const debug = require('debug')('app');

// const fs = require('fs');
// const data = fs.readFileSync('jsonNest.json', 'utf8');
// const jstf = JSON.parse(data);

const jsn = {
  'row-0': {
    'rec-0': {
      date: 20220121,
      tags: ['val-0'],
    },
    'rec-1': {
      date: 20220116,
      url: 'https://example.com/a',
      tags: ['val-0', 'val-1'],
    },
  },
  'row-1': {
    'rec-0': {
      date: 20220116,
      url: 'https://example.com/b',
    },
  },
};

const jst = {};
const n2t = (jso, key1, path) => {
  Object.entries(jso).forEach(([key, value]) => {
    if (key1 !== undefined) {
      path = key;
    } else {
      path += '.';
      path += key;
    }

    if (typeof jso[key] === 'object') {
      if (key1 !== undefined) {
        n2t(value, key1, path);
      } else {
        n2t(value, key, path);
      }
    } else {
      jst[path] = jso[key];
    }
  });
};
debug(jsn);
// n2t({ jstf: { a: 1 } });
n2t(jsn, '');
debug(jst);
