module.exports = {
  mapToJson (map) {
    return JSON.stringify([...map])
  },
  jsonToMap (jsonStr) {
    return new Map(JSON.parse(jsonStr))
  }
}
