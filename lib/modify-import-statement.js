const {
  babylonToVsCode
} = require('./position-utils')
const {
  Range,
  workspace
} = require('vscode')

const config = workspace.getConfiguration('vscode-exports-autocomplete')

module.exports = (ex, existingImportNode, document) => {
  const start = babylonToVsCode(existingImportNode.loc.start)
  const end = babylonToVsCode(existingImportNode.loc.end)
  const existingImportRange = new Range(start, end)
  const existingImport = document.getText(existingImportRange)
  let newImportStatement
  if (ex.default === true) {
    newImportStatement = existingImport.replace('{', `${ex.name}, {`)
  } else {
    if (existingImport.includes('}')) {
      if (existingImport.includes('\n}')) {
        const editorText = document.getText()

        let indentation = editorText.includes('\t') ? '\t' : '  '
        if (config.indentationOverride) {
          indentation = config.indentationOverride
        }
        newImportStatement = existingImport.replace('\n}', `, \n${indentation}${ex.name}\n}`)
      } else {
        newImportStatement = existingImport.replace('}', `, ${ex.name}}`)
      }
    } else {
      newImportStatement = existingImport.replace(' from ', `, {${ex.name}} from `)
    }
  }
  return {newImportStatement, existingImportRange}
}
