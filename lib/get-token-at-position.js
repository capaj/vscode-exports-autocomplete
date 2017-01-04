const traverse = require('babel-traverse').default
const positionUtils = require('./position-utils')

module.exports = (tree, position) => {
  const babylonPos = positionUtils.vsCodeToBabylon(position)
  let currentToken
  try {
    traverse.cheap(tree.program, (node) => {
      const {start, end} = node.loc
      if (start.line === babylonPos.line && start.column < babylonPos.column && end.column > babylonPos.column) {
        currentToken = node
      }
    })
  } catch (err) {
    // current text in the editor might not be parseable, but this is not an error we'd need to throw outside of this function
  }
  return currentToken
}
