compile:
	jison lib/lua_parser.jison --output-file=lib/lua_parser.js

test: compile
	nodeunit spec
