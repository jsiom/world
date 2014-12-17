var entity = require('./entity')
var query = require('./query')
var Cell = require('cell')

/**
 * Create a new DB wrapped in a Cell
 *
 * @param {Object} schema
 * @param {Array} datoms
 * @return {Cell}
 */

function create(schema, datoms){
  if (Array.isArray(schema)) {
    datoms = schema
    schema = {}
  }
  return new Cell(new DB(schema, datoms || [], 0))
}

function DB(schema, datoms, eid){
  this.schema = schema
  this.datoms = datoms
  this.eid = eid
}

/**
 * Create a new DB with a transaction applied to it
 *
 * If `db` is a `Cell` it will have its value altered to
 * the new DB
 *
 * transact([['+', -1, 'name', "Jake"],
 *           ['+', -1, 'age', 23],
 *           ['+', -1, 'aka', "Muss"]], db)
 */

function transact(tx, db){
  if (db instanceof Cell) return db.set(transact(tx, db.value))
  db = new DB(db.schema, db.datoms.slice(), db.eid)
  var ids = {}
  for (var i = 0, len = tx.length; i < len; i++) {
    var request = tx[i]
    var type = request[0]
    var eid = request[1]
    var datom = request.slice(1)

    if (type == '-') {
      retract(datom, db)
    } else {
      assert(datom, db, ids, eid)
    }
  }
  return db
}

function assert(datom, db, ids, eid){
  var schema = db.schema[datom[1]]

  // handle refs
  if (schema && schema.type == 'ref') {
    var val = datom[2]
    if (val < 0) datom[2] = ids[val] || (ids[val] = ++db.eid)
  }

  // new entity
  if (eid < 0) {
    eid = ids[eid] || (ids[eid] = ++db.eid)
    datom[0] = eid
    db.datoms.push(datom)
    return
  }

  // multiple values
  if (schema && schema.cardinality == 'many') {
    db.datoms.push(datom)
    return
  }

  // overwrite existing entity attributes
  for (var j = 0, jlen = db.datoms.length; j < jlen; j++) {
    var existing = db.datoms[j]
    if (existing[0] != eid) continue
    if (existing[1] != datom[1]) continue
    db.datoms[j] = datom
    return
  }

  // new datom
  db.datoms.push(datom)
}

function retract(datom, db){
  for (var i = 0, len = db.datoms.length; i < len; i++) {
    var existing = db.datoms[i]
    if (existing[0] != datom[0]) continue
    if (existing[1] != datom[1]) continue
    if (datom.length > 2 && existing[2] != datom[2]) continue
    db.datoms.splice(i, 1)
    var schema = db.schema[datom[1]]
    if (!schema) break
    if (schema.cardinality != 'many') break
    len--
    i--
  }
}

exports.transact = transact
exports.create = create
exports.entity = entity
exports.query = query
