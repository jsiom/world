const {equal,deepEqual} = require('assert')
const {create,Entity} = require('..')
const query = require('../query')

const db = create({
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
  deepEqual(query('[:find ?e :where [?e]]', db), [[1],[2],[3],[4]])
  deepEqual(query('[:find ?a :where [?e ?a]]', db),
            [['person/name'],['person/born'],['person/mother'],['person/child']])
})

it('unification across patterns', function(){
  let result = query(`[:find  ?born
                       :where [?e "person/name" "henry"]
                              [?e "person/born" ?born]]`, db)
  deepEqual(result, [[1984]])
})

it('unification across patterns with multiple blanks in one pattern', function(){
  let result = query(`[:find  ?born
                       :where [?e ?attr "henry"]
                              [?e "person/born" ?born]]`, db)
  deepEqual(result, [[1984]])
})

it('unify across entities', function(){
  let result = query(`[:find  ?mother
                       :where [?e "person/name" "henry"]
                              [?e "person/mother" ?m]
                              [?m "person/name" ?mother]]`, db)
  deepEqual(result, [['diana']])
})

describe('entities', function(){
  const e = new Entity(db.value, 1)

  it('get', function(){
    deepEqual(e.get('person/name'), 'henry')
    deepEqual(e.get('person/born'), 1984)
    deepEqual(e.get('person/mother').get('person/name'), 'diana')
  })

  it('circular references should preserve ===', function(){
    equal(e.get('person/mother').get('person/child'), e)
  })
})
