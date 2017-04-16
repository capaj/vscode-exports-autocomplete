const disabledAstTokens = require('./disabled-ast-tokens')
const traverse = require('babel-traverse').default

module.exports = (tree, documentOffset) => {
  let currentNode
  let paramsNodes = []
  try {
    traverse.cheap(tree.program, (node) => {
      const {start, end, params} = node
      if (params) {
        paramsNodes = paramsNodes.concat(params)
      }
      if (start <= documentOffset && end >= documentOffset) {
        currentNode = node
      }
    })
  } catch (err) {
    // current text in the editor might not be parseable, but this is not an error we'd need to throw outside of this function
  }

  if (disabledAstTokens.indexOf(currentNode.type) !== -1) {
    return false
  } else {
    if (paramsNodes.includes(currentNode)) {
      return false
    }
    return true
  }
}
