
# world

  An immutable graph data-structure designed to be accessed using relational queries. Like a <strike>database</strike> boss.

## Motivation

  All data-structures come with opinions on the types of operations you should do on them. For example a linked lists makes it really easy to define recursive procedures which operate on all items in the list but makes it impossible to define efficient functions for `length`, `splice`, `append,` etc.. While Arrays have pretty much the opposite strengths and weakness. But they are both used for the same kinds of data. Which you choose depends entirely on the type of operations you expect to do on the data and not on any intrinsic property of the data itself.

  Likewise when your designing the top level data-structure for an application you need to think ahead about how the UI components will be structured and what information each component will require. In simple applications like [TodoMVC](http://todomvc.com) its possible to shape your data to match the UI structure so its always convenient to get at the bits of data you want. But more complicated applications, or even just fancier todo lists, make it impossible to reflect the UI's structure in the data model so you are forced to compromise and use the data model which requires the least amount of noisy code to get at and update the data used in your UI.

  The root of the problem is that data-structures complect information and representation, or the view you have of that information. The goal of this project is to provide a robust information container which doesn't enforce any hierarchy on your data model. It is a true graph with no official entry point, completely un-opinionated about which parts of you data you can access. If you want opinionated views of your data they should be built on top of a robust data model like this.

## Inspiration

  Nikita Prokopov's [blog](tonsky.me/blog/datomic-as-protocol) convinced me that datomic is a robust platform to build applications on top of. And with [datascript](https://github.com/tonsky/datascript) he proved that a useful subset of it can run in the browser. I would of just used datascript but since a lot of the ideas its built on are new to me I really wanted something simple that I could understand and experiment with in my native language. And finally the initial implementation is basically a straight forward translation of the one in [SICP section 4.4.4](http://mitpress.mit.edu/sicp/full-text/book/book-Z-H-29.html#%_sec_4.4.4) to JavaScript with the only major difference being that it uses transducers in place of streams, a big performance win.

## Prospects

  - A view layer on top: take [entities](entity.js) to their logical conclusion (a separate library)
  - Implement the rest of the datalog query language
    - parameters
    - aggregates
    - rules
  - Persistence to localstorage: probably just needs to be a sliding window of old transactions + the current state (a separate library)
  - Syncing with server
  - Optimization: once it works well

## Installation

With [packin](//github.com/jkroso/packin): `packin add jsiom/world`

then in your app:

```js
var world = require('world')
var transact = world.transact
var create = world.create
var entity = world.entity
var query = world.query
```

## API

### `create([schema:Object], [datoms:Array])`

  Create a new DB wrapped in a Cell. The `schema` is used to define the types of certain attributes in the database. Attributes with no special behaviour don't need to be declared in the schema. `datoms` is just an initial set of datoms for the DB to contain.

```js
var db = create({
  follows: {
    type: 'ref',         // the "follows" attribute will refer to another entity
    cardinality: 'many', // and possibly several
  },
  aka: {cardinality: 'many'}
}, [
  [1, 'person/name', 'Jake'],
  [1, 'follows', 2], // entity 1 has 4 values under its "follows" attribute
  [1, 'follows', 3],
  [1, 'follows', 4],
  [1, 'follows', 5],
  [2, 'person/name', 'Alan Kay'], // entity 2 has 0 values under "follows"
  [3, 'person/name', 'Nikita Prokopov'],
  [4, 'person/name', 'Harold Abelson'],
  [4, 'follows', 5],
  [5, 'person/name', 'Gerald Jay Sussman'],
  [5, 'follows', 4] // Cyclic relationship between entities are OK too
])
```

### `entity(db:DB, id:Number)`

  Entities provide an ORM into a DB

### `transact(diff:Array, db:DB|Cell)`

  Create a new DB with a transaction applied to it

  If `db` is a `Cell` it will have its value altered to the new DB

```js
transact([['+', 1, 'person/name', 'Jake Rosoman'],
          ['+', 1, 'aka', 'Muss']], db)
```

### `query(query:String, db:Array)`

  Run a [datalog](learndatalogtoday.org) query against `db` returning an Array of results.
