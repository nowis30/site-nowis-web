'use strict';

const utils = require('./utils');
const limits = require('./limits');

module.exports = (ast, options = {}) => {
  limits.assertAst(ast);
  const stringify = (node, parent = {}) => {
    const invalidBlock = options.escapeInvalid && utils.isInvalidBrace(parent);
    const invalidNode = node.invalid === true && options.escapeInvalid === true;
    let output = '';

    if (node.value) {
      if ((invalidBlock || invalidNode) && utils.isOpenOrClose(node)) {
        return '\\' + node.value;
      }
      return node.value;
    }

    if (node.value) {
      return node.value;
    }

    if (node.nodes) {
      for (const child of node.nodes) {
        output += stringify(child);
        if (output.length > limits.MAX_OUTPUT_LENGTH) limits.fail();
      }
    }
    return output;
  };

  return stringify(ast);
};

