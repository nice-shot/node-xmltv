# xmltv

An [XMLTV](http://wiki.xmltv.org/index.php/Main_Page) format reader based on sax.
Cloned from [LionelMartin](https://github.com/LionelMartin) original parser.

## Installation

`npm install xmltv`

## Getting Started
The module expoeses an XMLTV format parser class. This class is a writable stream so
you can just pipe XMLTV data to it:

```javascript
var xmltv = require('xmltv');
var fs = require('fs');

var input = fs.createReadStream('tvguide.xml');
var parser = new xmltv.Parser();
input.pipe(parser);
```

It then emits an event for each programme information it parses.

```javascript
parser.on('programme', function (programme) {
    // Do whatever you want with the programme
});
```

It also emits an `end` event when it finishes reading the XML.

## xmltv.Parser
This is the main parser class. It has the following attributes:
* `xmlParser` - The underlying sax.Parser object. Everything written to the parser
  is piped to it.
* `parseDate(date)` - A small helper method to parse date attributes from the
  standard XMLTV format - YYYYMMDDHHmmss Z (e.g: 20150603025000 +0200).

## xmltv.Programme
This is the object emitted in each `programme` event. It has the following attributes:
* `channel` (String) - Channel id
* `start` (Date) - When will the programme be broadcast
* `end` (Date) - Programme's end time
* `title` (Array[String]) - Programme's titles. According to the DTD at least
  a single title must be present. However, the parser doesn't validate this
* `secondaryTitle` (Array[String]) - Programme's secondary titles. This is
  usually the episode title.
* `desc` (Array[String]) - Programme's descriptions
* `length` (Number) - Length of the programme in seconds
* `category` (Array[String]) - Programme's categories
* `country` (Array[String]) - Programme's countries
* `rating` (Array[Object]) - Array of programme's age ratings. Each rating has a 
  `system` and `value` attributes. Where the system can be something like MPAA.
* `episodeNum` (Array[Object]) - Programme episode number. Each item has a `system`
  and `value` attributes.

For example the following XMLTV programme:
```xml
<programme start="20150603135000 +0200" stop="20150603143000 +0200" channel="3sat.de">
  <title lang="de">Die Rückkehr bedrohter Tierarten</title>
  <sub-title lang="de">Der Rosaflamingo</sub-title>
  <desc lang="de">Zum Nisten benötigt der europäische Rosaflamingo Brackwasser und kleine, unberührte Inseln.</desc>
  <credits>
    <producer>Laurent Charbonnier</producer>
  </credits>
  <category lang="en">series</category>
  <category lang="en">Documentary</category>
  <episode-num system="xmltv_ns">0.4.0/3</episode-num>
  <length units="minutes">27</length>
  <country>EU</country>
</programme>
```
Will create a JS object that looks like this JSON:
```json
{
    "channel": "3sat.de",
    "start": "2015-06-03T11:50:00.000Z",
    "end": "2015-06-03T12:30:00.000Z",
    "title":  ["Die Rückkehr bedrohter Tierarten"],
    "desc": ["Zum Nisten benötigt der europäische Rosaflamingo Brackwasser und kleine, unberührte Inseln."],
    "category": ["series", "Documentary"],
    "episodeNum": [ { "system": "xmltv_ns", "value": "0.4.0/3" }],
    "length": 1620,
    "country": ["EU"],
    "rating": []
}
```

The programme object has a few methods for additional parsing:

### Programme.getSeason([episodeNumber])
If this method receives an episodeNumber in the xmltv_ns format it will parse the
season from it. Otherwise it will look for the season in the programme's episodeNum
attribute.
The returned value is either `null` if no value could be parsed or the season's
number.

If you had the Programme object from the above parsing, running `getSeason()` will
return: `1`.
For more information about the xmltv_ns format check the [xmltv dtd](http://xmltv.cvs.sourceforge.net/viewvc/xmltv/xmltv/xmltv.dtd)

## Missing stuff
The following are attributes covered in the [xmltv dtd](http://xmltv.cvs.sourceforge.net/viewvc/xmltv/xmltv/xmltv.dtd)
that the module currently doesn't parse:
* `credits` - List of crew members
* `subtitles` - Information about the subtitle's language
* `date` - Programme air date
* `star-rating` - Review ratings
* `icon`
* `url`
* `video` - Quality, resolution and additional details about the video
* `audio` - Quality and additional technical details about the audio
* `previously-shown`
* `premiere`
* `last-chance` - This is the last time the programme is being screened
* `new` - First broadcast of a completly new show
* `review` - Critic reviews
