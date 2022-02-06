const fs = require('fs');
const debug = require('debug')('app');
const set = require('lodash/set');
const isEqual = require('lodash/isEqual');

const jsonToTab = (obj, path, tsv) => {
  let tsvBuild = (tsv === undefined) ? '' : tsv;
  Object.entries(obj).forEach(([key, value]) => {
    let newpath;

    // if (Array.isArray(obj)) {
    // newpath = (path === undefined) ? `[${key}]` : `${path}[${key}]`;
    // } else {
    // newpath = (path === undefined) ? key : `${path}.${key}`;
    // }

    if (path === undefined) {
      newpath = (Array.isArray(obj)) ? `[${key}]` : key;
    } else {
      newpath = (Array.isArray(obj)) ? `${path}[${key}]` : `${path}.${key}`;
    }

    if (typeof value === 'object') {
      tsvBuild = jsonToTab(value, newpath, tsvBuild);
    } else {
      // Update column headers if necessary
      const columnLabel = newpath.split(/\.(.+)/)[1];
      const indColumnLabel = tsvBuild.indexOf(columnLabel);
      const indEndHeader = tsvBuild.indexOf('\n');
      let numberCols;
      if (indColumnLabel === -1) {
        if (tsvBuild.length) {
          tsvBuild = `${tsvBuild.slice(0, tsvBuild.lastIndexOf('\n'))}\t${columnLabel}${tsvBuild.slice(indEndHeader)}`;
          numberCols = ((tsvBuild.slice(0, indColumnLabel).match(/\t/g) || []).length);
        } else {
          tsvBuild = `${columnLabel}\n`;
          numberCols = 0;
        }
      }
      // Append separators for empty columns and value
      // const lastNewline = tsvBuild.lastIndexOf('\n');

      // debug(lastNewline, columnLabel, value)
      for (let i = 0; i < numberCols; i += 1) {
        tsvBuild = `${tsvBuild}\t`;
      }
      tsvBuild = `${tsvBuild}${value}`;
    }
  });
  if ((path === undefined) || !path.includes('.')) {
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
