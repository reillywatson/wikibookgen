import subprocess
import codecs
import epub
from optparse import OptionParser
import os
import multiprocessing
from bs4 import BeautifulSoup
import requests
from datetime import datetime

def get_description(title):
	response = requests.get('http://lookup.dbpedia.org/api/search.asmx/KeywordSearch', params={'QueryString':title, 'MaxHits' : 1})
	soup = BeautifulSoup(response.content)
	if soup.result and soup.result.description:
		return soup.result.description.text + u'<br/>'
	else:
		return ''

def get_book_fields(path):
	book = epub.open_epub(path)
	chapterNames = [a.labels[0][0] for a in book.toc.nav_map.nav_point[0].nav_point]
	title = book.toc.title.split('(')[0]
	summary = get_description(book.toc.title)
	summary += 'This is a compilation of articles from Wikipedia about %s, formatted as an ebook for easy reading.  Topics include:<br/>' % title
	chapterNames = sorted([a.split('(')[0] for a in chapterNames])
	summary += '<br/>'.join(chapterNames)
	return (title, summary)

parser = OptionParser()
parser.add_option('--user', dest='userName')
parser.add_option('--pass', dest='password')
(options, _) = parser.parse_args()
userName = options.userName
password = options.password

mutex = multiprocessing.Lock()

def process_book(cat):
	filename = os.tempnam('.')[2:].replace('.','-') + '.epub'
	try:
		startTime = datetime.now()
		print 'processing %s' % cat
		print filename
		retcode = subprocess.call(['casperjs', 'main.js', '--cat=%s'%cat, '--out=%s'%filename])
		if retcode != 0:
			print 'failed to fetch!'
			os.remove(filename)
			return False
		(title, summary) = get_book_fields(filename)
		for tries in range(3):
			retcode = subprocess.call(['casperjs', 'publish.js', '--file=%s'%filename, '--title=%s'%title, '--summary=%s'%summary, '--user=%s'%userName, '--pass=%s'%password])
			if retcode == 0:
				break
			else:
				print 'failed to publish!'
				if tries == 2:
					os.remove(filename)
					return False
		with mutex:
			with codecs.open('done.txt', 'a', 'utf8') as out:
				out.write(cat+'\n')
		print 'success!', (datetime.now() - startTime).total_seconds()
		os.remove(filename)
		return True
	except:
		print 'exception!'
		try:
			os.remove(filename)
		except:
			pass
		return False

cats = codecs.open('cats.txt', 'r', 'utf-8').read().split('\n')
published = codecs.open('done.txt', 'r', 'utf-8').read().split('\n')
cats = [a for a in cats if a not in published]
p = multiprocessing.Pool(48)
p.map(process_book, cats)

