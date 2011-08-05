lib/lua/compiler/parser.js: lib/lua/compiler/parser.jison
	jison $< --output-file=$@

compile: lib/lua/compiler/parser.js

test: compile
	nodeunit spec