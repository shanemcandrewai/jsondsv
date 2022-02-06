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
          tsvBuild = `${header}\t${columnLabel}${tsvBuild.slice(indEndHeader)}`;
          tsvBuild = `${tsvBuild}\t${value}`;
        } else {
          // Add first column
          tsvBuild = `${columnLabel}\n`;
          tsvBuild = `${tsvBuild}${value}`;
        }
      } else if (tsvBuild.slice(-1) === '\n') {
        // Add first value in row
        tsvBuild = `${tsvBuild}${value}`;
      } else {
        // Add subsequent value in row
        // TODO : append tabs according to column position in header
        tsvBuild = `${tsvBuild}\t${value}`;
      }
    }
  });
  if (path !== undefined && !path.includes('.')) {
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
