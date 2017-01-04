/* global test */
const positionUtils = require('../lib/position-utils')
const assert = require('assert')
const {Position} = require('vscode')

test('converts positions', function () {
  const vsCodePosition = positionUtils.babylonToVsCode({
    line: 5,
    column: 3
  })
  assert.deepEqual(vsCodePosition, {
    '_character': 3,
    '_line': 4
  })
  assert(vsCodePosition.character === 3)
  assert(vsCodePosition.line === 4)
  assert.deepEqual(positionUtils.vsCodeToBabylon(new Position(4, 6)), {
    column: 6,
    line: 5
  })
})

