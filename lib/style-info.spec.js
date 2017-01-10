import test from 'ava'
import mock from 'mock-require'

async function getMockedStyleInfo (pkg) {
  const rootPath = `${__dirname}/../test/fixtures/style-info-pkgs/${pkg}`
  mock('vscode', { workspace: { rootPath } })
  const styleInfo = mock.reRequire('./style-info')
  await styleInfo.promise
  return styleInfo(`${rootPath}/test.js`)  // file doesn’t need to exist
}

test.afterEach(() => mock.stopAll())

test('defaults to no rules and no standard', async t => {
  const { usesStandard, rules } = await getMockedStyleInfo('nothing')
  t.false(usesStandard)
  t.deepEqual(rules, null)
})

test('uses standard', async t => {
  const { usesStandard, rules } = await getMockedStyleInfo('standard')
  t.true(usesStandard)
  t.deepEqual(rules, null)
})

test('uses eslint', async t => {
  const { usesStandard, rules } = await getMockedStyleInfo('eslint')
  t.false(usesStandard)
  t.is(rules.semi, 'error')
})
