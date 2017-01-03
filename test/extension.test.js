/* global suite, test */

//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
// const assert = require('assert')
const ext = require('../lib/extension')
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// var vscode = require('vscode')
// var myExtension = require('../extension')

suite('Extension Tests', function () {
  test('activates', function () {
    const contextFake = {
      subscriptions: []
    }
    ext.activate(contextFake)
  })
})
