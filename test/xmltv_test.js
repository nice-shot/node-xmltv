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
    t.plan(9);
    var euParser = createParser('eu_listings.xml');
    var guideParser = createParser('tvguide.xml');

    var euProgrammes = [];
    var guideProgrammes = [];

    euParser.on('programme', function (programme) {
        euProgrammes.push(programme);
    });

    guideParser.on('programme', function (programme) {
        guideProgrammes.push(programme);
    });

    euParser.on('end', function (){
        t.equal(euProgrammes.length, 87, 'Parsed all the programme tags');
        var firstProgramme = euProgrammes[0];
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
        t.deepEqual(euProgrammes[3].secondaryTitle,
            ['Die gleißende Welt   Siri Hustvedts Roman über den entgleisten Kunstbetrieb'],
            'Parsed sub-title'
        );
        t.deepEqual(euProgrammes[3].desc,
            ['"Kulturzeit" ist das werktägliche Kulturmagazin von 3sat. "Kulturzeit" mischt sich in kulturelle und gesellschaftspolitische Fragen ein. Das Magazin bietet ergänzende Hintergrundinformationen, Porträts und Gespräche zu aktuellen und brisanten Fragen.'],
            'Parsed desc'
        );
        t.deepEqual(euProgrammes[1].category,
            ['movie', 'Documentary'],
            'Parsed category'
        );
    });

    guideParser.on('end', function () {
        t.equal(guideProgrammes[0].length, 85 * 60, 'Parsed length');
    });
});

