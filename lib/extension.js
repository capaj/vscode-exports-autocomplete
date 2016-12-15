const vscode = require('vscode')
const { workspace } = vscode

const getExportsFromFile = require('get-exports-from-file')

const path = require('path')
const exportsInProject = require('./exports-map')
const ExportersCompletionItemProvider = require('./exporters-completion-provider')
const klaw = require('klaw')

const filterFunc = (absPath) => {
  const basename = path.basename(absPath)
  if (absPath.indexOf('node_modules') !== -1) {
    return false
  }
  return basename === '.' || basename[0] !== '.'
}

const parsingPromises = []

klaw(workspace.rootPath, { filter: filterFunc })
  .on('data', (item) => {
    const absPath = item.path
    const ext = path.extname(absPath)
    const basename = path.basename(absPath)
    console.log(basename)
    if (basename.endsWith('.min.js')) {
      return
    }
    if (ext === '.js' || ext === '.jsx') {
      parsingPromises.push(getExportsFromFile(absPath).then((exp) => {
        if (exp.length > 0) {
          exportsInProject.set(absPath, exp)
        }
      }))
    }
  })
  .on('end', () => {
    Promise.all(parsingPromises).then(() => {
      console.log(`found ${exportsInProject.size} files with exports`)
    })
  })

const jsWatcher = workspace.createFileSystemWatcher('**/*.js')
const jsxWatcher = workspace.createFileSystemWatcher('**/*.jsx')

const checkForNewExports = (file) => {
  if (file.path.endsWith('.min.js')) {
    return // minified files are of no use to us
  }
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
