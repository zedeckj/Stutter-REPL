[Try the REPL](https://stutter.vercel.app/)

## Stutter
Stutter is a LISP inspired toy language I made over a weekend. Valid expressions in Stutter are either Atoms (which are either numbers or booleans), Lists, Functions, or Function calls.

Examples:

Atoms:
``` racket
> 2
2
> true
true
> false
false
```

Function Calls:
``` racket
> (add1 1)
2
> (* 2 3 4)
24
> (let x (+ 3 2) x)
5
```

Lists:
``` racket
>[1 2 3]
[1 2 3]
>(list 4 5)
[4 5]
```

Functions can be defined in the form of 
`(func <argument list> <body>)`

Examples
``` racket
(func [x y z] (+ x y z))
(func [a b] (* a (+ a b)))
```

Built-in Functions include:
```
+, /, *, -, first, rest, add1, map, let, if, and, and, or, list, func,  
foldl, sin, cos, tan, log, ln, <, <=, >, >=, =, max, round, ceil, floor, clear, set!, del!,
```
