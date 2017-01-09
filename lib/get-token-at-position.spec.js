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
  const getTokenAtPosition = require('./get-token-at-position')
  t.is(getTokenAtPosition(tree, {
    character: 31,
    line: 0
  }).type, 'JSXIdentifier')

  t.is(getTokenAtPosition(tree, {
    character: 48,
    line: 0
  }).type, 'JSXOpeningElement')

  t.is(getTokenAtPosition(tree, {
    character: 47,
    line: 0
  }).type, 'JSXAttribute')
})
