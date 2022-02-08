// JSONDSV library
// ===============
// A tool to reversibly convert between an arbitrarily deep nested
// array and a configurable delimiter separated values (DSV) format
// such as tab (TSV), comma (CSV), pipe, etc. Reversibility is achieved
// by populating the header row of the DSV with paths from the array.

// See below for an example of a nested array (testArray), its
// equivalent DSV (testTSV) and a simple test runner. With node.js,
// the tests can be executed with DEBUG=app node jsondsv.js

const debug = require('debug')('app');
const set = require('lodash/set');
const isEqual = require('lodash/isEqual');

// Helper function calcSeparators returns a string of column
// separators representing empty fields in the last row of the DSV
// based on the position of columnLabel within the column header
const calcSeparators = (
  columnLabel,
  dsv,
  options = { colSep: '\t', lineSep: '\n' },
) => {
// dsv : recursively built DSV
// options.colSep : Column separator, default tab
// options.lineSep : Line separator, default newline

  const colSepRegex = new RegExp(options.colSep, 'g');
  const lineSepRegex = new RegExp(`${options.lineSep}(.+)$`, 'g');
  const colHeader = dsv.split(options.lineSep)[0];
  const indColumnLabel = colHeader.indexOf(columnLabel);
  const labelNumber = (
    colHeader.slice(0, indColumnLabel).match(colSepRegex) || []).length;
  const lastRow = dsv.split(lineSepRegex)[1];
  const currColNumber = (lastRow.match(colSepRegex) || []).length;
  const addSeparators = labelNumber - currColNumber;

  let separators = '';
  for (let i = 0; i < addSeparators; i += 1) {
    separators = `${separators}${options.colSep}`;
  }
  return separators;
};

// Function arrayToDSV returns a DSV from an arbitrarily deep nested
// array.
const arrayToDSV = (
  nestedArray,
  pathElement,
  sepValueElement,
  options = { colSep: '\t', lineSep: '\n' },
) => {
// pathElement : recursively built path for each value, used to populate column headers
// this preserves the object structure in order to reconstruct it later,
// see function DSVToArray
// sepValueElement : recursively built separated value table
// options.colSep : Column separator, default tab
// options.lineSep : Line separator, default newline
  let dsv = (sepValueElement === undefined) ? '' : sepValueElement;
  Object.entries(nestedArray).forEach(([key, value]) => {
    let pathBuild;
    if (Array.isArray(nestedArray)) {
      pathBuild = (pathElement === undefined) ? `[${key}]` : `${pathElement}[${key}]`;
    } else {
      pathBuild = (pathElement === undefined) ? key : `${pathElement}.${key}`;
    }

    if (typeof value === 'object') {
      dsv = arrayToDSV(value, pathBuild, dsv);
    } else {
      const columnLabel = pathBuild.split(/\.(.+)/)[1];
      const indEndHeader = dsv.indexOf(options.lineSep);
      const colHeader = dsv.slice(0, indEndHeader);
      const indColumnLabel = colHeader.indexOf(columnLabel);

      if (indColumnLabel === -1) {
        if (dsv.length) {
          // Add new column
          dsv = `${colHeader}${options.colSep}${columnLabel}${dsv.slice(indEndHeader)}`;
          const separators = calcSeparators(columnLabel, dsv, options);
          dsv = `${dsv}${separators}${value}`;
        } else {
          // Add first column
          dsv = `${columnLabel}${options.lineSep}`;
          dsv = `${dsv}${value}`;
        }
      } else if (dsv.slice(-1) === options.lineSep) {
        // Add first value in new row
        dsv = `${dsv}${value}`;
      } else {
        // Calculate column position and add subsequent value in row
        const separators = calcSeparators(columnLabel, dsv, options);
        dsv = `${dsv}${separators}${value}`;
      }
    }
  });
  if (pathElement !== undefined && !pathElement.includes('.')) {
    // End of row
    dsv = `${dsv}${options.lineSep}`;
  }
  return dsv;
};

// Function DSVToArray returns an arbitrarily deep nested array
// from a DSV. The header of the DSV (first row) contains paths
// which are used to reconstruct the array
const DSVToArray = (dsv, options = { colSep: '\t', lineSep: '\n' }) => {
// dsv : input delimiter-separated values
// options.colSep : Column separator, default tab
// options.lineSep : Line separator, default newline
  const jsonArr = [];
  let rowObj = {};
  const rows = dsv.split(options.lineSep);
  let paths;
  rows.forEach((row, rowInd) => {
    if (!rowInd) {
      paths = row.split(options.colSep);
    } else {
      const values = row.split(options.colSep);
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
const testArray = [
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
const dsv = arrayToDSV(testArray);
const arr = DSVToArray(testTSV);
debug(dsv === testTSV, 'matched array to DSV');
debug(isEqual(arr, testArray), 'matched DSV to array');
debug(isEqual(DSVToArray(dsv), testArray), 'matched array to DSV and reverse');
debug(isEqual(arrayToDSV(arr), testTSV), 'matched DSV to array and reverse');
