import test from 'ava'
import lineHasOpenedStringLiteral from './line-has-opened-string-literal'

test('lineHasOpenedStringLiteral', t => {
  t.is(lineHasOpenedStringLiteral('          <F'), false)
  t.is(lineHasOpenedStringLiteral('          <F></F>'), false)
  t.is(lineHasOpenedStringLiteral('          <F prop="></F>'), true)
  t.is(lineHasOpenedStringLiteral('          "F'), true)
  t.is(lineHasOpenedStringLiteral("          'F"), true)
  t.is(lineHasOpenedStringLiteral("          'F'"), false)
  t.is(lineHasOpenedStringLiteral('          "F"'), false)
})
