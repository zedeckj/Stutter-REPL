[Try the REPL](https://stutter.vercel.app/)

## Stutter
Stutter is a LISP inspired toy language. Valid expressions in Stuter are either Atoms (which are either numbers or booleans), Lists, and Function calls.

Examples:

Atoms:
```
> 2
2
> true
true
> false
false
```

Function Calls:
```
> (add1 1)
2
> (* 2 3 4)
24
> (let x (+ 3 2) x)
5
```

Lists:
```
>[1 2 3]
[1 2 3]
>(list 4 5)
[4 5]
```

Functions can be defined in the form of 
(func <argument list> <body>)

Examples
```
(func [x y z] (+ x y z))
(func [a b] (* a (+ a b)))
```
