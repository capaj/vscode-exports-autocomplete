const babylon = require('babylon')
const traverse = require('babel-traverse').default

module.exports = (text, position) => {
  const babylonPos = {
    line: position.line + 1, // unlike VSCode, babel has lines starting from 1, not 0
    column: position.character
  }
  const tree = babylon.parse(text, {
    sourceType: 'module',
    plugins: ['*']
  })
  let currentToken
  traverse.cheap(tree.program, (node) => {
    const {start, end} = node.loc
    if (start.line === babylonPos.line && start.column < babylonPos.column && end.column > babylonPos.column) {
      currentToken = node
    }
  })
  return currentToken
}
