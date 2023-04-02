let buffer = "";
const assert = require("node:assert")

process.stdin.on('data', (d) => {
  const input = d.toString();
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c == '\n') {
      process_input(buffer)
      buffer = ""
    } else {
      buffer += c
    }
  }
})
process.stdin.resume()
function process_input(input) {
  console.log(parseSimpleMathExpression(input))
}
let X = 2
let Y = 5

const variableNamePattern = /^[a-zA-Z][a-zA-Z0-9]*$/;

// note: variable name also works to tokenize function name
function tokenize(input) {
  let tokens = [];
  let numMode, varMode = false;
  let buffer = "";
  for (let i =0; i < input.length; i++) {
    const c = input[i];
    if (c.match(/\s/)) { continue; // ignore whitespace
    } else if (c.match(/[a-zA-z]/)) {
        if (numMode) {
          throw Error("unexpected character while reading number");
        }
        varMode = true;
        buffer += c;
    } else if (c.match(/[0-9]/)) {
      if (varMode) {
        buffer += c; // varname
      } else {
        numMode = true;
        buffer += c; // digit
      }
    } else {
      if (varMode) {
        tokens.push(buffer);
      } else if (numMode) {
        tokens.push(parseInt(buffer));
      }
      varMode = false; numMode = false;
      buffer = "";
      tokens.push(c); // op or paren
    }
  }
      if (varMode) {
        tokens.push(buffer);
      } else if (numMode) {
        tokens.push(parseInt(buffer));
      }
  return tokens;
}

function hasHigherPrecedence(op, other) {
  if (op == "*" || op == "/") {
    return true;
  } else {
    return false;
  }
}
  
const top = (stack) => stack[stack.length - 1];

const functions = { // built-in functions
  "min" : (getArgs) => {
      const [A, B] = getArgs();
      return Math.min(A, B);
  }
}

// Parse a set of tokens as a simple arithmetic expression
// the result is an array of numbers and operators which
// express the same expression in reverse polish notation.
// Uses the shunting yard algorithm which will detect
// mismatched parentheses but may not reject all invalid
// expressions.
function parse(tokens) {
  // shunting yard
  const output = [];
  const ops = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (typeof t == "number") {
      output.push(t);
    } else if (Object.keys(functions).includes(t)) { // function name
      ops.push(t);
    } else if (t.match(variableNamePattern)) { // variable
      output.push(t);
    } else if (t.match(/(\+|\-|\*|\/)/)) { // op
      while (ops.length > 0 && top(ops) !== "(" && hasHigherPrecedence(top(ops), t)) {
        output.push(ops.pop())
      }
      ops.push(t)
    } else if (t == ",") {
      while (ops.length > 0 && top(ops) !== "(") {
        output.push(ops.pop());
      }
    } else if (t == "(") {
      ops.push(t)
    } else if (t == ")") {
      while (ops.length > 0 && top(ops) !== "(") {
        output.push(ops.pop());
      }
      if (ops.length == 0 && top(ops) !== "(") {
        throw Error("mismatched parentheses");
      }
      ops.pop();
    } else {
      throw Error(`unrecognized token: ${t}`);
    }
  }
  while (ops.length > 0) {
    if (top(ops) == "(" || top(ops) == ")") {
      throw Error("unexpected extra parenthesis");
    }
    output.push(ops.pop());
  }
  return output;
}

// evaluate and return the value of the expression which
// is in reverse polish form
function evaluate(expression) {
  const results = [];
  const operands = (count=2) => {
    if (results.length < count) {
      throw Error(`not enough operands`);
    }
    const opnds = [];
    while (opnds.length < count) {
      const value = results.pop();
      if (typeof value != "number") {
        throw error(`invalid operand: ${value}`);
      }
      opnds.push(value);
    }
    return opnds.reverse();
  }
  for (let i = 0; i < expression.length; i++) {
    const x = expression[i];
    if (typeof x == "number") {
      results.push(x);
    } else if (x.match(variableNamePattern)) {
      // evaluate function
      if (Object.keys(functions).includes(x)) {
        results.push(functions[x](operands));
      }

      // evaluate variable
      else if (x == "X") {
        results.push(X)
      } else if (x == "Y") {
        results.push(Y)
      } else {
        throw Error(`variable ${x} is not defined. must be X or Y`);
      }
    } else if (x == "+") {
      const [left, right] = operands();
      results.push(left + right);
    } else if (x == "-") {
      const [left, right] = operands();
      results.push(left - right);
    } else if (x == "*") {
      const [left, right] = operands();
      results.push(left * right);
    } else if (x == "/") {
      const [left, right] = operands();
      if (right == 0) {
        throw Error("division by zero");
      }
      results.push(left / right);
    }
  }
  if (results.length !== 1 || typeof top(results) !== "number") {
    throw Error("invalid expression");
  }
  return results.pop();
}


function parseSimpleMathExpression(input) {
  return evaluate(parse(tokenize(input)));
}


assert.equal(parseSimpleMathExpression("1 + 1"), 2)
assert.equal(parseSimpleMathExpression("X + 1"), 3)
assert.equal(parseSimpleMathExpression("X + Y"), 7)
assert.equal(parseSimpleMathExpression("(X+Y) / 2"), 3.5)
assert.equal(parseSimpleMathExpression("(X+Y) / 2 + 1"), 4.5)
assert.equal(parseSimpleMathExpression("1 + (X+Y) / 2"), 4.5)
assert.equal(parseSimpleMathExpression("X + Y/2"), 4.5)
assert.equal(parseSimpleMathExpression("1 + min(2,3)"), 3)

