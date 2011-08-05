## Luascript

## Intrinsic limitations

* Returning more than one value in a function is theoretically possible, but would greatly impact performance and therefore is disabled:

        function example()
          return 1, 2
        end

  Maybe ECMAScript Harmony will provide tools to make this more viable;

* Modifying __index and __newindex in metatable does not work. ECMAScript's proxies will likely make this possible;