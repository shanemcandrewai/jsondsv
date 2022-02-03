const fs = require('fs');
const debug = require('debug')('app');

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
  fs.writeFile('jst.json', JSON.stringify(jstt), (errw) => {
    if (errw) { debug(errw); }
  });
};

const t2n = (ob) => {
  const jsn = {};
  Object.entries(ob).forEach(([rowkey, columns]) => {
    Object.entries(columns).forEach(([path, value]) => {
      const keys = path.split('.');
      const pp = {};
      while (keys.length > 0) {
        const kk = keys.pop();
        if (Object.keys(pp).length === 0) {
          pp[kk] = value;
        } else {
          pp[kk] = pp;
        }
      }
      jsn[rowkey] = pp;
    });
  });

  fs.writeFile('jsn.json', JSON.stringify(jsn), (errw) => {
    if (errw) { debug(errw); }
  });
};

fs.readFile('jsonNest.json', 'utf8', (err, data) => {
  if (err) {
    debug(err);
    return;
  }

  n2t(JSON.parse(data));
});

fs.readFile('jst.json', 'utf8', (err, data) => {
  if (err) {
    debug(err);
    return;
  }

  t2n(JSON.parse(data));
});
