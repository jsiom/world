const {compose,map} = require('transducer')
const readEDN = require('read-edn')
const type = require('jkroso-type')
const equal = require('equals')
const Cell = require('cell')

/**
 * run the `query` against the `db`
 *
 * @param {Array} query
 * @param {Array} output
 * @param {Array} db
 * @return {Array}
 */

const qeval = (query, output, db) => {
  var queryPipeline = compose(
    query.map(possibleExtensions(db)),
    map(extract(output)))
    (combine)
  return queryPipeline([], {})
}

/**
 * Create a transducer which will `match` `pattern` against
 * each `datom` in `db` and `combine` all possible `frame`
 * extensions with `result`

 * @param {Array} db
 * @param {Array} pattern
 * @return {Function}
 */

const possibleExtensions = db => pattern => combine => (result, frame) =>
  db.reduce((result, datom) => {
    var m = match(pattern, frame, datom)
    if (m == null) return result
    return combine(result, m)
  }, result)

/**
 * Match `pattern` against `datom` in the environment of `frame`
 *
 * If `pattern` matches the `datom` it will return a new frame
 * with all blank symbols filled in with values from the `datom`.
 * Otherwise it returns `null` to signal no match
 *
 * @param {Array} pattern
 * @param {Object} frame
 * @param {Array} datom
 * @return {Object|null}
 */

const match = (pattern, frame, datom) => {
  var newFrame = frame
  for (var i = 0, len = pattern.length; i < len; i++) {
    var a = pattern[i]
    var b = datom[i]
    if (a == b) continue
    if (type(a) != 'symbol') return null
    if (a in frame) {
      if (frame[a] != b) return null
    } else {
      if (newFrame === frame) newFrame = Object.create(frame)
      newFrame[a] = b
    }
  }
  return newFrame
}

/**
 * Extract the the value of output symbols from a `frame`
 *
 * @param {Array} output
 * @param {Object} frame
 * @return {Array}
 */

const extract = output => frame =>
  output.map(symbol => frame[symbol])

const combine = (result, value) => {
  if (!result.some(x => equal(value, x))) result.push(value)
  return result
}

/**
 * Run a datalog query against `db`
 *
 * @param {String} query
 * @param {Array} db
 * @return {Array}
 */

const query = (query, db) => {
  if (typeof query == 'string') query = readEDN(query)
  if (db instanceof Cell) db = db.value
  var find = query.indexOf(Symbol.for(':find'))
  var where = query.indexOf(Symbol.for(':where'))
  var output = query.slice(find + 1, where)
  var patterns = query.slice(where + 1)
  return qeval(patterns, output, db.datoms)
}

module.exports = query
