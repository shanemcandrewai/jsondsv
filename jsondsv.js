// JSONDSV library
// ===============
// A tool to reversibly convert between an arbitrarily deep nested array
// and a configurable delimiter separated values (DSV) format such as tab (TSV),
// comma (CSV), pipe, etc. Reversibility is achieved by populating the
// header row of the DSV with paths from the array.

// See below for an example of a nested array (testArray), its equivalent DSV (testTSV)
// and a simple test runner. With node.js, the tests can be executed with
// DEBUG=app node jsondsv.js

const debug = require('debug')('app');
const set = require('lodash/set');
const isEqual = require('lodash/isEqual');

// Helper function calcSeparators
// returns a string of column separators representing
// empty fields in the last row of the DSV based on the position of
// columnLabel within the column header
const calcSeparators = (columnLabel, dsv, colSep, lineSep) => {
// dsv : recursively built DSV
// colSep : Column separator, default tab
// lineSep : Line separator, default newline
  const colSepChar = (colSep === undefined) ? '\t' : colSep;
  const lineSepChar = (lineSep === undefined) ? '\n' : lineSep;
  const colSepRegex = new RegExp(colSepChar, 'g');
  const lineSepRegex = new RegExp(`${lineSepChar}(.+)$`, 'g');
  const colHeader = dsv.split(lineSepChar)[0];
  const indColumnLabel = colHeader.indexOf(columnLabel);
  const labelNumber = (colHeader.slice(0, indColumnLabel).match(colSepRegex) || []).length;
  const currentRow = dsv.split(lineSepRegex)[1];
  const currColNumber = (currentRow.match(colSepRegex) || []).length;
  const addSeparators = labelNumber - currColNumber;

  let separators = '';
  for (let i = 0; i < addSeparators; i += 1) {
    separators = `${separators}${colSepChar}`;
  }
  return separators;
};

// TODO fix
// Function arrayToDSV returns a DSV from an arbitrary nested object JSONObject.
// pathElement : recursively built path for each value, used to populate column headers
// this preserves the object structure in order to reconstruct it later,
// see function tableToJSON
const arrayToDSV = (JSONObject, pathElement, sepValueElement, colSep, lineSep) => {
// sepValueElement : recursively built separated value table
// colSep : Column separator, default tab
// lineSep : Line separator, default newline
  let dsv = (sepValueElement === undefined) ? '' : sepValueElement;
  const colSepChar = (colSep === undefined) ? '\t' : colSep;
  const lineSepChar = (lineSep === undefined) ? '\n' : lineSep;
  Object.entries(JSONObject).forEach(([key, value]) => {
    let pathBuild;
    if (Array.isArray(JSONObject)) {
      pathBuild = (pathElement === undefined) ? `[${key}]` : `${pathElement}[${key}]`;
    } else {
      pathBuild = (pathElement === undefined) ? key : `${pathElement}.${key}`;
    }

    if (typeof value === 'object') {
      dsv = arrayToDSV(value, pathBuild, dsv);
    } else {
      const columnLabel = pathBuild.split(/\.(.+)/)[1];
      const indEndHeader = dsv.indexOf(lineSepChar);
      const colHeader = dsv.slice(0, indEndHeader);
      const indColumnLabel = colHeader.indexOf(columnLabel);

      if (indColumnLabel === -1) {
        if (dsv.length) {
          // Add new column
          dsv = `${colHeader}${colSepChar}${columnLabel}${dsv.slice(indEndHeader)}`;
          const separators = calcSeparators(columnLabel, dsv, colSepChar);
          dsv = `${dsv}${separators}${value}`;
        } else {
          // Add first column
          dsv = `${columnLabel}${lineSepChar}`;
          dsv = `${dsv}${value}`;
        }
      } else if (dsv.slice(-1) === lineSepChar) {
        // Add first value in new row
        dsv = `${dsv}${value}`;
      } else {
        // Calculate column position and add subsequent value in row
        const separators = calcSeparators(columnLabel, dsv);
        dsv = `${dsv}${separators}${value}`;
      }
    }
  });
  if (pathElement !== undefined && !pathElement.includes('.')) {
    // End of row
    dsv = `${dsv}${lineSepChar}`;
  }
  return dsv;
};

const tableToJSON = (dsv, colSep, lineSep) => {
// Return an arbitrary nested object from a separate value table dsv
// The table column header contains paths which are used to reconstruct
// the object.
// colSep : Column separator, default tab
// lineSep : Line separator, default newline
  const colSepChar = (colSep === undefined) ? '\t' : colSep;
  const lineSepChar = (lineSep === undefined) ? '\n' : lineSep;
  const jsonArr = [];
  let rowObj = {};
  const rows = dsv.split(lineSepChar);
  let paths;
  rows.forEach((row, rowInd) => {
    if (!rowInd) {
      paths = row.split(colSepChar);
    } else {
      const values = row.split(colSepChar);
      values.forEach((value, columnInd) => {
        const pathElement = `${paths[columnInd]}`;
        if (value) {
          // remove quotes from value if possible
          const valueNum = value * 1;
          set(rowObj, pathElement, Number.isNaN(valueNum) ? value : valueNum);
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

// test data
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

// run tests
const dsv = arrayToDSV(testJSON);
debug('matched test TSV', dsv === testTSV);
debug('matched test JSON', isEqual(tableToJSON(testTSV), testJSON));
debug('matched reverse JSON', isEqual(tableToJSON(dsv), testJSON));
