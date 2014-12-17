var world = require('..')
var transact = world.transact
var create = world.create
var query = world.query

var db = create({
  'person/parent': {
    cardinality: 'many',
    type: 'ref'
  }
})

var tx = [['+', -1, 'person/name', 'henry'],
          ['+', -1, 'person/born', 1984],
          ['+', -2, 'person/name', 'charles'],
          ['+', -1, 'person/parent', -3],
          ['+', -2, 'person/parent', -3],
          ['+', -2, 'person/born', 1948],
          ['+', -3, 'person/name', 'diana'],
          ['+', -3, 'person/born', 1961],
          ['+', -3, 'person/parent', -4],
          ['+', -4, 'person/name', 'elizabeth'],
          ['+', -4, 'person/born', 1926]]

transact(tx, db)

it('adding new entities', function(){
  var result = query('[:find ?e ?a ?v :where [?e ?a ?v]]', db)
  var datoms = tx.map(function(diff){
    var datom = diff.slice(1)
    datom[0] = Math.abs(diff[1])
    if (typeof datom[2] == 'number') datom[2] = Math.abs(datom[2])
    return datom
  })
  assert.equal(result, datoms)
})

it('adding new attributes to existing entities', function(){
  transact([['+', 1, 'person/hair', 'ginger']], db)
  var result = query('[:find ?h :where [1 "person/hair" ?h]]', db)
  assert.equal(result, [['ginger']])
})

it('overwriting existing data', function(){
  transact([['+', 1, 'person/name', 'bill'],
            ['+', 1, 'person/born', 1982]], db)
  var result = query('[:find ?n :where [1 "person/name" ?n]]', db)
  assert.equal(result, [['bill']])
})

it('retract data', function(){
  transact([['-', 1, 'person/hair', 'ginger']], db)
  var result = query('[:find ?h :where [1 "person/hair" ?h]]', db)
  assert.equal(result, [])
})

it('cardinality many', function(){
  transact([['+', 3, 'person/parent', 5],
            ['+', 5, 'person/name', 'john']], db)
  var result = query('[:find ?name \
                       :where [3 "person/parent" ?p]\
                              [?p "person/name" ?name]]', db)
  assert.equal(result, [['elizabeth'], ['john']])
})

it('retract cardinality many', function(){
  transact([['-', 3, 'person/parent']], db)
  var result = query('[:find ?p :where [3 "person/parent" ?p]]', db)
  assert.equal(result, [])
})
