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

const n2t = (ob, path) => {
  const jst = {};
  Object.entries(ob).forEach(([key, value]) => {
    const newpath = (path !== undefined) ? `${path}.${key}` : key;

    if (typeof value === 'object') {
      Object.assign(jst, n2t(value, newpath));
    } else {
      const col = {};
      col[newpath.split(/\.(.+)/)[1]] = value;
      debug(newpath.split('.')[0], col);
      jst[newpath.split('.')[0]] = col;
      // Object.assign(jst, jst[newpath.split('.')[0]] = col);
    }
  });
  return jst;
};

debug(n2t(jsn));
// n2t(jsn);
