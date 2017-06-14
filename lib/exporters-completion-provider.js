const path = require('path')
const lineHasOpenedStringLiteral = require('./line-has-opened-string-literal')
const os = require('os')
const camelCase = require('lodash.camelcase')
const platform = os.platform()

const {
  Position,
  Range,
  CompletionItem,
  TextEdit,
  workspace
} = require('vscode')

const config = workspace.getConfiguration('vscode-exports-autocomplete')
const exportsInProject = require('./exports-map')
const {
  getImportDeclarations,
  getImportedTokens
} = require('./get-imports')
const modifyImportStatement = require('./modify-import-statement')
const usesSemi = require('./uses-semi')
const shouldCompleteIdentifiers = require('./should-complete-identifiers')
const parse = require('./parse')

const makeCompletionItem = (ex, documentation) => {
  const ci = new CompletionItem(ex.name)
  ci.documentation = documentation
  if (ex.default === true) {
    ci.documentation += ` (default)`
  }
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
    const quoteChar = config.quoteCharOverride || "'"
    const editorText = document.getText()
    const line = document.lineAt(position.line)
    const {text: lineText} = line
    const isWritingAPropName = lineText.match(/\.\w+$/)

    if (lineHasOpenedStringLiteral(line) || isWritingAPropName) {
      return null
    }
    let editorAST
    let closeJSX = false
    try {
      editorAST = parse(editorText)
    } catch (err) {
      if (err.message.startsWith('Unexpected token ')) {
        try {
          editorAST = parse(editorText.replace(lineText, lineText + '/>')) // jsx elements produce an error if not closed
          closeJSX = true
        } catch (err) {
          return null
        }
      } else {
        return null
      }
    }
    const documentOffset = document.offsetAt(position)
    if (!shouldCompleteIdentifiers(editorAST, documentOffset)) {
      return null
    }
    let positionForNewImport = new Position(0, 0)
    const importASTNodes = getImportDeclarations(editorAST)
    const lastImportNode = importASTNodes[importASTNodes.length - 1]
    if (lastImportNode) {
      positionForNewImport = new Position(lastImportNode.loc.end.line, 0)
    }
    const completions = []
    const thisDocumentFileName = document.fileName
    let lineEnding = '\n'
    try {
      if (usesSemi(thisDocumentFileName)) {
        lineEnding = ';\n'
      }
    } catch (err) {
      // ignore these errors
    }
    const importedTokens = getImportedTokens(importASTNodes)
    const addImportStatementToCompletionItem = (ci, ex, importSource, importToken) => {
      const existingImportNode = importASTNodes.find((node) => {
        return node.source.value === importSource
      })
      if (existingImportNode) {
        const {newImportStatement, existingImportRange} = modifyImportStatement(ex, existingImportNode, document)
        const replace = TextEdit.replace(existingImportRange, newImportStatement)
        ci.additionalTextEdits = [replace]
      } else {
        ci.additionalTextEdits = [
          TextEdit.insert(positionForNewImport, `import ${importToken} from ${quoteChar}${importSource}${quoteChar}${lineEnding}`)
        ]
      }

      if (closeJSX) {
        setTextEditWithJSXClosing(position, ex.name, ci)
      }
    }

    exportsInProject.project.forEach((fileExports, fileName) => {
      if (thisDocumentFileName !== fileName) {
        fileExports.forEach((ex) => {
          if (importedTokens.includes(ex.name)) {
            return
          }
          let relPath = path.relative(path.dirname(thisDocumentFileName), fileName)
          const lastDot = relPath.lastIndexOf('.')
          relPath = relPath.substr(0, lastDot)
          if (relPath.indexOf('.') === -1) {
            relPath = './' + relPath
          }
          if (platform === 'win32') {
            relPath = relPath.replace(/\\/g, '/') // we don't want windows style paths
          }
          const ci = makeCompletionItem(ex, relPath)

          let importToken = ex.name
          if (ex.default !== true) {
            importToken = `{${ex.name}}`
          }
          if (line.text.startsWith('import')) {
            const importStatement = `import ${importToken} from ${quoteChar}${relPath}${quoteChar}${lineEnding}`
            ci.textEdit = TextEdit.replace(line.range, importStatement)
            ci.label = importToken + ` from ${relPath}`
            ci.filterText = importStatement
            ci.sortText = importStatement
          } else {
            addImportStatementToCompletionItem(ci, ex, relPath, importToken)
          }
          ci.kind = 8
          completions.push(ci)
        })
      }
    })

    exportsInProject.dependencies.forEach((dependencyExports, depName) => {
      let hasDefault = false
      const processExport = (ex) => {
        if (importedTokens.includes(ex.name)) {
          return null
        }
        const ci = makeCompletionItem(ex, depName)

        let importToken = ex.name
        if (ex.default === true) {
          ci.detail = 'package.json'
          hasDefault = true
        } else {
          importToken = `{${ex.name}}`
        }
        if (line.text.startsWith('import')) {
          const importStatement = `import ${importToken} from ${quoteChar}${depName}${quoteChar}${lineEnding}`
          ci.textEdit = TextEdit.replace(line.range, importStatement)
          ci.label = importToken + ` from ${depName}`
          ci.filterText = importStatement
          ci.sortText = importStatement
        } else {
          addImportStatementToCompletionItem(ci, ex, depName, importToken)
        }
        ci.kind = 8
        completions.push(ci)
      }
      dependencyExports.forEach(processExport)
      if (!hasDefault && dependencyExports.cjs) {
        processExport({name: camelCase(depName), default: true})
      }
    })

    return completions
  }
}

module.exports = ExportersCompletionItemProvider
