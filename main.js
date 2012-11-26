var casper = require('casper').create({
    onError: function(self, m) {   // Any "error" level message will be written
        console.log('FATAL:' + m); // on the console output and PhantomJS will
        self.exit();               // terminate
    },
});

var bookTitle = 'African Nomads'
var categoryUrl = 'African_nomads'
var urlEncodedCategory='African+nomads'

casper.start('http://en.wikipedia.org/wiki/Category:'+categoryUrl);

casper.then(function() {
	this.echo('url: ' + this.getCurrentUrl());
	this.click('#coll-create_a_book a');
});

casper.then(function() {
	this.echo('url: ' + this.getCurrentUrl());
	this.click('div.collection-button.ok a');
});

casper.thenOpen('http://en.wikipedia.org/w/index.php?title=Special:Book&bookcmd=add_category&cattitle='+urlEncodedCategory);

casper.then(function() {
	this.echo('url: ' + this.getCurrentUrl());
	this.click('a.collection-creatorbox-iconlink');
});

casper.thenOpen('http://en.wikipedia.org/wiki/Special:Book',
{
	method: 'post',
	data: { 'writer' : 'epub', 'bookcmd' : 'render', 'collectionTitle' : bookTitle}
});

casper.waitForText('Download the file');

casper.then(function() {
	this.echo('url: ' + this.getCurrentUrl());
	this.capture('test6.png');
	var url = this.evaluate(function() {
		var links = document.getElementsByTagName('a');
		for (var i = 0; i < links.length; i++) {
			var l = links[i];
			var url = l.getAttribute('href');
			if (url != null && url.indexOf('bookcmd=download') > -1) {
				return url;
			}
		}
	});
	this.echo('downloading: ' + url);
	this.download(url, 'test.epub');
});

casper.run(function() {
	this.echo('done!').exit();
});
