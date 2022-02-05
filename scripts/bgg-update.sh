#!/bin/bash
BGG_USERNAME=0xACE

curl -o dl-collection.xml https://boardgamegeek.com/xmlapi2/collection\?username\=${BGG_USERNAME}
collection_lines=$(diff bgg-collection.xml dl-collection.xml | grep "^>" | wc -l)
if [[ $collection_lines -gt 1 ]] ; then
	mv dl-collection.xml bgg-collection.xml
	git add bgg-collection.xml
else
	rm dl-collection.xml
fi

curl -o dl-plays.xml https://boardgamegeek.com/xmlapi2/plays\?username\=${BGG_USERNAME}
play_lines=$(diff bgg-plays.xml dl-plays.xml | grep "^>" | wc -l)
if [[ $play_lines -gt 1 ]] ; then
	mv dl-plays.xml bgg-plays.xml
	git add bgg-plays.xml
else
	rm dl-plays.xml
fi

staged=$(git diff --name-only --cached | wc -l)
if [[ $staged -ge 1 ]] ; then
	echo git commit -m"Update BGG game data."
	echo git push origin master
fi