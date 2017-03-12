const vscode = require('vscode')
const _ = require('lodash')
const { workspace, window } = vscode
const exportsMap = require('./exports-map')
const addImportStatement = require('./add-import-statement')

module.exports = () => {
  const {activeTextEditor} = window

  const {document} = activeTextEditor

  const currentDocument = {
    path: document.uri.path
  }

  return workspace.onDidChangeTextDocument((event) => {
    let newDocumentPath = event.document.uri.path
    if (newDocumentPath !== currentDocument.path) {
      currentDocument.path = newDocumentPath
      return
    }
    const documentText = event.document.getText()
    let {text} = event.contentChanges[0]
    if (text.length <= 2) {
      return
    }
    if (text.includes('import')) {
      return
    }
    const words = _.uniq(text.split(/\W+/)).filter((word) => {
      return word.length > 1
    })
    if (words.length === 0) {
      return
    }
    let previousText = documentText.replace(event.contentChanges[0].text, '')
    const allImportsNeeded = []
    const addImportIfNeeded = (file, exp) => {
      if (words.includes(exp.name) && !previousText.includes(exp.name)) {
        allImportsNeeded.push([exp, file])
        words.splice(words.indexOf(exp.name), 1)
      }
    }
    for (let [key, exps] of exportsMap.dependencies) {
      exps.forEach((exp) => {
        addImportIfNeeded(key, exp)
      })
    }

    for (let [key, exps] of exportsMap.project) {
      exps.forEach((exp) => {
        addImportIfNeeded(key, exp)
      })
    }
    // activeTextEditor.edit(editBuilder => {
    // allImportsNeeded.reduce((promise, pair) => {
    //   console.log(promise)
    //   return promise.then(() => {
    //     return addImportStatement(pair[0], pair[1])
    //   }, Promise.resolve(true))
    // })
    // })
    if (allImportsNeeded.length === 1) {  // this is very weird but editBuilder really does not work well so I have to split it like this
      addImportStatement(allImportsNeeded[0][0], allImportsNeeded[0][1])
    } else {
      activeTextEditor.edit(editBuilder => {
        allImportsNeeded.forEach((pair) => {
          addImportStatement(pair[0], pair[1], editBuilder)
        })
      }).then(() => {
        console.log('edits succes')
      }, (err) => {
        console.error('err', err)
      })
    }

    currentDocument.text = event.document.getText()
  })
}
