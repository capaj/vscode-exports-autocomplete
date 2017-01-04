const importType = 'ImportDeclaration'

module.exports = {
  getDeclarations (tree) {
    const {body} = tree.program
    return body.filter((node) => node.type === importType)
  },
  getImportedTokens (importDeclarations) {
    const tokens = []
    importDeclarations.forEach((declaration) => {
      declaration.specifiers.forEach((specifier) => {
        if (specifier.imported) {
          tokens.push(specifier.imported.name)
        } else {
          tokens.push(specifier.local.name)
        }
      })
    })
    return tokens
  }
}
