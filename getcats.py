import requests
from bs4 import BeautifulSoup
import time

def get_cats():
	url = 'http://en.wikipedia.org/w/api.php?action=query&list=allcategories&acmin=20&acmax=300&aclimit=500&format=xml'
	contparam = ''
	cats = []
	while True:
		print contparam
		soup = BeautifulSoup(requests.get(url+contparam).content)
		cats.extend([a.text for a in soup.find_all('c')])
		if soup.find('query-continue'):
			contparam = '&acfrom='+soup.find('query-continue').allcategories['accontinue']
		else:
			break
	return cats
