const fs = require('fs');
const debug = require('debug')('app');
const set = require('lodash/set');
const isEqual = require('lodash/isEqual');

const jsonToTab = (obj, path, tsv) => {
  let tsvBuild = (tsv === undefined) ? '' : tsv;
  Object.entries(obj).forEach(([key, value]) => {
    let newpath;

    if (Array.isArray(obj)) {
      newpath = (path === undefined) ? `[${key}]` : `${path}[${key}]`;
    } else {
      newpath = (path === undefined) ? key : `${path}.${key}`;
    }

    if (typeof value === 'object') {
      tsvBuild = jsonToTab(value, newpath, tsvBuild);
    } else {
      const columnLabel = newpath.split(/\.(.+)/)[1];
      const indEndHeader = tsvBuild.indexOf('\n');
      const header = tsvBuild.slice(0, indEndHeader);
      const indColumnLabel = header.indexOf(columnLabel);
      if (indColumnLabel === -1) {
        if (tsvBuild.length) {
          // Add new column
          debug('yyy', columnLabel, value);
          tsvBuild = `${header}\t${columnLabel}${tsvBuild.slice(indEndHeader)}`;
          tsvBuild = `${tsvBuild}\t${value}`;
        } else {
          debug('xxx', columnLabel, value);
          // Add first column
          tsvBuild = `${columnLabel}\n`;
          tsvBuild = `${tsvBuild}${value}`;
        }
      } else if (tsvBuild.slice(-1) === '\n') {
        // Add first value in new row
        debug('fvn', columnLabel, value);
        tsvBuild = `${tsvBuild}${value}`;
      } else {
        // Calculate column position and add subsequent value in row
        debug('icl', indColumnLabel);
        const labelNumber = (header.slice(0, indColumnLabel).match(/\t/g) || []).length;
        debug('hds', header.slice(0, indColumnLabel));
        debug('tsv', tsvBuild);
        const currentRow = tsvBuild.split(/\n(.+)$/)[1];
        debug('hea', header);
        debug('cro', currentRow);
        const currColNumber = (currentRow.match(/\t/g) || []).length;
        debug('sub', labelNumber, columnLabel, currColNumber, value);
        for (let i = 0; i < (labelNumber - currColNumber); i += 1) {
          tsvBuild = `${tsvBuild}\t`;
        }
        tsvBuild = `${tsvBuild}${value}`;
      }
    }
  });
  if (path !== undefined && !path.includes('.')) {
    // End of row
    debug('eow', path);
    tsvBuild = `${tsvBuild}\n`;
  }
  return tsvBuild;
};

const tabToJson = (tsvBuild) => {
  const jsonObj = {};
  Object.entries(tsvBuild).forEach(([rowkey, columns]) => {
    Object.entries(columns).forEach(([path, value]) => {
      set(jsonObj, `${rowkey}.${path}`, value);
    });
  });
  return jsonObj;
};

switch (process.argv[2].slice(-5)) {
  case '.json':
    fs.readFile(process.argv[2], 'utf8', (err, data) => {
      if (err) {
        debug(err);
        return;
      }
      const obj = JSON.parse(data);
      const fileOut = `${process.argv[2].split(/\.(.+)/)[0]}.tsv`;
      fs.writeFile(fileOut, jsonToTab(obj), (errw) => {
        if (errw) { debug(errw); }
      });
    });
    break;

  default:
    fs.readFile('nested.tsv', 'utf8', (errt, tsvBuild) => {
      if (errt) {
        debug(errt);
        return;
      }
      fs.readFile('nested.json', 'utf8', (errj, jsonObj) => {
        if (errj) {
          debug(errj);
          return;
        }
        debug('matched', isEqual(tabToJson(tsvBuild), JSON.parse(jsonObj)));
      });
    });
}
