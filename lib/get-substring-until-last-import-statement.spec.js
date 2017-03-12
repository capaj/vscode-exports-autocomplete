import getSubstringUntilLastImportStatement from './get-substring-until-last-import-statement'
import fs from 'fs'
import test from 'ava'

test('', t => {
  const fixture = fs.readFileSync('test/fixtures/some-file-with-imports.js', 'utf8')

  t.is(getSubstringUntilLastImportStatement(fixture).indexOf('console.log'), -1)
})

