const path = require('path')
const {
  // TextDocument,
  Position,
  CompletionItem,
  TextEdit } = require('vscode')

const exportsInProject = require('./exports-map')
const usesSemi = require('./uses-semi')
const countOccurences = require('./count-occurences')

class ExportersCompletionItemProvider {
  provideCompletionItems (document, position, token) {
    const editorText = document.getText()
    const line = document.lineAt(position.line)
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
          const maybeSemi = usesSemi(thisDocumentFileName) ? ';' : ''
          ci.documentation = relPath
          ci.filterText = ex.name
          ci.sortText = ex.name
          ci.insertText = ex.name

          let importToken = ex.name
          if (ex.exported !== 'default') {
            importToken = `{${ex.name}}`
          }
          if (line.text.startsWith('import')) {
            const importStatement = `import ${importToken} from '${relPath}'${maybeSemi}\n`
            ci.textEdit = TextEdit.replace(line.range, importStatement)
            ci.label = importToken + ` from ${relPath}`
            ci.filterText = importStatement
            ci.sortText = importStatement
          } else {
            ci.additionalTextEdits = [TextEdit.insert(positionForNewImport, `import ${importToken} from '${relPath}'${maybeSemi}\n`)]
          }
          ci.kind = 8
          completions.push(ci)
        })
      }
    })

    return completions
  }
}

module.exports = ExportersCompletionItemProvider
