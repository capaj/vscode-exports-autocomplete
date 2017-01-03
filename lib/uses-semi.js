const path = require('path')
const { workspace } = require('vscode')
const fs = require('fs')

let usesStandard = true
let eslintCLI = null
if (workspace.rootPath) {
  fs.readFile(path.join(workspace.rootPath, 'package.json'), 'utf8', (err, pckgStr) => {
    if (err) return
    const pckg = JSON.parse(pckgStr)
    const { standard, eslint } = pckg.devDependencies

    usesStandard = !!standard

    if (eslint) initCLI()
  })
}

function initCLI () {
  try {
    const { CLIEngine } = require('eslint')
    eslintCLI = new CLIEngine()
  } catch (e) {}
}

module.exports = function usesSemi (path) {
  if (usesStandard) return false // we know
  if (!eslintCLI) return true // we can’t know and assume

  // else we find out!
  try {
    const { rules } = eslintCLI.getConfigForFile(path)
    if (!Array.isArray(rules.semi)) return true
    const choice = rules.semi[1]  // [0] is the level and irrelevant
    return choice === 'always'
  } catch (e) {
    return true  // back to assumption
  }
}
