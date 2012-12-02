var toTitleCase = function(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

var casper = require('casper').create();

if (!casper.cli.has('cat')) {
	throw new Error("required parameter: --cat=some_category_url");
}

var categoryUrl = casper.cli.get('cat');
var filename = casper.cli.get('out');
var bookTitle = categoryUrl.replace(/_/g, ' ');
bookTitle = toTitleCase(bookTitle);
var urlEncodedCategory = categoryUrl.replace(/_/g , ' ');
urlEncodedCategory = encodeURIComponent(urlEncodedCategory);

casper.start('http://en.wikipedia.org/wiki/Category:'+categoryUrl, function() { this.echo('Preparing book'); });
casper.thenClick('#coll-create_a_book a');
casper.thenClick('div.collection-button.ok a');
casper.thenOpen('http://en.wikipedia.org/w/index.php?title=Special:Book&bookcmd=add_category&cattitle='+urlEncodedCategory);

casper.then(function() {
	if (this.fetchText('#firstHeading').indexOf('Book too big') > -1) {
		this.die('book too big!', 1);
		return;
	}
	this.click('a.collection-creatorbox-iconlink');
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
	this.download(url, filename);
});

casper.run(function() {
	this.echo('done!').exit();
});
