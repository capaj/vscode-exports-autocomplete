const vscode = require('vscode')
const path = require('path')
const {
  // TextDocument,
  Position,
  workspace,
  CompletionItem,
  TextEdit } = vscode

const exportsInProject = require('./exports-map')
let usesStandard = true
const countOccurences = require('./count-occurences')
const fs = require('fs')

fs.readFile(path.join(workspace.rootPath, 'package.json'), 'utf8', (err, pckgStr) => {
  if (err) {}
  const pckg = JSON.parse(pckgStr)
  if (!pckg.devDependencies.standard) {
    usesStandard = false
  }
})

class ExportersCompletionItemProvider {
  provideCompletionItems (document, position, token) {
    const editorText = document.getText()
    let positionForNewImport = new Position(0, 0)
    const lastImportIndex = editorText.lastIndexOf('\nimport ')
    if (lastImportIndex !== -1) {
      const importsCount = countOccurences(editorText.substr(0, lastImportIndex), '\n')
      positionForNewImport = new Position(importsCount + 2, 0)
    }
    const completions = []
    const thisDocumentFileName = document.fileName
    exportsInProject.forEach((fileExports, fileName) => {
      if (thisDocumentFileName !== fileName) {
        fileExports.forEach((ex) => {
          if (editorText.indexOf(ex.name) !== -1) {
            return
          }
          const ci = new CompletionItem(ex.name)
          let relPath = path.relative(path.dirname(thisDocumentFileName), fileName)
          const lastDot = relPath.lastIndexOf('.')
          relPath = relPath.substr(0, lastDot)
          if (relPath.indexOf('.') === -1) {
            relPath = './' + relPath
          }
          let lineEnding = '\n'
          if (!usesStandard) {
            lineEnding = ';\n'
          }
          let importToken = ex.name
          if (ex.exported !== 'default') {
            importToken = `{${ex.name}}`
          }
          ci.additionalTextEdits = [TextEdit.insert(positionForNewImport, `import ${importToken} from '${relPath}'${lineEnding}`)]
          completions.push(ci)
        })
      }
    })

    return completions
  }
}

module.exports = ExportersCompletionItemProvider
