import test from 'ava'
import getImports from './get-imports'

test('get imports', t => {
  t.truthy(getImports.getDeclarations)
  t.truthy(getImports.getImportedTokens)
})
