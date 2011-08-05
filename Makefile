compile:
	jison lib/lua/parser.jison --output-file=lib/lua/parser.js

test: compile
	nodeunit spec
