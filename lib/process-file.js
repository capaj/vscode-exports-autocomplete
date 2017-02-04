const getExportsFromFile = require('get-exports-from-file')
const exportsMap = require('./exports-map')
const path = require('path')

module.exports = (absPath) => {
  const ext = path.extname(absPath)
  const pathToNonMinified = absPath.replace('.min.js', '.js')
  if (ext === '.js' || ext === '.jsx') {
    return getExportsFromFile.es6(pathToNonMinified).then(({exported}) => {
      if (exported.length > 0) {
        exportsMap.project.set(absPath, exported)
      }
    }, (err) => {
      console.warning(`Failed to parse ${pathToNonMinified}, error:`, err)
    })
  }
}
