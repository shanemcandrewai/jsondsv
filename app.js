const fs = require('fs');
const debug = require('debug')('app');
const set = require('lodash/set');
const isEqual = require('lodash/isEqual');

const testJSON = [
  {
    row: 0,
    'rec-0': {
      date: 20220121,
      tags: [
        'val-0',
      ],
    },
    'rec-1': {
      date: 20220116,
      url: 'https://example.com/a',
    },
  },
  {
    row: 1,
    'rec-0': {
      date: 20220116,
      url: 'https://example.com/b',
    },
    'rec-1': {
      tags: [
        'val-0',
        'val-1',
      ],
    },
  },
];

const testTSV = 'row\trec-0.date\trec-0.tags[0]\trec-1.date\trec-1.url\trec-0.url\trec-1.tags[0]\trec-1.tags[1]\n'
+ '0\t20220121\tval-0\t20220116\thttps://example.com/a\n'
+ '1\t20220116\t\t\t\thttps://example.com/b\tval-0\tval-1\n';

const calcSeparators = (columnLabel, tsvBuild, colSep, lineSep) => {
  const colSepChar = (colSep === undefined) ? '\t' : colSep;
  const lineSepChar = (lineSep === undefined) ? '\n' : lineSep;
  const colSepRegex = new RegExp(colSepChar, 'g');
  const lineSepRegex = new RegExp(`${lineSepChar}(.+)$`, 'g');
  const indEndHeader = tsvBuild.indexOf(lineSepChar);
  const header = tsvBuild.slice(0, indEndHeader);
  const indColumnLabel = header.indexOf(columnLabel);
  const labelNumber = (header.slice(0, indColumnLabel).match(colSepRegex) || []).length;
  const currentRow = tsvBuild.split(lineSepRegex)[1];
  const currColNumber = (currentRow.match(colSepRegex) || []).length;
  const addSeparators = labelNumber - currColNumber;

  let separators = '';
  for (let i = 0; i < addSeparators; i += 1) {
    separators = `${separators}${colSepChar}`;
  }
  return separators;
};

const JSONToTable = (obj, path, tsv, colSep, lineSep) => {
  let tsvBuild = (tsv === undefined) ? '' : tsv;
  const colSepChar = (colSep === undefined) ? '\t' : colSep;
  const lineSepChar = (lineSep === undefined) ? '\n' : lineSep;
  Object.entries(obj).forEach(([key, value]) => {
    let newpath;
    if (Array.isArray(obj)) {
      newpath = (path === undefined) ? `[${key}]` : `${path}[${key}]`;
    } else {
      newpath = (path === undefined) ? key : `${path}.${key}`;
    }

    if (typeof value === 'object') {
      tsvBuild = JSONToTable(value, newpath, tsvBuild);
    } else {
      const columnLabel = newpath.split(/\.(.+)/)[1];
      const indEndHeader = tsvBuild.indexOf(lineSepChar);
      const header = tsvBuild.slice(0, indEndHeader);
      const indColumnLabel = header.indexOf(columnLabel);

      if (indColumnLabel === -1) {
        if (tsvBuild.length) {
          // Add new column
          tsvBuild = `${header}${colSepChar}${columnLabel}${tsvBuild.slice(indEndHeader)}`;
          const separators = calcSeparators(columnLabel, tsvBuild, colSepChar);
          tsvBuild = `${tsvBuild}${separators}${value}`;
        } else {
          // Add first column
          tsvBuild = `${columnLabel}${lineSepChar}`;
          tsvBuild = `${tsvBuild}${value}`;
        }
      } else if (tsvBuild.slice(-1) === lineSepChar) {
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
    tsvBuild = `${tsvBuild}${lineSepChar}`;
  }
  return tsvBuild;
};

const tableToJSON = (tsv, colSep, lineSep) => {
  const colSepChar = (colSep === undefined) ? '\t' : colSep;
  const lineSepChar = (lineSep === undefined) ? '\n' : lineSep;
  const jsonArr = [];
  let rowObj = {};
  const rows = tsv.split(lineSepChar);
  let paths;
  rows.forEach((row, rowInd) => {
    if (!rowInd) {
      paths = row.split(colSepChar);
    } else {
      const values = row.split(colSepChar);
      values.forEach((value, columInd) => {
        const path = `${paths[columInd]}`;
        if (value) {
          const valueNum = value * 1;
          set(rowObj, path, Number.isNaN(valueNum) ? value : valueNum);
        }
      });
      if (Object.keys(rowObj).length) {
        jsonArr.push(rowObj);
        rowObj = {};
      }
    }
  });
  return jsonArr;
};

let sepValueString;
switch (process.argv[2].slice(-4)) {
  case 'json':
    fs.readFile(process.argv[2], 'utf8', (err, data) => {
      if (err) {
        debug(err);
        return;
      }
      const fileOut = `${process.argv[2].split(/\.(.+)/)[0]}.tsv`;
      fs.writeFile(fileOut, JSONToTable(JSON.parse(data)), (errw) => {
        if (errw) { debug(errw); }
      });
    });
    break;

  case '.tsv':
    fs.readFile(process.argv[2], 'utf8', (err, data) => {
      if (err) {
        debug(err);
        return;
      }
      const fileOut = `${process.argv[2].split(/\.(.+)/)[0]}.json`;
      fs.writeFile(fileOut, tableToJSON(data), (errw) => {
        if (errw) { debug(errw); }
      });
    });
    break;

  default: // test

    sepValueString = JSONToTable(testJSON);
    debug('matched test TSV', sepValueString === testTSV);
    debug('matched test JSON', isEqual(tableToJSON(testTSV), testJSON));
    debug('matched reverse JSON', isEqual(tableToJSON(sepValueString), testJSON));
}
