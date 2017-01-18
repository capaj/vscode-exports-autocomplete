const path = require('path')
const { workspace } = require('vscode')
const fs = require('mz/fs')

let usesStandard = true
let eslintCLI = null

const styleInfoPromise = !workspace.rootPath
  ? Promise.resolve()
  : fs.readFile(path.join(workspace.rootPath, 'package.json'), 'utf8')
    .then(JSON.parse)
    .then((pckg) => {
      const { standard, eslint } = pckg.devDependencies || {}

      usesStandard = !!standard
      if (eslint) eslintCLI = getCLI()
    })

function getCLI () {
  try {
    const { CLIEngine } = require('eslint')
    return new CLIEngine()
  } catch (e) {
    console.warn(e)
    return null
  }
}

// only call this after styleInfo.promise resolved
function styleInfo (path) {
  let rules = null
  if (eslintCLI) {
    rules = eslintCLI.getConfigForFile(path).rules
  }
  return { usesStandard, rules }
}
styleInfo.promise = styleInfoPromise // immediately available

module.exports = styleInfo
