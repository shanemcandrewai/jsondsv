const fs = require('fs');
const debug = require('debug')('app');
const set = require('lodash/set');
const isEqual = require('lodash/isEqual');

const calcSeparators = (columnLabel, tsvBuild) => {
  const indEndHeader = tsvBuild.indexOf('\n');
  const header = tsvBuild.slice(0, indEndHeader);
  const indColumnLabel = header.indexOf(columnLabel);
  const labelNumber = (header.slice(0, indColumnLabel).match(/\t/g) || []).length;
  const currentRow = tsvBuild.split(/\n(.+)$/)[1];
  const currColNumber = (currentRow.match(/\t/g) || []).length;
  const addSeparators = labelNumber - currColNumber;
  let separators = '';
  for (let i = 0; i < addSeparators; i += 1) {
    separators = `${separators}\t`;
  }
  return separators;
};

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
          const separators = calcSeparators(columnLabel, tsvBuild);
          tsvBuild = `${tsvBuild}${separators}${value}`;
        } else {
          // Add first column
          tsvBuild = `${columnLabel}\n`;
          tsvBuild = `${tsvBuild}${value}`;
        }
      } else if (tsvBuild.slice(-1) === '\n') {
        // Add first value in new row
        tsvBuild = `${tsvBuild}${value}`;
      } else {
        // Calculate column position and add subsequent value in row
        const separators = calcSeparators(columnLabel, tsvBuild);
        tsvBuild = `${tsvBuild}${separators}${value}`;
      }
    }
  });
  if (path !== undefined && !path.includes('.')) {
    // End of row
    tsvBuild = `${tsvBuild}\n`;
  }
  return tsvBuild;
};

const tabToJson = (tsv) => {
  const jsonObj = {};
  const rows = tsv.split('\n');
  let paths;
  rows.forEach((element, index) => {
    if (!index) {
      paths = element.split('\t');
    } else {
      const values = element.split('\t');
      values.forEach((element2, index2) => {
        const path = `[${index - 1}]${paths[index2]}`;
        set(jsonObj, path, element2);
      });
    }
  });
  debug(jsonObj);
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
    fs.readFile('nested.tsv', 'utf8', (errt, tsvFile) => {
      if (errt) {
        debug(errt);
        return;
      }
      fs.readFile('nested.json', 'utf8', (errj, jsonObj) => {
        if (errj) {
          debug(errj);
          return;
        }
        const tsv = tabToJson(tsvFile);
        debug('matched', isEqual(tsv, JSON.parse(jsonObj)));
      });
    });
}
