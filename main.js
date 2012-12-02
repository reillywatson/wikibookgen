var casper = require('casper').create({
    onError: function(self, m) {   // Any "error" level message will be written
        console.log('FATAL:' + m); // on the console output and PhantomJS will
        self.exit();               // terminate
    }
});

var toTitleCase = function(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

var categoryUrl = casper.cli.get('cat');
var bookTitle = categoryUrl.replace(/_/g, ' ');
bookTitle = toTitleCase(bookTitle);
var urlEncodedCategory = categoryUrl.replace(/_/g , ' ');
urlEncodedCategory = encodeURIComponent(urlEncodedCategory);

casper.start('http://en.wikipedia.org/wiki/Category:'+categoryUrl, function() { this.echo('started for category: ' + bookTitle); });

casper.then(function() {
	this.click('#coll-create_a_book a');
});

casper.then(function() {
	this.click('div.collection-button.ok a');
});

casper.thenOpen('http://en.wikipedia.org/w/index.php?title=Special:Book&bookcmd=add_category&cattitle='+urlEncodedCategory);

casper.then(function() {
	this.click('a.collection-creatorbox-iconlink');
});

casper.then(function() {
	this.fill('form#mw-collection-title-form', {
		'collectionTitle' : bookTitle
	}, true);
});

casper.thenOpen('http://en.wikipedia.org/wiki/Special:Book',
{
	method: 'post',
	data: { 'collectionTitle' : bookTitle, 'collectionSubtitle' : '', 'bookcmd' : 'set_titles' }
});

casper.thenOpen('http://en.wikipedia.org/wiki/Special:Book',
{
	method: 'post',
	data: { 'writer' : 'epub', 'bookcmd' : 'render' }
});

casper.waitForText('Download the file', null, null, 5*60*1000);

casper.then(function() {
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
