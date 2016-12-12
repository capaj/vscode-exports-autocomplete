// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode')
const {
  // TextDocument,
  Position,
  // CancellationToken,
  CompletionItem,
  workspace,
  TextEdit } = vscode

const getExportsFromFile = require('get-exports-from-file')
const walk = require('walk')
const path = require('path')
const exportsInProject = new Map()
const fs = require('fs')
let usesStandard = true

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
          ci.additionalTextEdits = [TextEdit.insert(new Position(0, 0), `import ${importToken} from '${relPath}'${lineEnding}`)]
          completions.push(ci)
        })
      }
    })

    return completions
  }
}

const walker = walk.walk(workspace.rootPath, {
  followLinks: false,
  filters: ['node_modules']
})
walker.on('file', (root, fileStats, next) => {
  const {name} = fileStats
  if (name.endsWith('.js') || name.endsWith('.jsx')) {
    const filePath = path.join(root, name)

    getExportsFromFile(filePath).then((exp) => {
      if (exp.length > 0) {
        exportsInProject.set(filePath, exp)
      }
      next()
    })
  } else {
    next()
  }
})

const jsWatcher = workspace.createFileSystemWatcher('**/*.js')
const jsxWatcher = workspace.createFileSystemWatcher('**/*.jsx')

const checkForNewExports = (file) => {
  getExportsFromFile(file.path).then((exp) => {
    if (exp.length > 0) {
      exportsInProject.set(file.path, exp)
    }
  })
}

function reactToWatcher (watcher) {
  watcher.onDidChange(checkForNewExports)
  watcher.onDidCreate(checkForNewExports)
  watcher.onDidDelete((file) => {
    exportsInProject.delete(file.path)
  })
}
reactToWatcher(jsWatcher)
reactToWatcher(jsxWatcher)

function activate (context) {
  const dispAutocomplete = vscode.languages.registerCompletionItemProvider(['javascript', 'javascriptreact'], new ExportersCompletionItemProvider())

  context.subscriptions.push(dispAutocomplete)
}

function deactivate () {
  jsWatcher.dispose()
  jsxWatcher.dispose()
}

module.exports = {
  activate,
  deactivate
}
