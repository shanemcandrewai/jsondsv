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
  let tsv = (jst === undefined) ? '' : jst;
  Object.entries(ob).forEach(([key, value]) => {
    let newpath;
    if (Array.isArray(ob)) {
      newpath = (path !== undefined) ? `${path}[${key}]` : `[${key}]`;
    } else {
      newpath = (path !== undefined) ? `${path}.${key}` : key;
    }
    if (typeof value === 'object') {
      tsv = n2t(value, newpath, tsv);
    } else {
      const columnLabel = newpath.split(/\.(.+)/)[1];
      if (!tsv.includes(columnLabel)) {
        if (tsv.slice(-1) !== ' ' && tsv.length) {
          tsv += '\t';
        }
        tsv += columnLabel;
      }
      // const columns = {};
      // const rowkey = newpath.split('.')[0];
      // columns[newpath.split(/\.(.+)/)[1]] = value;
      // if (tsv[rowkey] === undefined) {
      // tsv[rowkey] = columns;
      // } else {
      // Object.assign(tsv[rowkey], columns);
      // }
    }
  });
  return tsv;
};

fs.readFile('jsonNest.json', 'utf8', (err, data) => {
  if (err) {
    debug(err);
    return;
  }
  const obj = JSON.parse(data);
  fs.writeFile('jsn.tsv', n2t(obj), (errw) => {
    if (errw) { debug(errw); }
  });
});
