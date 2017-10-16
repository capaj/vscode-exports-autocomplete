const disabledAstTokens = require('./disabled-ast-tokens')
const traverse = require('babel-traverse').default

module.exports = (tree, documentOffset) => {
  let currentNode
  let paramsNodes = []
  let attributeNamesNodes = []
  let propertyNodes = []
  try {
    traverse.cheap(tree.program, (node, parent) => {
      const { start, end, params, attributes, property, properties } = node
      if (start <= documentOffset && end >= documentOffset) {
        if (params) {
          paramsNodes = paramsNodes.concat(params)
        }
        if (attributes) {
          attributeNamesNodes = attributeNamesNodes.concat(
            attributes.map(({ name }) => name)
          )
        }
        if (property) {
          propertyNodes.push(property)
        }
        if (properties) {
          propertyNodes = propertyNodes.concat(properties.map(({ key }) => key))
        }
        currentNode = node
      }
    })
  } catch (err) {
    // current text in the editor might not be parseable, but this is not an error we'd need to throw outside of this function
  }
  if (!currentNode) {
    return false
  }
  if (disabledAstTokens.indexOf(currentNode.type) !== -1) {
    return false
  } else {
    if (
      paramsNodes.includes(currentNode) ||
      attributeNamesNodes.includes(currentNode) ||
      propertyNodes.includes(currentNode) // http://astexplorer.net/#/gist/3ad3d42f8c9d2407b9e0c72c058d3073/e17a86f80c7709659a30c7751b23df3bdceb3b9f
    ) {
      return false
    }
    return true
  }
}
