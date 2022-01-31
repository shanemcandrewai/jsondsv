// npx eslint nest2tab.js --fix
// DEBUG=app node nest2tab.js

const debug = require('debug')('app');

// const fs = require('fs');
// const data = fs.readFileSync('jsonNest.json', 'utf8');
// const jstf = JSON.parse(data);

const jsn = {
  'rowkey-0': {
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
  'rowkey-1': {
    'rec-0': {
      date: 20220116,
      url: 'https://example.com/b',
    },
  },
};

const n2t = (ob, path, jst) => {
  const jstt = (jst !== undefined) ? jst : {};
  Object.entries(ob).forEach(([key, value]) => {
    const newpath = (path !== undefined) ? `${path}.${key}` : key;

    if (typeof value === 'object') {
      Object.assign(jstt, n2t(value, newpath, jstt));
    } else {
      const columns = {};
      const rowkey = newpath.split('.')[0];
      columns[newpath.split(/\.(.+)/)[1]] = value;
      if (jstt[rowkey] === undefined) {
        jstt[rowkey] = columns;
      } else {
        Object.assign(jstt[rowkey], columns);
      }
    }
  });
  return jstt;
};

debug(n2t(jsn));
