var data = fs.readFileSync('jsonTab.json', 'utf8');
var jno = JSON.parse(data);

for (const property in jno) {
  console.log(`${property}: ${jno[property]}`);
}
for (const property in jno) {
  console.log(property);
}

for (const [key, value] of Object.entries(jno)) {
  console.log(`${key}: ${value}`);
}

var itout = (jno) => {
  for (const property in jno) {
    console.log(`${property}: ${jno[property]}`);
    if (typeof jno[property] === 'object') {
      itout(jno[property])
    }
  }
}

itout(jno);

itout(jno['row-0']);
