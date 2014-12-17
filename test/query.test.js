var query = require('../query')
var world = require('..')

var db = world.create({
  'person/mother': {type: 'ref'},
  'person/child': {type: 'ref'}
}, [
  [1, 'person/name', 'henry'],
  [1, 'person/born', 1984],
  [1, 'person/mother', 3],
  [2, 'person/name', 'bill'],
  [2, 'person/mother', 3],
  [2, 'person/born', 1948],
  [3, 'person/name', 'diana'],
  [3, 'person/born', 1961],
  [3, 'person/mother', 4],
  [3, 'person/child', 1],
  [4, 'person/name', 'elizabeth'],
  [4, 'person/born', 1926]
])

it('should produce unique results', function(){
  var result = query('[:find ?e :where [?e]]', db)
  assert.equal(result, [[1],[2],[3],[4]])
})

it('unification across patterns', function(){
  var result = query('[:find ?born\
                       :where\
                         [?e "person/name" "henry"]\
                         [?e "person/born" ?born]]', db)
  assert.equal(result, [[1984]])
})

it('unification across patterns with multiple blanks in one pattern', function(){
  var result = query('[:find ?born\
                       :where\
                         [?e ?attr "henry"]\
                         [?e "person/born" ?born]]', db)
  assert.equal(result, [[1984]])
})

it('unify across entities', function(){
  var result = query('[:find ?mum\
                       :where\
                         [?e "person/name" "henry"]\
                         [?e "person/mother" ?m]\
                         [?m "person/name" ?mum]]', db)
  assert.equal(result, [['diana']])
})

describe('entities', function(){
  var e = world.entity(db.value, '1')
  it('get', function(){
    assert(e.get('person/name') == 'henry')
    assert(e.get('person/born') == 1984)
    assert(e.get('person/mother').get('person/name') == 'diana')
  })

  it('circular references should preserve ===', function(){
    assert(e.get('person/mother').get('person/child') === e)
  })
})
