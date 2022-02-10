# JSONDSV library
A tool to reversibly convert between an arbitrarily deep nested array and a configurable delimiter-separated values (DSV) format such as tab (TSV), comma (CSV), pipe, etc. Reversibility is achieved by populating the header row of the DSV with paths from the array.

## Use case
For arrays which are fairly tabular, i.e. composed of records with similar structure, converting to DSV format facilates processing with spreadhsheets, databases or other common tools. In addition, the structure of the array can be altered by simply editing the header row and then converting back to an array.

Tables with many columns of sparse data (i.e lots of blank cells) can be converted to a more compact array format since empty values are not encoded.

## Examples and testing
Included in the libary is an example of a nested array (testArray), its equivalent DSV formats and a simple test runner. With Node.js, the tests can be executed with DEBUG=app node jsondsv.js

## Example nested array
    [
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
    ]
## [Example equivalent TSV](test.tsv)
    row\trec-0.date\trec-0.tags[0]\trec-1.date\trec-1.url\trec-0.url\trec-1.tags[0]\trec-1.tags[1]\n
    0\t20220121\tval-0\t20220116\thttps://example.com/a\n
    1\t20220116\t\t\t\thttps://example.com/b\tval-0\tval-1\n
    
