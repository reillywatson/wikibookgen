var casper = require('casper').create({
    onError: function(self, m) {   // Any "error" level message will be written
        console.log('FATAL:' + m); // on the console output and PhantomJS will
        self.exit();               // terminate
    }
});

casper.thenClickLabel = function(lbl) {
	return this.then(function() {
		this.echo('clicking label: ' + lbl);
		this.clickLabel(lbl);
	});
};

var bookTitle = casper.cli.get('title')
var summary = casper.cli.get('summary')
var userName = casper.cli.get('user')
var password = casper.cli.get('pass')

casper.start('http://writinglife.kobobooks.com');

casper.then(function() {
	this.echo('signing in')
	this.fill('form', {
		'EditModel.Email' : userName,
		'EditModel.Password' : password
	}, true);
});

casper.thenOpen('https://writinglife.kobobooks.com/ebooks#ebooklibrary/authors');
casper.wait(1000);

casper.thenClick('#booksLibraryNewDraftButton');
casper.wait(1000);

casper.then(function() {
	this.echo('creating new book')
	this.fill('form#metadata', {
		'title' : bookTitle,
		'authorList' : 'The Authors of Wikipedia',
		'publisher' : 'Pubwiki'
	}, false);
	this.click('#editMetdataCategories');
});
casper.wait(1000);

casper.thenClickLabel('Reference & Language');
casper.wait(1000);
casper.thenClickLabel('Reference');
casper.wait(1000);
casper.thenClickLabel('Encyclopedias');
casper.wait(1000);
casper.thenClickLabel('Confirm');
casper.wait(1000);

casper.thenClick('#cke_contents_synopsis');
casper.wait(1000);
casper.thenEvaluate(function(summaryText) {
	CKEDITOR.instances.synopsis.setData(summaryText);
}, { summaryText: summary } );

casper.wait(1000);

casper.thenClick('#detailsSaveAndNext');

casper.wait(1000);
casper.waitForText('What you need to know before', null, function() {
	this.echo('timeout waiting for upload form!');
	this.capture('timeout.png');
}, 20*1000);
casper.wait(1000);

// requires phantomjs 1.8 or higher to work
casper.page.onFilePicker = function(oldFile) {
	casper.echo('file picker!');
	return 'test.epub';
};

casper.wait(1000);

casper.then(function() {
	this.echo('uploading...');
	this.click('#bookContentInput');
});
casper.wait(1000);
casper.thenClick('#bookContentSubmit');
casper.wait(1000);

casper.waitForText('Upload complete', null, function() { this.echo('timeout waiting for upload!');this.capture('timeout.png');}, 60*1000);
casper.wait(1000);

casper.then(function() {
	this.echo('upload complete!');
	this.click('.modalWindow b');
});

casper.wait(1000);

casper.thenClick('#detailsSaveAndNext');

casper.wait(1000);

casper.thenClick('#drm');

casper.wait(1000);

casper.thenClick('#detailsSaveAndNext');

casper.wait(1000);

casper.thenEvaluate(function() {
	var priceElem = document.getElementById('defaultPriceInput');
	priceElem.value = '1.99';
});

casper.wait(1000);

casper.thenClick('#detailsSaveAndNext');

casper.wait(1000);

casper.thenClick('#publishBookSubmit');
casper.wait(1000);

casper.then(function() {
	var dialogText = this.fetchText('.modalWindow');
	if (dialogText.indexOf('done!') < 0) {
		this.die('publishing failed!' + dialogText, 1);
	}
});

casper.thenClick('.modalWindow b');
casper.wait(1000);

casper.run(function() {
	this.echo('done!').exit();
});
