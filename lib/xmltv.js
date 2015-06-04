var fs = require('fs'),
  sax = require('sax'),
  util = require('util'),
  events = require('events');

function XmlTv() {
  this.parserOptions = {
    trim: true,
    position: false
  };
  var currentTag = false;
  var channels = [];
  var programme = false;
  //extracted fields for programmes
  var programmeFields = {
    'title' : true,
    'desc' : true,
    'credits' : false,
    'video' : false,
    'date': true,
    'length': true,
    'category': true
  };

  this.parser = sax.createStream(true, this.parserOptions);
  this.parseDate = function(date) {
    var matches = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s\+(\d{4})$/.exec(date);
    if (matches) {
      return new Date(matches[1], parseInt(matches[2], 10) -1, matches[3], matches[4], matches[5], matches[6]);
    }
    return false;
  };

  this.parser.on('opentag', function(node) {
    node.parentTag = currentTag;
    currentTag = node;
    if (currentTag.name === "programme") {
      var channel = channels[node.attributes.channel];
      var start = this.parseDate(node.attributes.start);
      var end = this.parseDate(node.attributes.stop);
      programme = {
        channel: channel,
        start: start,
        end: end
      };
    }
  }.bind(this));

  this.parser.on("closetag", function(tagName) {
    currentTag = currentTag.parentTag;
    if (tagName === "programme") {
      this.emit("programme", programme);
    }
  }.bind(this));

  this.parser.on("text", function(text) {
    if (currentTag.parentTag.name === "channel") {
      if (currentTag.name === "display-name") {
        channels[currentTag.parentTag.attributes.id] = text;
      }
    }
    if (currentTag.parentTag.name === "programme") {
      if (programmeFields[currentTag.name]) {
        programme[currentTag.name] = text;
      }
    }
  });

  this.parser.on("end", function() {
    this.emit("end");
  }.bind(this));
}

util.inherits(XmlTv, events.EventEmitter);
XmlTv.prototype.parseFile = function(fileName) {
  fs.createReadStream(fileName).pipe(this.parser);
};
module.exports = XmlTv;

