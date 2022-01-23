const fs = require('fs');
const debug = require('debug')('app');

fs.readFile('jsonNest.json', 'utf8', (err, data) => {
  if (err) {
    // console.error(err);
    debug(err);
    return;
  }
  // parse JSON string to JSON object
  const jsonNest = JSON.parse(data);
  // jsonNest.forEach(db => {
  // console.log(jsonNest);
  debug(jsonNest);
  // });
});
