const path = require('path')
const os = require('os')
const projectExports = new Map()
const fs = require('mz/fs')
const { workspace } = require('vscode')
const mkdirp = require('mkdirp')
const mapJsonUtils = require('./map-json-utils')
const kis = require('keep-it-small')
const co = require('co')
const changedFiles = require('./git-changed-files')
const config = workspace.getConfiguration('vscode-exports-autocomplete')

function getCacheDir () {
  return path.join(os.homedir(), '.vscode', 'exports-autocomplete-cache')
}

function getCacheFilePath (sha) {
  return path.join(getCacheDir(), sha + '.json')
}

if (config.enable) {
  mkdirp.sync(getCacheDir())
  const cachePromise = kis(getCacheDir(), config.cacheSizeLimit)

  const walkAndParse = co.wrap(function * (sha) {
    const walker = require('./walker')

    yield walker()
    console.log(projectExports)
    if (sha && projectExports.size > 0) {
      const cachedJson = mapJsonUtils.mapToJson(projectExports)
      const cache = yield cachePromise
      yield cache.write(sha + '.json', cachedJson)
      console.log('saved exports for sha: ', sha)
    }
  })

  require('child_process').exec('git rev-parse HEAD', {
    cwd: workspace.rootPath
  }, function (err, sha) {
    sha = sha.replace('\n', '')
    if (!err) {
      fs.readFile(getCacheFilePath(sha)).then((cacheJson) => {
        const processFile = require('./process-file')

        JSON.parse(cacheJson).forEach((pair) => {
          projectExports.set(pair[0], pair[1])
        })
        console.log(`recovered ${projectExports.size} export records from cache ${sha}.json`)
        changedFiles(workspace.rootPath).then((changedFiles) => {
          changedFiles.forEach((file) => {
            fs.fstat(file).then((stats) => {
              if (stats.isFile()) {
                processFile(file)
              }
            }, () => {})
          })
        })
      }, () => {
        walkAndParse(sha)
      })
    } else {
      walkAndParse()
    }
  })
}

module.exports = {
  project: projectExports,
  dependencies: new Map()
}
