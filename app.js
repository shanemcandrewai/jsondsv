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
  fs.writeFile('jst.json', JSON.stringify(jstt), (err) => {
    if (err) { debug(err); }
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

const tsv = (jst) => {
  const colLables = new Set();
  const columns = [];
  let tsz = 'row\t';
  Object.values(jst).forEach((row) => {
    Object.keys(row).forEach((path) => {
      colLables.add(path);
    });
  });
  Object.values([...colLables]).forEach((label) => {
    columns.push(label);
    tsz += `${label}\t`;
  });
  tsz = tsz.replace(/.$/, '\n');
  Object.entries(jst).forEach(([row, cols]) => {
    tsz += `${row}\t`;
    Object.entries(cols).forEach(([path, value]) => {
      columns.forEach((element) => {
        if (element === path) tsz += `${value}\t`;
      });
      tsz += '\t';
    });
    tsz += '\n';
  });

  fs.writeFile('jst.tsv', tsz, (err) => {
    if (err) { debug(err); }
  });
};

fs.readFile('jsonNest.json', 'utf8', (err, data) => {
  if (err) {
    debug(err);
    return;
  }

  const jst = n2t(JSON.parse(data));
  tsv(jst);
});

fs.readFile('jst.json', 'utf8', (err, data) => {
  if (err) {
    debug(err);
    return;
  }

  t2n(JSON.parse(data));
});
