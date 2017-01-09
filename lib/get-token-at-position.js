const traverse = require('babel-traverse').default
const positionUtils = require('./position-utils')

module.exports = (tree, position) => {
  const babylonPos = positionUtils.vsCodeToBabylon(position)
  let currentToken
  let currentTokenLength = tree.program.end
  try {
    traverse.cheap(tree.program, (node) => {
      const {start, end} = node.loc
      if (start.line === babylonPos.line && start.column < babylonPos.column && end.column >= babylonPos.column) {
        const nodeLength = node.end - node.start
        if (nodeLength < currentTokenLength) {
          currentToken = node
          currentTokenLength = nodeLength
        }
      }
    })
  } catch (err) {
    // current text in the editor might not be parseable, but this is not an error we'd need to throw outside of this function
  }
  return currentToken
}
