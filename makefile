all:
	touch bin/bromine.js
	cat lib/Events/Events.js src/utils.js src/Bromine.js > bin/bromine.js
	uglifyjs -o bin/bromine.min.js bin/bromine.js 
