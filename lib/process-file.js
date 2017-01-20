const getExportsFromFile = require('get-exports-from-file')
const exportsMap = require('./exports-map')
const path = require('path')

module.exports = (absPath) => {
  const ext = path.extname(absPath)
  const basename = path.basename(absPath)
  if (basename.endsWith('.min.js')) {
    return
  }
  if (ext === '.js' || ext === '.jsx') {
    return getExportsFromFile(absPath).then((exp) => {
      if (exp.length > 0) {
        exportsMap.project.set(absPath, exp)
      }
    })
  }
}
