all:
	touch bin/bromine.js
	cat src/license.js lib/Events/Events.js src/utils.js src/Bromine.js src/Reporter.js > bin/bromine.js
	uglifyjs -o bin/bromine.min.js bin/bromine.js 
	yuidoc
	cp logo.png docs/assets/favicon.png
	cp logo.png docs/assets/css/logo.png
