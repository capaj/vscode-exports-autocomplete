const path = require('path')
const os = require('os')
const projectExports = new Map()
const fs = require('mz/fs')
const { workspace } = require('vscode')
const mkdirp = require('mkdirp')
const mapJsonUtils = require('./map-json-utils')

function getCacheDir () {
  return path.join(os.homedir(), '.vscode', 'exports-autocomplete-cache')
}

function getCacheFilePath (sha) {
  return path.join(getCacheDir(), sha + '.json')
}

function walkAndParse (sha) {
  const walker = require('./walker')

  walker().then(() => {
    if (sha) {
      const cachedJson = mapJsonUtils.mapToJson(projectExports)
      mkdirp.sync(getCacheDir())
      return fs.writeFile(getCacheFilePath(sha), cachedJson).then(() => {
        console.log('saved exports for sha: ', sha)
      }, (err) => console.error(err))
    }
  })
}

require('child_process').exec('git rev-parse HEAD', {
  cwd: workspace.rootPath
}, function (err, sha) {
  if (!err) {
    fs.readFile(getCacheFilePath(sha)).then((cacheJson) => {
      JSON.parse(cacheJson).forEach((pair) => {
        projectExports.set(pair[0], pair[1])
      })
      console.log(`recovered ${projectExports.size} export records from cache ${sha}.json`)
    }, () => {
      walkAndParse(sha)
    })
  } else {
    walkAndParse()
  }
})

module.exports = {
  project: projectExports,
  dependencies: new Map()
}
