const path = require('path')

const {
  // TextDocument,
  Position,
  CompletionItem,
  TextEdit } = require('vscode')

const exportsInProject = require('./exports-map')
const getLastImport = require('./get-last-import')
const usesSemi = require('./uses-semi')

const getTokenAtPosition = require('./get-token-at-position')
const parse = require('./parse')
const disabledTokens = [
  'StringLiteral',
  'TemplateLiteral'
]

const makeCompletionItem = (ex, documentation) => {
  const ci = new CompletionItem(ex.name)
  ci.documentation = documentation
  ci.filterText = ex.name
  ci.sortText = ex.name
  ci.insertText = ex.name
  return ci
}

class ExportersCompletionItemProvider {
  provideCompletionItems (document, position, token) {
    const editorText = document.getText()
    const editorAST = parse(editorText)

    const currentNode = getTokenAtPosition(editorAST, position)
    if (currentNode && disabledTokens.indexOf(currentNode.type) !== -1) {
      return []
    }
    const line = document.lineAt(position.line)
    let positionForNewImport = new Position(0, 0)
    const lastImportNode = getLastImport(editorAST)
    if (lastImportNode) {
      positionForNewImport = new Position(lastImportNode.loc.end.line, 0)
    }
    const completions = []
    const thisDocumentFileName = document.fileName

    exportsInProject.project.forEach((fileExports, fileName) => {
      if (thisDocumentFileName !== fileName) {
        fileExports.forEach((ex) => {
          if (editorText.indexOf(ex.name) !== -1) {
            return
          }
          let relPath = path.relative(path.dirname(thisDocumentFileName), fileName)
          const lastDot = relPath.lastIndexOf('.')
          relPath = relPath.substr(0, lastDot)
          if (relPath.indexOf('.') === -1) {
            relPath = './' + relPath
          }
          const ci = makeCompletionItem(ex, relPath)
          const maybeSemi = usesSemi(thisDocumentFileName) ? ';' : ''

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

    exportsInProject.dependencies.forEach((dependencyExports, depName) => {
      dependencyExports.forEach((ex) => {
        if (editorText.indexOf(ex.name) !== -1) {
          return
        }
        const ci = makeCompletionItem(ex, depName)
        const maybeSemi = usesSemi(thisDocumentFileName) ? ';' : ''

        let importToken = ex.name
        if (ex.exported !== 'default') {
          importToken = `{${ex.name}}`
        }
        if (line.text.startsWith('import')) {
          const importStatement = `import ${importToken} from '${depName}'${maybeSemi}\n`
          ci.textEdit = TextEdit.replace(line.range, importStatement)
          ci.label = importToken + ` from ${depName}`
          ci.filterText = importStatement
          ci.sortText = importStatement
        } else {
          ci.additionalTextEdits = [TextEdit.insert(positionForNewImport, `import ${importToken} from '${depName}'${maybeSemi}\n`)]
        }
        ci.kind = 8
        completions.push(ci)
      })
    })

    return completions
  }
}

module.exports = ExportersCompletionItemProvider
