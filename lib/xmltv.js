var sax = require('sax');
var util = require('util');
var stream = require('stream');
var moment = require('moment');

var programmeMultiFields = ['title'];

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
    var currentTag;

    this.xmlParser.on('opentag', function(node) {
        currentTag = node.name;
        if (currentTag === 'programme') {
            var start = this.parseDate(node.attributes.start);
            // Technically 'end' is not mandatory but it almost allways appears
            var end = this.parseDate(node.attributes.stop);
            programme = {
                channel: node.attributes.channel,
                start: start,
                end: end,
                title: []
            };
        }
    }.bind(this));

    this.xmlParser.on('closetag', function(tagName) {
        if (tagName === 'programme') {
            this.emit('programme', programme);
        }
    }.bind(this));

    this.xmlParser.on('text', function(text) {
        if (programmeMultiFields.indexOf(currentTag) !== -1) {
            programme[currentTag].push(text);
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

// var fs = require('fs'),
//     sax = require('sax'),
//     util = require('util'),
//     events = require('events');

// function XmlTv() {
//     this.parserOptions = {
//         trim: true,
//         position: false
//     };
//     var currentTag = false;
//     var channels = [];
//     var programme = false;
//     //extracted fields for programmes
//     var programmeMultiFields = {
//         'title' : true,
//         'desc' : true,
//         'credits' : false,
//         'video' : false,
//         'date': true,
//         'length': true,
//         'category': true
//     };

//     this.parser = sax.createStream(true, this.parserOptions);
//     this.parseDate = function(date) {
//         var matches = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s\+(\d{4})$/.exec(date);
//         if (matches) {
//             return new Date(matches[1], parseInt(matches[2], 10) -1, matches[3], matches[4], matches[5], matches[6]);
//         }
//         return false;
//     };

//     this.parser.on('opentag', function(node) {
//         node.parentTag = currentTag;
//         currentTag = node;
//         if (currentTag.name === "programme") {
//             var channel = channels[node.attributes.channel];
//             var start = this.parseDate(node.attributes.start);
//             var end = this.parseDate(node.attributes.stop);
//             programme = {
//                 channel: channel,
//                 start: start,
//                 end: end
//             };
//         }
//     }.bind(this));

//     this.parser.on("closetag", function(tagName) {
//         currentTag = currentTag.parentTag;
//         if (tagName === "programme") {
//             this.emit("programme", programme);
//         }
//     }.bind(this));

//     this.parser.on("text", function(text) {
//         if (currentTag.parentTag.name === "channel") {
//             if (currentTag.name === "display-name") {
//                 channels[currentTag.parentTag.attributes.id] = text;
//             }
//         }
//         if (currentTag.parentTag.name === "programme") {
//             if (programmeMultiFields[currentTag.name]) {
//                 programme[currentTag.name] = text;
//             }
//         }
//     });

//     this.parser.on("end", function() {
//         this.emit("end");
//     }.bind(this));
// }

// util.inherits(XmlTv, events.EventEmitter);
// XmlTv.prototype.parseFile = function(fileName) {
//     fs.createReadStream(fileName).pipe(this.parser);
// };
// module.exports = XmlTv;

