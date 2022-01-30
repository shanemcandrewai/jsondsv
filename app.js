const fs = require('fs');
const debug = require('debug')('app');

fs.readFile('jsonNest.json', 'utf8', (err, data) => {
  if (err) {
    debug(err);
    return;
  }

  const generateNestedKeyNameAndValue = (input, nestedKeyName, keyValueArr) => {
    if (typeof input === 'object') {
    // array or object - iterate over them
      // const quoteString = Array.isArray(input) ? '' : "'";
      Object.entries(input).forEach(([key, value]) => {
        generateNestedKeyNameAndValue(
          value,
          // extend the key name
          // `${nestedKeyName}[${quoteString}${key}${quoteString}]`,
          `${nestedKeyName}.${key}`,
          keyValueArr,
        );
      });
    } else {
    // string or number (end value)
      keyValueArr.push([nestedKeyName, input]);
    }
  };

  const output = Object.fromEntries(
    Object.entries(JSON.parse(data)).map(([key, value]) => {
      const generatedKeyValuePairs = [];
      generateNestedKeyNameAndValue(value, '', generatedKeyValuePairs);
      return [key, Object.fromEntries(generatedKeyValuePairs)];
    }),
  );

  debug(output);
});
