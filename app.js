const fs = require('fs');
const debug = require('debug')('app');

fs.readFile('jsonNest.json', 'utf8', (err, data) => {
  if (err) {
    debug(err);
    return;
  }

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

  debug(n2t(JSON.parse(data)));
});
