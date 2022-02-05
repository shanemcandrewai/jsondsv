const fs = require('fs');
const debug = require('debug')('app');
const set = require('lodash/set');

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

const n2t = (ob, path, jst) => {
  // const jstt = (jst !== undefined) ? jst : {};
  let jstt = (jst !== undefined) ? jst : '';
  Object.entries(ob).forEach(([key, value]) => {
    let newpath;
    if (Array.isArray(ob)) {
      newpath = (path !== undefined) ? `${path}[${key}]` : `[${key}]`;
    } else {
      newpath = (path !== undefined) ? `${path}.${key}` : key;
    }
    if (typeof value === 'object') {
      // Object.assign(jstt, n2t(value, newpath, jstt));
      debug('xxx', newpath);
      jstt += n2t(value, newpath, jstt);
    } else {
      debug('yyy', newpath.split(/\.(.+)/)[1]);
      // const columns = {};
      // const rowkey = newpath.split('.')[0];
      // columns[newpath.split(/\.(.+)/)[1]] = value;
      // if (jstt[rowkey] === undefined) {
      // jstt[rowkey] = columns;
      // } else {
      // Object.assign(jstt[rowkey], columns);
      // }
    }
  });
  return jstt;
};

fs.readFile('jsonNest.json', 'utf8', (err, data) => {
  if (err) {
    debug(err);
    return;
  }
  const obj = JSON.parse(data);
  fs.writeFile('jsn.tsv', JSON.stringify(n2t(obj), null, 2), (errw) => {
    if (errw) { debug(errw); }
  });
});
