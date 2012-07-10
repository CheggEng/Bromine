all:
	touch bin/bromine.js
	cat src/license.js lib/Events/Events.js src/utils.js src/Bromine.js src/Reporter.js > bin/bromine.js
	uglifyjs -o bin/bromine.min.js bin/bromine.js 
	yuidoc .
	cp theme/favicon.png docs/assets/
	cp theme/logo.png docs/assets/css/
	cp theme/main.css docs/assets/css/
