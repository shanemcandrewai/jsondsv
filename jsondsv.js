// JSONDSV library
// ===============
// A tool to reversibly convert between an arbitrarily deep nested
// array and a configurable delimiter-separated values (DSV) format
// such as tab (TSV), comma (CSV), pipe, etc. Reversibility is achieved
// by populating the header row of the DSV with paths from the array.

// Use case
// --------

// For data sets which are fairly tabular, i.e composed of records
// with similar structure, converting to DSV format facilates
// processing with spreadhsheats, databases or other common tools.
// In addition, the structure of the array can be altered by simply
// editing the header row and then converting back to an array

// Tables with many columns of sparse data (i.e lots of blank cells)
// can be converted to a more compact array format since empty values
// are not encoded.

// See below for an example of a nested array (testArray), its
// equivalent DSV formats and a simple test runner. With Node.js,
// the tests can be executed with DEBUG=app node jsondsv.js

const debug = require('debug')('app');
const set = require('lodash/set');
const isEqual = require('lodash/isEqual');

// Helper function calcSeparators returns a string of column
// separators representing empty fields in the last row of the DSV
// based on the position of columnLabel within the header row
const calcSeparators = (
  columnLabel,
  dsv,
  options = { colSep: '\t', lineSep: '\n' },
) => {
// columnLabel : currently processed column
// DSV : recursively built delimiter-separated values
// options.colSep : Column separator, default tab
// options.lineSep : Line separator, default newline

  const colSepRegex = new RegExp(options.colSep, 'g');
  const lineSepRegex = new RegExp(`${options.lineSep}(.+)$`, 'g');
  const headerRow = dsv.split(options.lineSep)[0];
  const indColumnLabel = headerRow.indexOf(columnLabel);
  const labelNumber = (
    headerRow.slice(0, indColumnLabel).match(colSepRegex) || []).length;
  debug('xxx', dsv);
  const lastRow = dsv.split(lineSepRegex)[1];
  debug('xx2', lastRow);
  const currColNumber = (lastRow.match(colSepRegex) || []).length;
  const addSeparators = labelNumber - currColNumber;

  let separators = '';
  for (let i = 0; i < addSeparators; i += 1) {
    separators = `${separators}${options.colSep}`;
  }
  return separators;
};

// Function arrayToDSV returns a DSV from an arbitrarily deep nested
// array input.
const arrayToDSV = (
  nestedArray,
  options = { colSep: '\t', lineSep: '\n' },
  internal = { path: '', dsv: '' },
) => {
// nestedArray : arbitrarily deep nested array input
// internal.path : internal recursively built path for each value
//   used to populate header row
// internal.dsv : internal recursively built delimiter-separated values
// options.colSep : Column separator, default tab
// options.lineSep : Line separator, default newline
  let dsv = (internal.dsv.length) ? internal.dsv : options.lineSep;
  Object.entries(nestedArray).forEach(([key, value]) => {
    let pathBuild;
    if (Array.isArray(nestedArray)) {
      pathBuild = `${internal.path}[${key}]`;
    } else {
      pathBuild = `${internal.path}.${key}`;
    }

    if (typeof value === 'object') {
      dsv = arrayToDSV(value, internal, options);
    } else {
      const columnLabel = pathBuild.split(/\.(.+)/)[1];
      const indEndHeader = dsv.indexOf(options.lineSep);
      const headerRow = dsv.slice(0, indEndHeader);
      const indColumnLabel = headerRow.indexOf(columnLabel);
      if (indColumnLabel === -1) {
        // Add new column
        dsv = (headerRow.length) ? `${headerRow}${options.colSep}${columnLabel}${dsv.slice(indEndHeader)}` : `${columnLabel}${dsv.slice(indEndHeader)}`;
        const separators = calcSeparators(columnLabel, dsv, options);
        dsv = `${dsv}${separators}${value}`;
      } else if (dsv.slice(-1) === options.lineSep) {
        // Add first value in new row
        dsv = `${dsv}${value}`;
      } else {
        // Calculate column position and add subsequent value in row
        const separators = calcSeparators(columnLabel, dsv, options);
        dsv = `${dsv}${separators}${value}`;
      }
    }
    if (!internal.path.includes('.')) {
    // End of row
      dsv = `${dsv}${options.lineSep}`;
    }
  });
  return dsv;
};

// Function DSVToArray returns an arbitrarily deep nested array
// which are used to reconstruct the array
const DSVToArray = (dsv, options = { colSep: '\t', lineSep: '\n' }) => {
// dsv : input delimiter-separated values string
// options.colSep : Column separator, default tab
// options.lineSep : Line separator, default newline
  const jsonArr = [];
  // TODO do need  = {} below?
  let rowObj = {};
  const rows = dsv.split(options.lineSep);
  let paths;
  rows.forEach((row, rowInd) => {
    if (!rowInd) {
      // Extract paths from header row of the dsv (first row)
      paths = row.split(options.colSep);
    } else {
      const values = row.split(options.colSep);
      values.forEach((value, columnInd) => {
        const path = `${paths[columnInd]}`;
        if (value) {
          // remove quotes from value if possible
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

// run test TSV
const tsv = arrayToDSV(testArray);
const arrayTSV = DSVToArray(testTSV);
debug(arrayTSV === testTSV, 'matched array to TSV');
debug(isEqual(arrayTSV, testArray), 'matched TSV to array');
debug(isEqual(DSVToArray(tsv), testArray), 'matched array to TSV and reverse');
debug(isEqual(arrayToDSV(arrayTSV), testTSV), 'matched TSV to array and reverse');

// run test CSV
const testCSV = testTSV.replace(/\t/g, ',');
const csv = arrayToDSV(testArray, { colSep: ',', lineSep: '\n' });
const arrayCSV = arrayToDSV(testArray, { colSep: ',', lineSep: '\n' });
debug(csv === testCSV, 'matched array to CSV');
debug(isEqual(arrayCSV, testArray), 'matched CSV to array');
debug(isEqual(DSVToArray(csv, { colSep: ',', lineSep: '\n' }), testArray), 'matched array to CSV and reverse');
debug(isEqual(arrayToDSV(arrayCSV, { colSep: ',', lineSep: '\n' }), testCSV), 'matched CSV to array and reverse');