const klaw = require('klaw')
const path = require('path')
const vscode = require('vscode')
const { workspace } = vscode
const fs = require('mz/fs')
const getExportsFromFile = require('get-exports-from-file')

const exportsMap = require('./exports-map')
const ExportersCompletionItemProvider = require('./exporters-completion-provider')

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
    if (basename.endsWith('.min.js')) {
      return
    }
    if (ext === '.js' || ext === '.jsx') {
      parsingPromises.push(getExportsFromFile(absPath).then((exp) => {
        if (exp.length > 0) {
          exportsMap.project.set(absPath, exp)
        }
      }))
    }
  })
  .on('end', () => {
    Promise.all(parsingPromises).then(() => {
      console.log(`found ${exportsMap.project.size} files with exports`)
    })
  })

const checkForNewExports = (file) => {
  if (file.path.endsWith('.min.js')) {
    return // minified files are of no use to us
  }
  getExportsFromFile(file.path).then((exp) => {
    if (exp.length > 0) {
      exportsMap.project.set(file.path, exp)
    }
  })
}

function reactToWatcher (watcher) {
  watcher.onDidChange(checkForNewExports)
  watcher.onDidCreate(checkForNewExports)
  watcher.onDidDelete((file) => {
    exportsMap.project.delete(file.path)
  })
}

const jsWatcher = workspace.createFileSystemWatcher('**/*.js')
const jsxWatcher = workspace.createFileSystemWatcher('**/*.jsx')
function activate (context) {
  reactToWatcher(jsWatcher)
  reactToWatcher(jsxWatcher)

  fs.readFile(path.join(workspace.rootPath, 'package.json'), 'utf8').then((pckgJsonString) => {
    const pckgJson = JSON.parse(pckgJsonString)
    const readPckgJsonAndGetExports = (dep) => {
      const depPath = path.join(workspace.rootPath, '/node_modules', dep)
      return fs.readFile(path.join(depPath, 'package.json'), 'utf8').then((pckgJsonString) => {
        const pckgJson = JSON.parse(pckgJsonString)
        if (pckgJson.module) {
          const modulePath = path.join(depPath, pckgJson.module || pckgJson['jsnext:main'])
          getExportsFromFile(modulePath).then((exports) => {
            exportsMap.dependencies.set(dep, exports)
          })
        }
      })
    }
    if (pckgJson.dependencies) {
      Object.keys(pckgJson.dependencies).forEach(readPckgJsonAndGetExports)
    }
    if (pckgJson.devDependencies) {
      Object.keys(pckgJson.devDependencies).forEach(readPckgJsonAndGetExports)
    }
  }, (err) => { //eslint-disable-line
    // console.error(err)
  })

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
