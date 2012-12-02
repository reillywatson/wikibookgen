import subprocess
import codecs
import epub
from optparse import OptionParser
import os
import multiprocessing

def get_book_fields(path):
	book = epub.open_epub(path)
	chapterNames = [a.labels[0][0] for a in book.toc.nav_map.nav_point[0].nav_point]
	title = book.toc.title
	summary = 'This is a compilation of articles from Wikipedia about %s, formatted as an ebook for easy reading.  Topics include:\n' % title
	chapterNames = sorted([a.split('(')[0] for a in chapterNames])
	summary += '\n'.join(chapterNames)
	return (title, summary)

parser = OptionParser()
parser.add_option('--user', dest='userName')
parser.add_option('--pass', dest='password')
(options, _) = parser.parse_args()
userName = options.userName
password = options.password

mutex = multiprocessing.Lock()

def process_book(cat):
	print 'processing %s' % cat
	filename = os.tempnam('.')[2:].replace('.','-') + '.epub'
	print filename
	retcode = subprocess.call(['casperjs', 'main.js', '--cat=%s'%cat, '--out=%s'%filename])
	if retcode != 0:
		print 'failed to fetch!'
		return False
	(title, summary) = get_book_fields(filename)
	retcode = subprocess.call(['casperjs', 'publish.js', '--file=%s'%filename, '--title=%s'%title, '--summary=%s'%summary, '--user=%s'%userName, '--pass=%s'%password])
	if retcode != 0:
		print 'failed to publish!'
		return False
	with mutex:
		with codecs.open('done.txt', 'a', 'utf8') as out:
			out.write(cat+'\n')
	print 'success!'
	os.remove(filename)
	return True

cats = codecs.open('cats.txt', 'r', 'utf-8').read().split('\n')
published = codecs.open('done.txt', 'r', 'utf-8').read().split('\n')
cats = [a for a in cats if a not in published]
p = multiprocessing.Pool(4)
p.map(process_book, cats)

