var parseEDN = require('parse-edn')
var curry = require('curryable')
var equals = require('equals')
var Cell = require('cell')

/**
 * run the `query` against the `db`
 *
 * @param {Array} query
 * @param {Array} output
 * @param {Array} db
 * @return {Array}
 */

function qeval(query, output, db){
  var fns = query.map(possibleExtensions.bind(null, db))
  fns.push(map(extract.bind(null, output)))
  fns.push(combine)
  return compose(fns)([], {})
}

/**
 * Create a transducer which will `match` `pattern` against
 * each `datom` in `db` and `combine` all possible `frame`
 * extensions with `result`

 * @param {Array} db
 * @param {Array} pattern
 * @return {Function}
 */

function possibleExtensions(db, pattern){
  pattern = pattern.toArray()
  return function(combine){
    return function(result, frame){
      var seen = []
      return db.reduce(function(result, datom){
        var m = match(pattern, frame, datom)
        if (m == null || seen.some(eql(m))) return result
        seen.push(m)
        return combine(result, m)
      }, result)
    }
  }
}

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

function match(pattern, frame, datom){
  var newFrame = frame
  for (var i = 0, len = pattern.length; i < len; i++) {
    var a = pattern[i]
    var b = datom[i]
    if (a == b) continue
    if (!(a instanceof parseEDN.Symbol)) return null
    if (a.value in frame) {
      if (frame[a.value] != b) return null
    } else {
      if (newFrame === frame) newFrame = Object.create(frame)
      newFrame[a.value] = b
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

function extract(output, frame){
  return output.map(function(symbol){ return frame[symbol.value] })
}

function combine(result, value){
  result.push(value)
  return result
}

function eql(a){
  return function(b){ return equals(a, b) }
}

/**
 * Run a datalog query against `db`
 *
 * @param {String} query
 * @param {Array} db
 * @return {Array}
 */

function query(query, db){
  if (typeof query == 'string') query = parseEDN(query).toArray()
  if (db instanceof Cell) db = db.value
  var find = query.indexOf(':find')
  var where = query.indexOf(':where')
  var output = query.slice(find + 1, where)
  var patterns = query.slice(where + 1)
  return qeval(patterns, output, db.datoms)
}

// the rest is transducer crap
function compose(fns){
  return foldr(fns, compose2)
}

function compose2(transducer, combiner){
  return transducer(combiner)
}

function foldr(array, fn){
  var i = array.length - 1
  var init = array[i]
  while (i > 0) {
    init = fn(array[--i], init)
  }
  return init
}

var map = curry(function map(fn, combine, result, value){
  return combine(result, fn(value))
})

module.exports = query
