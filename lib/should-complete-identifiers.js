const disabledAstTokens = require('./disabled-ast-tokens')
const traverse = require('babel-traverse').default

module.exports = (tree, documentOffset) => {
  let currentNode
  let paramsNodes = []
  let attributeNamesNodes = []
  try {
    traverse.cheap(tree.program, (node) => {
      const {start, end, params, attributes} = node
      if (start <= documentOffset && end >= documentOffset) {
        if (params) {
          paramsNodes = paramsNodes.concat(params)
        }
        if (attributes) {
          attributeNamesNodes = attributeNamesNodes.concat(attributes.map(({name}) => name))
        }
        currentNode = node
      }
    })
  } catch (err) {
    // current text in the editor might not be parseable, but this is not an error we'd need to throw outside of this function
  }

  if (disabledAstTokens.indexOf(currentNode.type) !== -1) {
    return false
  } else {
    if (paramsNodes.includes(currentNode) || attributeNamesNodes.includes(currentNode)) {
      return false
    }
    return true
  }
}
