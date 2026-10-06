'use strict';

// These safety ceilings cannot be raised or disabled through caller options.
const MAX_DEPTH = 64;
const MAX_NODES = 20000;
const MAX_RESULTS = 10000;
const MAX_OUTPUT_LENGTH = 1024 * 1024;

const fail = () => {
  const error = new RangeError('Brace pattern exceeds the fixed safe complexity limit');
  error.code = 'BRACES_COMPLEXITY_LIMIT';
  throw error;
};

const assertAst = ast => {
  const stack = [{ node: ast, depth: 0 }];
  const seen = new WeakSet();
  let nodes = 0;
  let textLength = 0;
  while (stack.length) {
    const { node, depth } = stack.pop();
    if (!node || typeof node !== 'object' || seen.has(node) || depth > MAX_DEPTH || ++nodes > MAX_NODES) fail();
    seen.add(node);
    if (node.value !== undefined) {
      if (typeof node.value !== 'string' || (textLength += node.value.length) > MAX_OUTPUT_LENGTH) fail();
    }
    // The upstream expander follows parent links in addition to child nodes.
    const parents = new WeakSet();
    let parent = node.parent;
    let parentDepth = 0;
    while (parent) {
      if (typeof parent !== 'object' || parents.has(parent) || ++parentDepth > MAX_DEPTH) fail();
      parents.add(parent);
      parent = parent.parent;
    }
    if (node.nodes !== undefined) {
      if (!Array.isArray(node.nodes) || node.nodes.length > MAX_NODES || stack.length + node.nodes.length > MAX_NODES) fail();
      for (let index = node.nodes.length - 1; index >= 0; index--) stack.push({ node: node.nodes[index], depth: depth + 1 });
    }
  }
};

const assertOutput = output => {
  const values = Array.isArray(output) ? output : [output];
  if (values.length > MAX_RESULTS) fail();
  let length = 0;
  for (const value of values) if ((length += String(value).length) > MAX_OUTPUT_LENGTH) fail();
};

const assertRange = (args, stepOption, compressed = false) => {
  if (args.length < 2) return;
  const numeric = value => value !== '' && Number.isFinite(Number(value));
  const numbers = numeric(args[0]) && numeric(args[1]);
  if (!numbers && (String(args[0]).length !== 1 || String(args[1]).length !== 1)) return;
  const start = numbers ? Number(args[0]) : String(args[0]).charCodeAt(0);
  const end = numbers ? Number(args[1]) : String(args[1]).charCodeAt(0);
  if (numbers && (!Number.isSafeInteger(start) || !Number.isSafeInteger(end))) fail();
  const step = Math.abs(Number(args[2] === undefined ? stepOption === undefined ? 1 : stepOption : args[2])) || 1;
  if (!Number.isFinite(step)) fail();
  if (!(compressed && step === 1) && Math.floor(Math.abs(end - start) / step) + 1 > MAX_RESULTS) fail();
};

module.exports = { MAX_DEPTH, MAX_NODES, MAX_RESULTS, MAX_OUTPUT_LENGTH, fail, assertAst, assertOutput, assertRange };
