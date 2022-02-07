// JSONtab library
// A tool to reversibly convert between an arbitrarily deep nested object and a
// tabular format, TSV by default.

const debug = require('debug')('app');
const set = require('lodash/set');
const isEqual = require('lodash/isEqual');

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

const calcSeparators = (columnLabel, sepValueString, colSep, lineSep) => {
// Return a string of column separators representing empty fields in the
// current row based on the position of columnLabel within the column header
// sepValueString : recursively built separated value table
// colSep : Column separator, default tab
// lineSep : Line separator, default newline
  const colSepChar = (colSep === undefined) ? '\t' : colSep;
  const lineSepChar = (lineSep === undefined) ? '\n' : lineSep;
  const colSepRegex = new RegExp(colSepChar, 'g');
  const lineSepRegex = new RegExp(`${lineSepChar}(.+)$`, 'g');
  const colHeader = sepValueString.split(lineSepChar)[0];
  const indColumnLabel = colHeader.indexOf(columnLabel);
  const labelNumber = (colHeader.slice(0, indColumnLabel).match(colSepRegex) || []).length;
  const currentRow = sepValueString.split(lineSepRegex)[1];
  const currColNumber = (currentRow.match(colSepRegex) || []).length;
  const addSeparators = labelNumber - currColNumber;

  let separators = '';
  for (let i = 0; i < addSeparators; i += 1) {
    separators = `${separators}${colSepChar}`;
  }
  return separators;
};

const JSONToTable = (JSONObject, pathElement, sepValueElement, colSep, lineSep) => {
// Return a separated value table from an arbitrary nested object JSONObject.
// pathElement : recursively built path for each value, used to populate column headers
// this preserves the object structure in order to reconstruct it later,
// see function tableToJSON
// sepValueElement : recursively built separated value table
// colSep : Column separator, default tab
// lineSep : Line separator, default newline
  let sepValueString = (sepValueElement === undefined) ? '' : sepValueElement;
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
      sepValueString = JSONToTable(value, pathBuild, sepValueString);
    } else {
      const columnLabel = pathBuild.split(/\.(.+)/)[1];
      const indEndHeader = sepValueString.indexOf(lineSepChar);
      const colHeader = sepValueString.slice(0, indEndHeader);
      const indColumnLabel = colHeader.indexOf(columnLabel);

      if (indColumnLabel === -1) {
        if (sepValueString.length) {
          // Add new column
          sepValueString = `${colHeader}${colSepChar}${columnLabel}${sepValueString.slice(indEndHeader)}`;
          const separators = calcSeparators(columnLabel, sepValueString, colSepChar);
          sepValueString = `${sepValueString}${separators}${value}`;
        } else {
          // Add first column
          sepValueString = `${columnLabel}${lineSepChar}`;
          sepValueString = `${sepValueString}${value}`;
        }
      } else if (sepValueString.slice(-1) === lineSepChar) {
        // Add first value in new row
        sepValueString = `${sepValueString}${value}`;
      } else {
        // Calculate column position and add subsequent value in row
        const separators = calcSeparators(columnLabel, sepValueString);
        sepValueString = `${sepValueString}${separators}${value}`;
      }
    }
  });
  if (pathElement !== undefined && !pathElement.includes('.')) {
    // End of row
    sepValueString = `${sepValueString}${lineSepChar}`;
  }
  return sepValueString;
};

const tableToJSON = (sepValueString, colSep, lineSep) => {
// Return an arbitrary nested object from a separate value table sepValueString
// The table column header contains paths which are used to reconstruct
// the object.
// colSep : Column separator, default tab
// lineSep : Line separator, default newline
  const colSepChar = (colSep === undefined) ? '\t' : colSep;
  const lineSepChar = (lineSep === undefined) ? '\n' : lineSep;
  const jsonArr = [];
  let rowObj = {};
  const rows = sepValueString.split(lineSepChar);
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

// run tests
const sepValueString = JSONToTable(testJSON);
debug('matched test TSV', sepValueString === testTSV);
debug('matched test JSON', isEqual(tableToJSON(testTSV), testJSON));
debug('matched reverse JSON', isEqual(tableToJSON(sepValueString), testJSON));
