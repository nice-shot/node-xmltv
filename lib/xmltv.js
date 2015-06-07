var sax = require('sax');
var _ = require('lodash');
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

/** A single programme listing */
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

/**
 * Parses episodeNum with xmltv_ns system format and returns the season number
 *
 * xmltv_ns format lookgs like this:
 * season[/total] . episode-num[/total] . episode-part[/total]
 * If the number is not included it's unknown.
 * So: "1.4/5." - is episode 5 out of 5 of season 2.
 * And: "0.0.0/2" - is part 1 of episode 1 of season 1
 * (The count starts from 0)
 *
 * If no arguments are given it looks for the episode number in the episodeNum
 * attribute.
 */
Programme.prototype.getSeason = function (epNum) {
    epNum = epNum || _.find(this.episodeNum, function (item) {
        return item.system === 'xmltv_ns';
    }).value;
    var parts = epNum.split('.');
    if (parts.length !== 3) {
        return null;
    }
    var seasonPart = parts[0];
    var seasonNum = seasonPart.split('/')[0].trim();
    if (seasonPart.length !== 0) {
        return Number(seasonNum) + 1;
    }
    return null;
};

/** Main XMLTV Parser */
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

    this.xmlParser.on('opentag', function(node) {
        node.parentNode = currentNode;
        currentNode = node;

        switch (currentNode.name) {
            case 'programme':
                programme = new Programme();
                programme.channel = node.attributes.channel;
                programme.start = this.parseDate(node.attributes.start);
                // Technically 'end' is not mandatory but it usually appears
                programme.end = this.parseDate(node.attributes.stop);
                break;
        }
    }.bind(this));

    this.xmlParser.on('closetag', function(tagName) {
        if (tagName === 'programme') {
            this.emit('programme', programme);
        }
        // Restore the parent tag
        currentNode = currentNode.parentNode;
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

exports.Parser = XMLTVParser;
exports.Programme = Programme;
