const styleInfo = require('./style-info')

module.exports = function usesSemi (path) {
  const { usesStandard, rules } = styleInfo(path)
  if (usesStandard) return false // we know
  if (!rules) return true // we can’t know and assume

  // else we find out!
  try {
    if (!Array.isArray(rules.semi)) return true
    const choice = rules.semi[1]  // [0] is the level and irrelevant
    return choice === 'always'
  } catch (e) {
    return true  // back to assumption
  }
}
