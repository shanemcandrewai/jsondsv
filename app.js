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

const JSONToTab = (obj, path, tsv) => {
  let tsvBuild = (tsv === undefined) ? '' : tsv;
  Object.entries(obj).forEach(([key, value]) => {
    let newpath;

    if (Array.isArray(obj)) {
      newpath = (path === undefined) ? `[${key}]` : `${path}[${key}]`;
    } else {
      newpath = (path === undefined) ? key : `${path}.${key}`;
    }

    if (typeof value === 'object') {
      tsvBuild = JSONToTab(value, newpath, tsvBuild);
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

const tabToJSON = (tsv) => {
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

switch (process.argv[2].slice(-4)) {
  case 'json':
    fs.readFile(process.argv[2], 'utf8', (err, data) => {
      if (err) {
        debug(err);
        return;
      }
      const fileOut = `${process.argv[2].split(/\.(.+)/)[0]}.tsv`;
      fs.writeFile(fileOut, JSONToTab(JSON.parse(data)), (errw) => {
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
      fs.writeFile(fileOut, tabToJSON(data), (errw) => {
        if (errw) { debug(errw); }
      });
    });
    break;
    
  default: // test

    debug('matched JSON', isEqual(tabToJSON(testTSV), testJSON));
    debug('matched TSV', JSONToTab(testJSON) === testTSV);
}
