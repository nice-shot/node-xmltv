var fs = require('fs');
var test = require('tape');

var xmltv = require('../lib/xmltv.js');

/**
 * Starts reading and parsing the file from the test folder. Returns the xmltv
 * parser. Also appends all the programmes data to the given array
 */
function createParser(xmlName, programmeArray) {
    var input = fs.createReadStream(__dirname + '/' + xmlName);
    var parser = new xmltv.Parser();
    input.pipe(parser);

    parser.on('programme', function (programme) {
        programmeArray.push(programme);
    });

    return parser;
}

test('XMLTV Parsing', function (t)    {
    t.plan(15);
    var euProgrammes = [];
    var guideProgrammes = [];
    var itProgrammes = [];
    var euParser = createParser('eu_listings.xml', euProgrammes);
    var guideParser = createParser('tvguide.xml', guideProgrammes);
    var itParser = createParser('it_listings.xml', itProgrammes);

    euParser.on('end', function (){
        t.equal(euProgrammes.length, 87, 'Parsed all the programme tags');
        var firstProgramme = euProgrammes[0];
        t.equal(firstProgramme.channel, '3sat.de', 'Parsed channel');
        // getSeason checks:
        t.equal(firstProgramme.getSeason('0.1/3.'), 1, 'getSeason with data');
        t.equal(firstProgramme.getSeason('.4.0'), null, 'getSeason empty');

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
        t.deepEqual(guideProgrammes[17].episodeNum,
            [ { system: 'xmltv_ns', value: '.8/12.'}],
            'Parsed episode-num'
        );
        t.equal(guideProgrammes[21].getSeason(), 5, 'getSeason method works');
    });

    // guideParser.on('programme', function (programme) {
    //     if (programme.episodeNum.length !== 0) {
    //         console.log(Array(40).join('*'));
    //         console.log(guideProgrammes.indexOf(programme));
    //         console.log(programme.episodeNum);
    //         console.log(Array(40).join('*'));
    //     }
    // });

    itParser.on('end', function () {
        t.deepEqual(itProgrammes[1533].country,
            ['ITALIA'],
            'Parsed country'
        );
        t.deepEqual(itProgrammes[1533].rating,
            [ {system: 'it', value: '1' }],
            'Parsed ratings'
        );
    });
});

