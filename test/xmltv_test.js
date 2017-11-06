var fs = require('fs');
var path = require('path');
var test = require('tape');
var moment = require('moment');

var xmltv = require('../lib/xmltv.js');

/**
 * Starts reading and parsing the file from the test folder. Returns the xmltv
 * parser. Also appends all the programmes data to the given array
 */
function createParser (xmlName, programmeArray) {
    var input = fs.createReadStream(path.join(__dirname, xmlName));
    var parser = new xmltv.Parser();
    input.pipe(parser);

    parser.on('programme', function (programme) {
        programmeArray.push(programme);
    });

    return parser;
}

test('XMLTV Additional Methods', function (t) {
    var parser = new xmltv.Parser();
    t.deepEqual(
        parser.parseDate('20150506120043 +0200'),
        new Date('2015-05-06T12:00:43+02:00'),
        'default parseDate full format'
    );
    t.deepEqual(
        parser.parseDate('201505061200 +0200'),
        null,
        'default parseDate missing seconds'
    );
    parser = new xmltv.Parser({ timeFmt: 'YYYYMMDDHHmm Z'});
    t.deepEqual(
        parser.parseDate('20150506120043 +0200'),
        null,
        'custom parseDate full format'
    );
    t.deepEqual(
        parser.parseDate('201505061200 +0200'),
        new Date('2015-05-06T12:00:00+02:00'),
        'custom parseDate missing seconds'
    );
    parser = new xmltv.Parser({ strictTime: false });
    t.deepEqual(
        parser.parseDate('201505061200 +0200'),
        moment('2015-05-06T12:00:02').toDate(),
        'strict parseDate missing seconds'
    );

    t.end();
});

test('XMLTV Parsing', function (t) {
    t.plan(21);
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
        t.equal(firstProgramme.getSeason('4.2'), null, 'getSeason bad format');
        t.equal(euProgrammes[30].getSeason(), null, 'getSeason method with no xmltv_ns');

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
        t.deepEqual(firstProgramme.credits, [ { type: 'director', role: null, name: 'Henri Verneuil' },
            { type: 'actor', role: 'Julien Maillat', name: 'Jean-Paul Belmondo' },
            { type: 'actor', role: 'Jeanne', name: 'Catherine Spaak' },
            { type: 'actor', role: 'Pinot', name: 'Georges Géret' },
            { type: 'actor', role: 'Pierson', name: 'Jean-Pierre Marielle' },
            { type: 'actor', role: 'Alexandre', name: 'François Périer' },
            { type: 'actor', role: 'Dhéry', name: 'Pierre Mondy' },
            { type: 'actor', role: 'le capitaine Robinson', name: 'Ronald Howard' },
            { type: 'actor', role: 'le caporal-chef réceptionniste', name: 'Dominique Zardi' },
            { type: 'actor', role: null, name: 'la femme d\'Atkins)' },
            { type: 'actor', role: 'Paul', name: 'Christian Barbier' },
            { type: 'actor', role: 'le gouape', name: 'Jean-Paul Roussillon' },
            { type: 'actor', role: 'le soldat qui boit', name: 'Paul Préboist' },
            { type: 'actor', role: 'un croque-mort', name: 'Pierre Vernier' } ],
            'Parsed credits'
        );
    });

    guideParser.on('end', function () {
        t.equal(guideProgrammes[0].length, 85 * 60, 'Parsed length - mintues');
        t.equal(guideProgrammes[1].length, 35, 'Parsed length - seconds');
        t.equal(guideProgrammes[2].length, 60 * 60 * 60, 'Parsed length - hours');
        t.equal(guideProgrammes[3].length, null, 'Parsed length - bad units is null');
        t.deepEqual(guideProgrammes[17].episodeNum,
            [ { system: 'xmltv_ns', value: '.8/12.'}],
            'Parsed episode-num'
        );
        t.equal(guideProgrammes[21].getSeason(), 5, 'getSeason method works');
    });

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

test('XMLTV Error Handling', function (t) {
    var numOfErrors = 0;
    var parser = new xmltv.Parser();
    parser.on('error', function (err) {
            t.ok(err instanceof Error, 'Got error');
            numOfErrors++;
        })
        .on('end', function () {
            t.equal(numOfErrors, 3, 'Got expected number of errors');
            t.end();
        })
    ;
    parser.end('<Bla>Invalid XML</bli>');
});
