var casper = require('casper').create({
    onError: function(self, m) {   // Any "error" level message will be written
        console.log('FATAL:' + m); // on the console output and PhantomJS will
		var d = new Date();
		self.capture('pubfail'+d.getTime()+'.png');
        self.exit();               // terminate
    }
});

casper.thenClickLabel = function(lbl) {
	return this.then(function() {
		this.clickLabel(lbl);
	});
};

var bookTitle = casper.cli.get('title')
var summary = casper.cli.get('summary')
var userName = casper.cli.get('user')
var password = casper.cli.get('pass')
var filename = casper.cli.get('file')

casper.start('http://writinglife.kobobooks.com');

casper.then(function() {
	this.echo('signing in')
	this.fill('form', {
		'EditModel.Email' : userName,
		'EditModel.Password' : password
	}, true);
});

casper.thenOpen('https://writinglife.kobobooks.com/ebooks#ebooklibrary/authors');
casper.thenClick('#booksLibraryNewDraftButton');
casper.waitForText('Describe the', null, null, 10000);
casper.then(function() {
	this.echo('creating new book')
	this.fill('form#metadata', {
		'title' : bookTitle,
		'authorList' : 'The Authors of Wikipedia',
		'publisher' : 'Pubwiki'
	}, false);
	this.click('#editMetdataCategories');
});

casper.waitForText('Reference');

casper.thenClickLabel('Reference & Language');
casper.thenClickLabel('Reference');
casper.thenClickLabel('Encyclopedias');
casper.wait(1000);
casper.thenClickLabel('Confirm');
casper.thenClick('#cke_contents_synopsis');
casper.wait(1000);
casper.thenEvaluate(function(summaryText) {
	CKEDITOR.instances.synopsis.setData(summaryText);
}, { summaryText: summary } );

casper.wait(3000);

casper.thenClick('#detailsSaveAndNext');

casper.waitForText('What you need to know before', null, function() {
	this.echo('timeout waiting for upload form!');
	this.capture('timeout.png');
}, 20*1000);

// requires phantomjs 1.8 or higher to work
casper.page.onFilePicker = function(oldFile) {
	return filename;
};

casper.wait(1000);

casper.then(function() {
	this.echo('uploading...');
	this.click('#bookContentInput');
});
casper.wait(1000);
casper.thenClick('#bookContentSubmit');

casper.waitForText('Upload complete', null, function() {
	this.echo('timeout waiting for upload!');this.capture('timeout.png');
}, 180*1000);

casper.then(function() {
	this.echo('upload complete!');
	this.click('.modalWindow b');
});

casper.wait(3000);

casper.thenClick('#detailsSaveAndNext');

casper.waitForText('Apply Digital Rights');

casper.thenClick('#drm');

casper.wait(3000);

casper.thenClick('#detailsSaveAndNext');

casper.waitForText('Your currency');

casper.then(function() {
	var price = this.evaluate(function() {
		var priceElem = document.getElementById('defaultPriceInput');
		priceElem.value = '1.99';
		return priceElem.value;
	});
	if (!price) {
		this.capture('noprice.png');
		this.die('setting price failed!', 1);
	}
});

casper.wait(3000);

casper.thenClick('#detailsSaveAndNext');

casper.waitForText('Publish eBook');
casper.wait(3000);
casper.thenClick('#publishBookSubmit');
casper.waitForText('done!', null, function() {
	var d = new Date();
	this.capture('pubfail'+d.getTime()+'.png');
	this.die('publishing timed out!');
}, 60000);

casper.then(function() {
	var dialogText = this.fetchText('.modalWindow');
	if (dialogText.indexOf('done!') < 0) {
		var d = new Date();
		this.capture('pubfail'+d.getTime()+'.png');
		this.die('publishing failed!' + dialogText, 1);
	}
});

casper.run(function() {
	this.echo('done!').exit();
});
