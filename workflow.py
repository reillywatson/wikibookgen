import subprocess
import codecs
import epub
from optparse import OptionParser

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

cats = codecs.open('cats.txt', 'r', 'utf-8').read().split('\n')
published = codecs.open('done.txt', 'r', 'utf-8').read().split('\n')
cats = [a for a in cats if a not in published]
for cat in cats:
	print 'processing %s' % cat
	retcode = subprocess.call(['casperjs', 'main.js', '--cat=%s'%cat])
	if retcode != 0:
		print 'failed to fetch!'
		continue
	(title, summary) = get_book_fields('test.epub')
	retcode = subprocess.call(['casperjs', 'publish.js', '--title=%s'%title, '--summary=%s'%summary, '--user=%s'%userName, '--pass=%s'%password])
	if retcode != 0:
		print 'failed to publish!'
		continue
	with codecs.open('done.txt', 'a', 'utf8') as out:
		out.write(cat+'\n')
	print 'success!'
