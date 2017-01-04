const {Position} = require('vscode')

module.exports = {
  babylonToVsCode (position) {
    return new Position(position.line - 1, position.column)
  },
  vsCodeToBabylon (position) {
    return {
      line: position.line + 1, // unlike VSCode, babel has lines starting from 1, not 0
      column: position.character
    }
  }
}
