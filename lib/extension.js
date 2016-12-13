const vscode = require('vscode')
const { workspace } = vscode

const getExportsFromFile = require('get-exports-from-file')
const walk = require('walk')
const path = require('path')
const exportsInProject = require('./exports-map')
const ExportersCompletionItemProvider = require('./exporters-completion-provider')

const walker = walk.walk(workspace.rootPath, {
  followLinks: false,
  filters: ['node_modules']
})
walker.on('file', (root, fileStats, next) => {
  const {name} = fileStats
  if (name.endsWith('.min.js')) {
    return next() // minified files are of no use to us
  }
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
