var lazy = require('lazy-property/decorator')
var query = require('./query')

/**
 * Entities provide an ORM into a DB
 *
 * @param {DB} db
 * @param {Number} id
 * @return {Entity}
 */

function createEntity(db, id) {
  var e = new Entity(id, db, {})
  return e.cache[id] = e
}

class Entity {
  constructor(eid, db, cache) {
    this.cache = cache
    this.eid = eid
    this.db = db
  }
  @lazy attrs() {
    var schema = this.db.schema
    var cache = this.cache
    var data = query([Symbol.for(':find'), Symbol.for('?attr'), Symbol.for('?val'),
                      Symbol.for(':where'), [this.eid, Symbol.for('?attr'), Symbol.for('?val')]], this.db)
    var attrs = {}
    for (var i = 0, len = data.length; i < len; i++) {
      var [key,val] = data[i]
      var scheme = schema[key]
      if (scheme) {
        if (scheme.type == 'ref') {
          if (!cache[val]) cache[val] = new Entity(val, this.db, cache)
          val = cache[val]
        }
        if (scheme.cardinality == 'many') {
          attrs[key] = attrs[key] || []
          attrs[key].push(val)
        } else {
          attrs[key] = val
        }
      } else {
        attrs[key] = val
      }
    }
    return attrs
  }
  get(key) {
    return this.attrs[key]
  }
}

export default createEntity
