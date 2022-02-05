const fs = require('fs');
const debug = require('debug')('app');

const ppjson = (fileName) => fs.readFile(fileName, 'utf8', (err, data) => {
  if (err) {
    debug(err);
    return;
  }
  const jsn = JSON.parse(data);
  fs.writeFile(fileName, JSON.stringify(jsn, null, 2), (errw) => {
    if (errw) { debug(errw); }
  });
});

ppjson('jsonNest.json');
