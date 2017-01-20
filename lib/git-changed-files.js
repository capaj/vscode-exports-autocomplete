const { git } = require('jest-changed-files')

module.exports = function changedFiles (dir) {
  return git.isGitRepository(dir).then((gitRoot) => {
    if (gitRoot !== null) {
      return git.findChangedFiles(gitRoot, {})
    }
  })
}
