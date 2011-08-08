# LuaScript

Translate Lua 5.2 to Javascript.

## Intrinsic limitations

Obviously, porting Lua to JavaScript has some feature limitations. Some of those limitations are obvious, like access to C endpoints, but some are not. These section outlines those limitations.

### Syntax limitations

Those are limitations that happen at the syntax level:

* Returning more than one value in a function is theoretically possible, but would greatly impact performance and therefore is disabled:

        function example()
          return 1, 2
        end

  Maybe ECMAScript Harmony will provide tools to make this more viable;

* goto statements may be implemented, but are not supported currently;

* Variables create inside while/repeat/if expressions leak to their outer scope. This does not happen in Lua, but happens in LuaScript. This can be solved with today tools, but will be solved more elegantly with let. In Lua:

        if true then a = 0 end
        a --> nil

  In LuaScript:

        if true then a = 0 end
        a --> 1

### STDLIB limitations

Limitations regarding STDLIB methods:

* setmetatable does not support modifying __index and __newindex. ECMAScript's proxies will likely make this possible;

* setfenv is not supported and probably never will;

### Runtime limitations

* Avoid tail recursion. They are not supported by JS runtimes;