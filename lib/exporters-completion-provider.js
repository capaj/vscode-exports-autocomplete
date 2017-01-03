const path = require('path')
const lineHasOpenedStringLiteral = require('./line-has-opened-string-literal')

const {
  // TextDocument,
  Position,
  Range,
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

function setTextEditWithJSXClosing (position, exportName, ci) {
  const closePosition = new Position(position.line, position.character + ci.insertText.length)
  const beginPosition = new Position(position.line, position.character - 1)
  ci.textEdit = TextEdit.replace(new Range(beginPosition, closePosition), `${exportName} />`)
}

class ExportersCompletionItemProvider {
  provideCompletionItems (document, position, token) {
    let editorText = document.getText()
    const line = document.lineAt(position.line)
    if (lineHasOpenedStringLiteral(line)) {
      return null
    }
    let editorAST
    let closeJSX = false
    try {
      editorAST = parse(editorText)
    } catch (err) {
      if (err.message.startsWith('Unexpected token ')) {
        try {
          editorAST = parse(editorText.replace(line.text, line.text + '/>'))  // jsx elements produce an error if not closed
          closeJSX = true
        } catch (err) {
          return null
        }
      } else {
        return null
      }
    }

    const currentNode = getTokenAtPosition(editorAST, position)
    if (currentNode && disabledTokens.indexOf(currentNode.type) !== -1) {
      return null
    }
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
            ci.additionalTextEdits = [
              TextEdit.insert(positionForNewImport, `import ${importToken} from '${relPath}'${maybeSemi}\n`)
            ]

            if (closeJSX) {
              setTextEditWithJSXClosing(position, ex.name, ci)
            }
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

          if (closeJSX) {
            setTextEditWithJSXClosing(position, ex.name, ci)
          }
        }
        ci.kind = 8
        completions.push(ci)
      })
    })

    return completions
  }
}

module.exports = ExportersCompletionItemProvider
