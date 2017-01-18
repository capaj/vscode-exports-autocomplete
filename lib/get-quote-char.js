const styleInfo = require('./style-info')

const quotes = {
  single: "'",
  double: '"',
  backtick: '`'
}

module.exports = function getQuoteChar (path) {
  const { usesStandard, rules } = styleInfo(path)
  if (usesStandard || !rules) return "'"

  return quotes[rules.quotes[1]] || "'"
}
