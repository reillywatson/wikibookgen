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

casper.thenClick('#booksLibraryNewDraftButton');

casper.then(function() {
	this.echo('creating new book')
	this.fill('form#metadata', {
		'title' : bookTitle,
		'authorList' : 'The Authors of Wikipedia',
		'publisher' : 'Pubwiki'
	}, false);
	this.click('#editMetdataCategories');
});

casper.thenClickLabel('Reference & Language');
casper.thenClickLabel('Reference');
casper.thenClickLabel('Encyclopedias');
casper.thenClickLabel('Confirm');

casper.thenClick('#cke_contents_synopsis');
casper.thenEvaluate(function(summaryText) {
	CKEDITOR.instances.synopsis.setData(summaryText);
}, { summaryText: summary } );

casper.thenClick('#detailsSaveAndNext');

casper.waitForSelector('#uploadBookContentForm', null, function() {
	this.echo('timeout!');
	this.capture('timeout.png');
}, 20*1000);

casper.then(function() {
	this.fill('form#uploadBookContentForm', {
		'bookContent' : 'test.epub'
	}, true);
});

casper.then(function() {
	this.capture('loggedin.png');
});

casper.run(function() {
	this.echo('done!').exit();
});
