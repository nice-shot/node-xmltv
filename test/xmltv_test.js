var fs = require('fs');
var test = require('tape');

var XMLTVParser = require('../lib/xmltv.js');

test('XMLTV Parsing', function (t)  {
  var input = fs.createReadStream(__dirname + '/eu_listings.xml');
  var parser = new XMLTVParser();
  input.pipe(parser);

  var programmes = [];

  parser.on('programme', function (programme) {
    programmes.push(programme);
  });

  parser.on('end', function (){
    t.equal(programmes.length, 87, 'Parsed all the programme tags');
    t.end();
  });
});
