"use client";
import Image from "next/image";
import {useState} from "react"; 

function is_wrapper(tok) {
  const wrappers = ["[", "]", "(", ")"]
  for (let i = 0; i < wrappers.length; i++) {
    if (tok == wrappers[i]) {
      return true 
    }
  }
  return false
}

function get_other_wrapper(tok) {
  if (tok == "(") {
    return ")"
  }
  else if (tok == ")") {
    return "("
  }
  else if (tok == "[") {
    return "]"
  }
  else if (tok == "]") {
    return "["
  }
  else {
    //iuyuyhgfffffffffi
    throw new Error(`${tok} is not a wrapper`)
  }
}

function lex(string) {
  const specials = ["[", "]", "(", ")"]
  for (let i = 0; i < specials.length; i++) {
    string = string.replaceAll(specials[i], " " + specials[i] +" ")
  }
  const toks = string.split(/\s+/)
  const out = []
  for (let i = 0; i < toks.length; i++) {
    if (toks[i].trim() != "") {
      out.push(toks[i].trim())
    }
  }
  return out
}
  


function parse_atom(tok) {
  const val = parseInt(tok)
  if (!isNaN(val)) {
    return {type: "number", value: Number(tok)}
  } 
  else if (tok == "false" || tok == "true") {
    return {type: "boolean", value: tok == "true"}
  }
  else if (is_wrapper(tok)) {
    return {type: ERROR, value: `Cannot parse '${tok}' without matching '${get_other_wrapper(tok)}'`} 
  }
  else {
    return {type: "symbol", value: tok}
  }


}
  


//TYPES
const LIST = "list"
const NUM = "number"
const BOOL = "boolean"
const FUNC = "func"
const CALL = "call"
const ERROR = "error"
const SYMBOL = "symbol" 
const CLOSURE = "closure"
const ANY = "any"

function parse(toks) {
  console.log("parsing", toks)
  let bracket = 0
  let paren = 0
  let cur = false 
  if (toks.length == 1) {
   return parse_atom(toks[0])
  }
  else {
    for (let i = 0; i < toks.length; i++) {
    console.log(cur, toks[i])
    if (toks[i] == "(") {
      paren += 1
      const add = {type: CALL, value: [], above : cur}
      if (cur != false) {
        cur.value.push(add)
      }
      cur = add 
    }
    else if (toks[i] == "[") {
      bracket += 1
      const add = {type: LIST, value: [], above : cur}
      if (cur != false) {
        cur.value.push(add)
      }
      cur = add 
    }
    else if (toks[i] == ")" && paren > 0) {
      paren -= 1
      if (cur.above) {
        cur = cur.above
      }
    }
    else if (toks[i] == "]" && bracket > 0) {
      bracket -= 1
      if (cur.above) {
        cur = cur.above
      }
    }
    else if (paren > 0 || bracket > 0) {
      cur.value.push(parse_atom(toks[i]))
    } 
    else {
      return {type: ERROR, value: "Non atomic expression must begin with a '(' or '['"}
    }
  }
  }
  if (paren != 0) {
    return {type: ERROR, value: "Mismatched parenthesis"}
  }
  if (bracket != 0) {
    return {type: ERROR, value: "Mismatched bracket"}
  }
  return {type: cur.type, value: cur.value}
}

function parse_old(toks, paren) {
  const sexpr = {type: "list", value: [], above: 0}
  let cur = sexpr
  if (toks.length == 1) {
    return parse_atom(toks[0])
  }
  else {
    for (let i = 0; i < toks.length; i++) {
      if (toks[i] == "(") {
        paren += 1
        const add = {type: "list", value: [], above: cur}
        cur.value.push(add)
        cur = add
      }
      else if (toks[i] == ")" && paren > 0) {
        paren -= 1
        cur = cur.above
      }
      else if (paren > 0) {
        cur.value.push(parse_atom(toks[i]))   
      }
      else {
        return {type: "error", value: "Mismatched parenthesis"}
      }
    }
    if (paren != 0) {
      return {type: "error", value: "Mismatched parenthesis"}
    }
    console.log("parse", sexpr.value)
    return {type: "list", value: sexpr.value[0].value}
  }
}




function call(func_obj, list) {
  if (typeof(list) != typeof([])) {
    console.log("Invalid", list)
    return list
  } 
  for (let i = 0; i < list.length; i++) {
    if (list[i].type == ERROR || !list[i]) {
      console.log("invalid", list)
      return {type: LIST, value: []}
      return list[i]
    }
  }
  console.log("call",func_obj, list)
  if (func_obj.args.length != list.length && func_obj.args[func_obj.args.length - 1] != "...") {
    console.log("length")
    return {type: ERROR, 
            value: `${func_obj.symbol} expected ${func_obj.args.length} arguments but got ${list.length}`} 
    
  }
  else if (func_obj.args[func_obj.args.length - 1] == "..." && list.length < func_obj.args.length - 2) {
    console.log("length")
    return {type: ERROR, 
            value: `${func_obj.symbol} expected at least ${func_obj.args.length - 1} arguments but got ${list.length}`} 
 
  }
  else {
    let elipse = false
    let last = false
    for (let i = 0; i < list.length; i++) {
      if (func_obj.args[i] == "...") {
        elipse = true
        last = func_obj.args[i - 1]
      }
      let check = elipse ? last : func_obj.args[i]
      if (check != "any" && list[i].type != check){
        const types = []
        for (let j = 0; j < list.length; j++) {
          types.push(list[j].type)
        }
        console.log("type error")
        return {type: "error", value: `${func_obj.symbol} expected ${func_obj.args} but got ${types}`}
      }
    }
    const out = func_obj.value({type: LIST, "value": list})
    console.log("returns", func_obj, "args", list, out)
    return out 
  }
}



function find_in_env(name, env) {
  for (let i = 0; i < env.length; i++) {
    if (env[i].symbol == name) {
      console.log("find", name, env[i])
      return env[i]
    }
  }
  return {type: "error", value: `${name} is not defined`} 
}

//Takes in a list of args, and a body. When called, must create env, then use my_eval on body using env
function make_func_sexpr(to_bind, body, cur_env) {
  const args = []
  for (let i = 0; i < to_bind.value.length; i++) {
    args.push("any")
  }
  function value(sexpr) {
    const new_env = [...cur_env]
    for (let i = 0; i < sexpr.value.length; i++) {
      if (sexpr.value[i].type == FUNC){
        new_env.push({type: FUNC, symbol: to_bind.value[i].value, value: sexpr.value[i].value, args: sexpr.value[i].args}) 
      } else {
        new_env.push({type: sexpr.value[i].type, symbol: to_bind.value[i].value, value: sexpr.value[i].value}) 
      }
    }
    console.log("new_env", new_env)
    return my_eval(body, new_env) 
  }
  return {type: FUNC, symbol: "λ", 
          value: value, args: args, 
          render: (<div className = "flex">
                    {sexpr_to_jsx(to_bind, false,true)}
                    <p className = "font-mono">{"->"}</p>
                    {sexpr_to_jsx(body, false,true)}
                  </div>)
         }
}

function my_eval(in_sexpr, env) {
  const sexpr = copy_sexpr(in_sexpr)  
  console.log("eval", sexpr, env)
  if (sexpr.type == CALL) {
    if (sexpr.value.length == 0) {
      return {type: ERROR, value: "Empty function call"}
    }
    if (sexpr.value[0].value == "func") {
      if (sexpr.value[1].type != LIST) {
        return {type: ERROR, value: "func not given an input parameters list"}
      }
      return make_func_sexpr(sexpr.value[1], sexpr.value[2], env)
    }
    else if (sexpr.value[0].value == "set!") {
      if (find_in_env(sexpr.value[1].value, env).type != ERROR) {
        return {type: ERROR, value: `${sexpr.value[1].value} is already defined`}
      }
      const val = my_eval(sexpr.value[2],env)
      if (val.type != ERROR) {
        call(find_in_env("set!", env), [sexpr.value[1], val])
      }  
      return val
    }
    else if (sexpr.value[0].value == "let") {
      if (sexpr.value[1].type == SYMBOL) {
        if (find_in_env(sexpr.value[1].value, env).type != ERROR) {
          return {type: ERROR, value: `${sexpr.value[1].value} is already defined`}
        }
        const val = my_eval(sexpr.value[2], env)
        let add = []
        if (val.type == FUNC) {
          add = {type: val.type, symbol: sexpr.value[1].value, args: val.args, value: val.value}
        }
        else {
          add = {type: val.type, symbol: sexpr.value[1].value, value: val.value}
        }
        return my_eval(sexpr.value[3], [...env, add] )
      }
      else {
        const types = []
        for (let j = 1; j < sexpr.value.length; j++) {
          types.push(sexpr.value[j].type)
        }
        return {type: ERROR, value: `let expected symbol,any,any but got ${types}`}
      }
    }
    console.log("here2")
    for (let i = 0; i < sexpr.value.length; i++) {
      sexpr.value[i] = my_eval(sexpr.value[i], env)
      if (sexpr.value[i].type == ERROR) {
        return sexpr.value[i]
      }
    }
    if (sexpr.value[0].type == FUNC) {
      console.log("func",sexpr)
      if (sexpr.value.length == 1) {
        return call(sexpr.value[0], [])
      }
      return call(sexpr.value[0], sexpr.value.slice(1)) 
    }
    else {
      return {type: ERROR, value: `${sexpr.value[0].value} is not a function`}
    }
  }
  else if (sexpr.type == LIST) {
    for (let i = 0; i < sexpr.value.length; i++) {
      sexpr.value[i] = my_eval(sexpr.value[i], env)
      if (sexpr.value[i].type == ERROR) {
        return sexpr.value[i]
      }
    }
    return sexpr
  } 
  else if (sexpr.type == SYMBOL) {
    console.log("SYMBOL")
    return find_in_env(sexpr.value, env)
  } 
  else {
    console.log("returning self")
    return {type: sexpr.type, value: sexpr.value}
  }
}


function sexpr_to_jsx(sexpr, first, grey) {
  const grey_cn = "font-mono text-slate-300"
  if (sexpr.type == LIST) {
    if (sexpr.value.length == 0) {
      return <p>[]</p>
    }
    return (
      <div className = "flex">
        <p>[</p>
        {sexpr_to_jsx(sexpr.value[0], false, grey)}
        {sexpr.value.slice(1).map((s,index) => {return <div key = {index} className = "ml-2">{sexpr_to_jsx(s,false,grey)}</div>})} 
        <p>]</p>
      </div>
      
    );
  }
  else if (sexpr.type == CALL) {
    return (
      <div className = "flex">
        <p>(</p>
        {sexpr_to_jsx(sexpr.value[0], true, grey)}
        {sexpr.value.slice(1).map((s,index) => {return <div key = {index} className = "ml-2">{sexpr_to_jsx(s,false,grey)}</div>})} 
        <p>)</p>
      </div>
      
    );
  }
  else if (sexpr.type == "boolean"){
    return (
      <p className = {grey ? grey_cn :"font-mono text-fuchsia-200"}>{sexpr.value ? "true" : "false"}</p>
    )
  }
  else if (sexpr.type == "number"){
    return (
      <p className = {grey ? grey_cn : "font-mono text-emerald-200"}>{sexpr.value}</p>
    )
  }
  else if (sexpr.type == "symbol") {
    if (first) {
      return (
        <p className = {grey ? grey_cn : "font-mono text-yellow-200"}>{sexpr.value}</p>
      )
    }
    return (
      <p className = {grey ? grey_cn : "font-mono text-cyan-200"}>{sexpr.value}</p>
    )
  }
  else if (sexpr.type == "func") {
    if ("render" in sexpr) {
      return (<div className = {grey_cn}>{sexpr.render}</div>)
    }
    return (
      <p className = {grey_cn}>{sexpr.value.toString()}</p>
    )
  }
  else if (sexpr.type == "error") {
    return (
      <p className = "font-mono text-red-400">Error: {sexpr.value}</p>
    )
  }
  else {
    return (
      <p>UNK</p>
    )
  }
}


function sexpr_to_str(sexpr) {
  console.log("final", sexpr)
  if (sexpr.type == "list") {
    let out = "[" + sexpr_to_str(sexpr.value[0])
    for (let i = 1; i < sexpr.value.length; i++) {
      out += " " + sexpr_to_str(sexpr.value[i])
    }
    out += "]"
    return out
  }
  else if (sexpr.type == "error"){
    return `error: ${sexpr.value}`
  }
  else {
    return "" + sexpr.value
  }
}

function first(sexpr) {
  console.log("FIRST", sexpr)
  return sexpr.value[0].value[0]
}

function rest(sexpr) {
  console.log("rest", sexpr)
  return {type: LIST, value: sexpr.value[0].value.slice(1)}
}

function map(sexpr) {
  return {type: LIST, value: sexpr.value[1].value.map((s) => call(sexpr.value[0], [s]))}
}

function add1(sexpr) {
  return {type: NUM, value: sexpr.value[0].value + 1}
}

function wrap(sexpr) {
  return {type: LIST, value: [sexpr]}
}

function add(sexpr) {
  console.log("add",sexpr)
  if (sexpr.value.length == 0) {
    return {type: NUM, value: 0}
  }
  return {type: NUM, value: first(wrap(sexpr)).value + add(rest(wrap(sexpr))).value}

}

function mul(sexpr) {
  if (sexpr.value.length == 0) {
    return {type: NUM, value: 1}
  }
  return {type: NUM, value: first(wrap(sexpr)).value * mul(rest(wrap(sexpr))).value}
}

function sub(sexpr) {
  return {type: NUM, value: first(wrap(sexpr)).value - add(rest(sexpr)).value}
}


function div(sexpr) {
  if (sexpr.value.length == 0) {
    return {type: NUM, value: 1}
  }
  return {type: NUM, value: first(wrap(sexpr)).value / mul(rest(wrap(sexpr))).value}
}

function ternary(sexpr) {
  if (sexpr.value[0].value) {
    return sexpr.value[1]
  }
  return sexpr.value[2]
}
function or(sexpr) {
  if (sexpr.value.length == 0) {
    return {type: BOOL, value: true}
  }
  return {type: BOOL, value: first(wrap(sexpr)).value || or(rest(wrap(sexpr))).value}
} 


function and(sexpr) {
  if (sexpr.value.length == 0) {
    return {type: BOOL, value: true}
  }
  return {type: BOOL, value: first(wrap(sexpr)).value && and(rest(wrap(sexpr))).value}
}

function list(sexpr) {
  return sexpr 
} 

function foldl(sexpr) {
  console.log("FOLDL", sexpr)
  if (sexpr.value[2].value.length == 0) {
    return sexpr.value[1]
  }
  return foldl({type: LIST, value: [sexpr.value[0], sexpr.value[0].value({type: LIST, value: [sexpr.value[1], first(wrap(sexpr.value[2]))]}), rest(wrap(sexpr.value[2]))] })
}
/*


function and(args) {
  return {type: "boolean", value: args[0].value && args[1].value}
}

function or(args) {
  return {type: "boolean", value: args[0].value || args[1].value}
}
function xor(args) {
  return {type: "boolean", value: (args[0].value && !args[1].value) || (!args[0].value && args[1].value) }
}

function not(args) {
  return {type: "boolean", value: !args[0].value}
}


function add(args) {
  if args.length == 0:
    
  return {type: "number", value: args[0].value + args[1].value}
}


function mul(args) {
  return {type: "number", value: args[0].value * args[1].value}
}


function sub(args) {
  return {type: "number", value: args[0].value - args[1].value}
}


function div(args) {
  if (args[1].value == 0) {
    return {type: "error", value: "Divison by 0"}
  }
  return {type: "number", value: args[0].value / args[1].value}
}

function ternary(x, y, z){
  if (x.value) {
    return y
  } 
  return z
}

*/

function copy_sexpr(sexpr) {
  if (sexpr.type == LIST || sexpr.type == CALL) {
    return {type: sexpr.type, value: sexpr.value.map((s) => copy_sexpr(s))}
  }
  else if (sexpr.type == FUNC) {
    if ("render" in sexpr) {
      return {type: sexpr.type, value: sexpr.value, args: sexpr.args, render: sexpr.render}
    }
    return {type: sexpr.type, value: sexpr.value, args: sexpr.args}
  }
  else {
    return {type: sexpr.type, value: sexpr.value}
  }
}

const env = [
    //TODO: must make env dictionary and not list, symbols need to reference sexprs so that variables to other sexprs work properly. Funcs are still an sexpr.
    {type: "func", symbol: "+", value: add, args: ["number", "number", "number", "..."]},
    {type: "func", symbol: "/", value: div, args: ["number", "number", "number", "..."]},
    {type: "func", symbol: "*", value: mul, args: ["number", "number", "number", "..."]},
    {type: "func", symbol: "-", value: sub, args: ["number", "number", "number", "..."]},
    {type: "func", symbol: "first", value: first, args: [LIST]},
    {type: "func", symbol: "rest", value: rest, args: [LIST]},
    {type: "func", symbol: "add1", value: add1, args: ["number"]},
    {type: "func", symbol: "map", value: map, args: ["func", "list"]},
    {type: "func", symbol: "let", value: () => [], args: ["symbol", "any", "any"]},
    {type: "func", symbol: "if", value: ternary, args: ["boolean", "any", "any"]},
    {type: "func", symbol: "and", value: and, args: ["boolean", "boolean", "boolean", "..."]},
    {type: "func", symbol: "and", value: and, args: ["boolean", "boolean", "boolean", "..."]},
    {type: "func", symbol: "and", value: and, args: ["boolean", "boolean", "boolean", "..."]},
    {type: "func", symbol: "or", value: or, args: ["boolean", "boolean", "boolean", "..."]},
    {type: "func", symbol: "list", value: list, args: ["any", "..."]},
    {type: "func", symbol: "func", value: ()=>[], args: ["list", "any"]},
    {type: "func", symbol: "foldl", value: foldl, args: [FUNC, ANY, LIST]},
    {type: "number", symbol: "e", value: Math.E},
    {type: "number", symbol: "pi", value: Math.PI},
    {type: "list", symbol: "_", value: []},
/*
    {type: "func", symbol: "clear", value: () => {clear_after = true; return false}, args: []},
    {type: "func", symbol: "&&", value: and, args: ["boolean", "boolean"]},
    {type: "func", symbol: "||", value: or, args: ["boolean", "boolean"]},
    {type: "func", symbol: "^^", value: xor, args: ["boolean", "boolean"]},
    {type: "func", symbol: "!", value: not, args: ["boolean"]},

    {type: "func", symbol: "if", value: ternary, args: ["boolean", "any", "any"]},
  
    {type: "func", symbol: "+", value: add, args: ["number", "number"]},
    {type: "func", symbol: "*", value: mul, args: ["number", "number"]},
    {type: "func", symbol: "-", value: sub, args: ["number", "number"]},
    {type: "func", symbol: "/", value: div, args: ["number", "number"]},
    */

]
 
let clear = false


function run(e, history, setHistory) {
  e.preventDefault()
  clear = false
  console.log(e.target.text.value)
  //const env = [{symbol: "list", type: "func", ref: list}, {symbol: "eval", type: "func", ref: my_eval}]
  const tokens = lex(e.target.text.value)
  const sexpr = parse(tokens)
  const len = history.length
  const input = {item: sexpr_to_jsx(sexpr), key: len, input: true}
  let updated = []
  if (sexpr.type == "error") {
    const input = {item: <p className = "text-red-400 font-mono">{e.target.text.value}</p>, key: len}
    updated = [...history, input]
  }
  
  else {
    const input = {item: sexpr_to_jsx(sexpr), key: len, input: true}
    updated = [...history, input]
  }


  
  setHistory(updated)

  function define(sexpr) {
    console.log("define",sexpr)
    if (sexpr.value[1].type == "func") {
        if ("render" in sexpr.value[1]) {
          env.push({type: "func", symbol: sexpr.value[0].value, value: sexpr.value[1].value, args: sexpr.value[1].args, render: sexpr.value[1].render})
        }
        else {
          env.push({type: "func", symbol: sexpr.value[0].value, value: sexpr.value[1].value, args: sexpr.value[1].args})
        }
    }
    else {
      env.push({type: sexpr.value[1].type, symbol: sexpr.value[0].value, value: sexpr.value[1].value})
    }
    console.log("env", env)
  }

  function del(sexpr) {
    console.log("DEL ARG", sexpr, sexpr.value[0].symbol)
    const i = env.findIndex((v) => v.symbol == sexpr.value[0].symbol)
    const out = env.splice(i, 1)[0]
    console.log("DEL", out)
    return copy_sexpr(out)
  }
  env.push({type: "func", symbol: "clear", value: (nil) => {clear = true; return []}, args: []})
  env.push({type: "func", symbol: "set!", value: define, args: ["symbol", "any"]})
  env.push({type: "func", symbol: "del!", value: del, args: ["any"]})
  const sexpr_out = my_eval(sexpr, env)
  const res = {item: sexpr_to_jsx(sexpr_out), key: len + 1, entry: false} 
  setHistory([...updated, res])
  e.target.text.value = ""
  if (clear) {
    console.log("CLEARING")
    setHistory([])
    const ref = find_in_env("_", env)
    ref.type = "list"
    ref.value = []
  } else {
    console.log("NOT CLEARING")
    if (sexpr_out.type != ERROR) {
      const ref = find_in_env("_", env)
      ref.type = sexpr_out.type
      ref.value = sexpr_out.value
    }
  }
}
//
export default function Home() {
 const [history, setHistory] = useState([])
 return (
  <div> 
    <ul>
      {history.map((entry) => {
        return (<div className = "flex" key = {entry.key}>
                  <p className = {entry.input ? "text-slate-300 mr-1" : "mr-1"}>{entry.input ? "> " : ""}</p>
                  <div className = {!entry.input && "italic"}>{entry.item}</div>
                </div>)
      })}
    </ul>
    <form onSubmit = {(e) => run(e,history, setHistory)} > 
      <input className = "focus:outline-none bg-zinc-900 resize-none w-full text-white font-mono" name = "text" type = "text" autoComplete = "off" autoFocus/>
      
      <input type="submit" hidden />
    </form>
  </div>
  
 );
}
