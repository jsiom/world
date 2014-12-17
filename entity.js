var lazy = require('lazy-property')
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

function Entity(eid, db, cache){
  this.cache = cache
  this.eid = eid
  this.db = db
}

lazy(Entity.prototype, 'attrs', function(){
  var schema = this.db.schema
  var cache = this.cache
  var data = query('[:find ?attr ?val :where [' + this.eid + ' ?attr ?val]]', this.db)
  var attrs = {}
  for (var i = 0, len = data.length; i < len; i++) {
    var key = data[i][0]
    var val = data[i][1]
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
})

Entity.prototype.get = function(key){
  return this.attrs[key]
}

module.exports = createEntity
