var fs = require('fs');
var test = require('tape');

var XMLTVParser = require('../lib/xmltv.js');

test('XMLTV Parsing', function (t)  {
  var input = fs.createReadStream(__dirname + '/eu_listings.xml');
  var parser = new XMLTVParser();
  input.pipe(parser);

  var programmes = [];

  parser.parseDate('blabla');
  parser.on('programme', function (programme) {
    programmes.push(programme);
  });

  parser.on('end', function (){
    t.equal(programmes.length, 87, 'Parsed all the programme tags');
    var firstProgramme = programmes[0];
    t.equal(firstProgramme.channel, '3sat.de', 'Parsed channel successfully');
    t.deepEqual(
      firstProgramme.start,
      new Date('2015-06-03T02:50:00+02:00'),
      'Parsed start successfully'
    );
    t.end();
  });
});

