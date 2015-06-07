var sax = require('sax');
var util = require('util');
var stream = require('stream');
var moment = require('moment');

// Maps field names to object names
var PROGRAMME_MULTI_FIELDS = Object.freeze({
    title: 'title',
    'sub-title': 'secondaryTitle',
    desc: 'desc',
    category: 'category',
    country: 'country'
});

// Used to convert length tags
var LENGTH_UNITS = Object.freeze({
    seconds: 1,
    minutes: 60,
    hours: 60 * 60
});

function Programme () {
    this.channel = null;
    this.start = null;
    this.end = null;
    this.length = null;
    this.title = [];
    this.secondaryTitle = [];
    this.desc = [];
    this.category = [];
    this.country = [];
    this.rating = [];
    this.episodeNum = [];
}

Programme.prototype.getSeason = function () {
    return 5;
};

function XMLTVParser () {
    stream.Writable.call(this);

    var parserOptions = {
        trim: true,
        position: false
    };

    this.xmlParser = sax.createStream(true, parserOptions);
    // Use the finish event to close the sax parser
    this.on('finish', this.xmlParser.end.bind(this.xmlParser));
    this.xmlParser.on('end', function () {
        this.emit('end');
    }.bind(this));

    var programme;
    var currentNode;
    var currentTag;
    var parentTag;
    var lengthUnits;
    var ratingSystem;

    this.xmlParser.on('opentag', function(node) {
        node.parentNode = currentNode;
        currentNode = node;

        parentTag = currentTag;
        currentTag = node.name;
        switch (currentNode.name) {
            case 'programme':
                programme = new Programme();
                programme.channel = node.attributes.channel;
                programme.start = this.parseDate(node.attributes.start);
                // Technically 'end' is not mandatory but it usually appears
                programme.end = this.parseDate(node.attributes.stop);
                break;
            case 'length':
                lengthUnits = node.attributes.units;
                break;
            case 'rating':
                ratingSystem = node.attributes.system;
                break;
        }
    }.bind(this));

    this.xmlParser.on('closetag', function(tagName) {
        if (tagName === 'programme') {
            this.emit('programme', programme);
        }
        // Clear saved attributes for programme
        lengthUnits = null;
        ratingSystem = null;
        // Restore the parent tag
        currentNode = currentNode.parentNode;
        currentTag = parentTag;
    }.bind(this));

    this.xmlParser.on('text', function(text) {
        if (currentNode.name in PROGRAMME_MULTI_FIELDS) {
            programme[PROGRAMME_MULTI_FIELDS[currentNode.name]].push(text);
            return;
        }
        switch (currentNode.name) {
            case 'length':
                var lengthUnits = currentNode.attributes.units;
                if (lengthUnits in LENGTH_UNITS) {
                    programme.length = +text * LENGTH_UNITS[lengthUnits];
                }
                break;
            case 'episode-num':
                programme.episodeNum.push({
                    system: currentNode.attributes.system,
                    value: text
                });
                break;
            case 'value':
                switch (currentNode.parentNode.name) {
                    case 'rating':
                        programme.rating.push({
                            system: currentNode.parentNode.attributes.system,
                            value: text
                        });
                        break;
                }
                break;
        }
    }.bind(this));

}

util.inherits(XMLTVParser, stream.Writable);
// Pipe everything to the sax parser
XMLTVParser.prototype._write = function (chunk, encoding, done) {
    this.xmlParser.write(chunk, encoding);
    done();
};

var TIME_FMT = 'YYYYMMDDHHmmss Z';
/**
 * Parses xmltv date format. Looks like: 20150603025000 +0200.
 * Returns a date object or null if it doesn't fit the format
 */
XMLTVParser.prototype.parseDate = function (date) {
    var parsed = moment(date, TIME_FMT, true);
    if (parsed.isValid()) {
        return parsed.toDate();
    }
    return null;
};

module.exports = XMLTVParser;
