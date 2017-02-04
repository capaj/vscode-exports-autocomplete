const path = require('path')
const vscode = require('vscode')
const { workspace } = vscode
const fs = require('mz/fs')
const getExportsFromFile = require('get-exports-from-file')
const exportsMap = require('./exports-map')
const ExportersCompletionItemProvider = require('./exporters-completion-provider')
const config = workspace.getConfiguration('vscode-exports-autocomplete')

const checkForNewExports = (file) => {
  const path = file.path.replace('.min.js', '.js')

  getExportsFromFile.es6(path).then(({exported}) => {
    if (exported.length > 0) {
      exportsMap.project.set(path, exported)
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
  if (!config.enable) {
    return
  }
  reactToWatcher(jsWatcher)
  reactToWatcher(jsxWatcher)
  if (workspace.rootPath) {
    fs.readFile(path.join(workspace.rootPath, 'package.json'), 'utf8').then((pckgJsonString) => {
      const pckgJson = JSON.parse(pckgJsonString)
      const readPckgJsonAndGetExports = (dep) => {
        const depPath = path.join(workspace.rootPath, '/node_modules', dep)
        return fs.readFile(path.join(depPath, 'package.json'), 'utf8').then((pckgJsonString) => {
          const pckgJson = JSON.parse(pckgJsonString)
          if (pckgJson.module) {
            const modulePath = path.join(depPath, pckgJson.module)
            getExportsFromFile.es6(modulePath).then(({exported}) => {
              exportsMap.dependencies.set(dep, exported)
            })
          } else {
            const main = pckgJson.main || 'index.js'
            const modulePath = path.join(depPath, main)
            getExportsFromFile.cjs(modulePath).then(({exported}) => {
              exportsMap.dependencies.set(dep, exported)
            })
          }
        }).catch((err) => {
          if (err.code !== 'ENOENT') {
            throw err
          }
        })
      }
      if (pckgJson.dependencies && config.enableNpmDependencies) {
        Object.keys(pckgJson.dependencies).forEach(readPckgJsonAndGetExports)
      }
      // if (pckgJson.devDependencies) {
      //   Object.keys(pckgJson.devDependencies).forEach(readPckgJsonAndGetExports)
      // }
    }, (err) => { //eslint-disable-line
      console.error(err)
    })
  }

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
