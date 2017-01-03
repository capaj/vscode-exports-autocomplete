const countOccurences = require('./count-occurences')

const tokens = ["'", '"', '`']

module.exports = (str) => {
  const counts = tokens.map((token) => {
    return countOccurences(str, token)
  })
  return !!counts.find((count) => {
    if (count === 0) {
      return false
    }
    return count % 2
  })
}
