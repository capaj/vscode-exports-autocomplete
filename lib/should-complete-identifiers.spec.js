import test from 'ava'
import mock from 'mock-require'
import parse from './parse'
import fs from 'fs'

function Position (line, column) {
  this.line = line
  this.column = column
}

mock('vscode', {
  Position: Position
})

test('gets the right element', t => {
  const src = fs.readFileSync('test/fixtures/sample-jsx.js', 'utf8')
  const tree = parse(src)
  const shouldComplete = require('./should-complete-identifiers')
  t.is(shouldComplete(tree, 18), false)
  t.is(shouldComplete(tree, 35), true)

  t.is(shouldComplete(tree, 52), true)

  t.is(shouldComplete(tree, 51), true)
})
