const babylon = require('babylon')

module.exports = (text) => {
  return babylon.parse(text, {
    sourceType: 'module',
    plugins: ['*']
  })
}
