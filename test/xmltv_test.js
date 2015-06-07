var fs = require('fs');
var test = require('tape');

var XMLTVParser = require('../lib/xmltv.js');

/**
 * Starts reading and parsing the file from the test folder. Returns the xmltv
 * parser
 */
function createParser(xmlName) {
    var input = fs.createReadStream(__dirname + '/' + xmlName);
    var parser = new XMLTVParser();
    input.pipe(parser);

    return parser;
}

test('XMLTV Parsing', function (t)    {
    var euParser = createParser('eu_listings.xml');


    var programmes = [];

    euParser.on('programme', function (programme) {
        programmes.push(programme);
    });


    euParser.on('end', function (){
        t.equal(programmes.length, 87, 'Parsed all the programme tags');
        var firstProgramme = programmes[0];
        t.equal(firstProgramme.channel, '3sat.de', 'Parsed channel');
        t.deepEqual(firstProgramme.start,
            new Date('2015-06-03T02:50:00+02:00'),
            'Parsed start'
        );
        t.deepEqual(
            firstProgramme.end,
            new Date('2015-06-03T04:45:00+02:00'),
            'Parsed end'
        );
        t.deepEqual(firstProgramme.title,
            ['Dünkirchen, 2. Juni 1940'],
            'Parsed title'
        );
        t.deepEqual(programmes[3].secondaryTitle,
            ['Die gleißende Welt   Siri Hustvedts Roman über den entgleisten Kunstbetrieb'],
            'Parsed sub-title'
        );
        t.deepEqual(programmes[3].desc,
            ['"Kulturzeit" ist das werktägliche Kulturmagazin von 3sat. "Kulturzeit" mischt sich in kulturelle und gesellschaftspolitische Fragen ein. Das Magazin bietet ergänzende Hintergrundinformationen, Porträts und Gespräche zu aktuellen und brisanten Fragen.'],
            'Parsed desc'
        );
        t.end();
    });
});

