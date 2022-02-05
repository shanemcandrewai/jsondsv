const fs = require('fs');
const debug = require('debug')('app');
const set = require('lodash/set');

const n2t = (ob, path, jst) => {
  const jstt = (jst !== undefined) ? jst : {};
  Object.entries(ob).forEach(([key, value]) => {
    let newpath;
    if (Array.isArray(ob)) {
      newpath = (path !== undefined) ? `${path}[${key}]` : `[${key}]`;
    } else {
      newpath = (path !== undefined) ? `${path}.${key}` : key;
    }
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

const t2n = (ob) => {
  const jsn = {};
  Object.entries(ob).forEach(([rowkey, columns]) => {
    Object.entries(columns).forEach(([path, value]) => {
      set(jsn, `${rowkey}.${path}`, value);
    });
  });

  fs.writeFile('jsn.json', JSON.stringify(jsn), (err) => {
    if (err) { debug(err); }
  });
};

fs.readFile('jsonNest.json', 'utf8', (err, data) => {
  if (err) {
    debug(err);
    return;
  }
  fs.writeFile('jsn.tsv', n2t(JSON.parse(data)), (errw) => {
    if (errw) { debug(errw); }
  });
});
