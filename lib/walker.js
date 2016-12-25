const klaw = require('klaw')
const path = require('path')
const getExportsFromFile = require('get-exports-from-file')

const { workspace } = require('vscode')
const exportsMap = require('./exports-map')

const filterFunc = (absPath) => {
  const basename = path.basename(absPath)
  if (absPath.indexOf('node_modules') !== -1) {
    return false
  }
  return basename === '.' || basename[0] !== '.'
}

module.exports = () => {
  return new Promise((resolve, reject) => {
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
          resolve()
          return exportsMap
        })
      })
  })
}
