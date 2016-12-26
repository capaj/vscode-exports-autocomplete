const importType = 'ImportDeclaration'

module.exports = (tree) => {
  const {body} = tree.program
  for (var index = 0; index < body.length; index++) {
    const node = body[index]
    const nextNode = body[index + 1]
    const {type} = node
    if (type === importType && nextNode.type !== importType) {
      return node
    }
  }
}
