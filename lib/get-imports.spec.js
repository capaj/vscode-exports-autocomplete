import test from 'ava'
import getImports from './get-imports'

test('get imports', t => {
  t.truthy(getImports.getImportDeclarations)
  t.truthy(getImports.getImportedTokens)
})
