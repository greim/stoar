# Stoar

Note: this library is still experimental.

A [Flux](http://facebook.github.io/react/docs/flux-overview.html) data store providing dispatcher and event emitter capabilities.
This is not a complete Flux implementation, just the store and dispatcher part.
This lib makes very few assumptions or opinions about your overall Flux app structure.

```sh
% npm install stoar
```

```js
var Stoar = require('stoar');
```

How to make a Stoar.

```js
var store = new Stoar({
  defs: {
    count: {
      type: 'item',
      value: 0
    },
    foods: {
      type: 'list',
      value: ['pizza','salad','eggs']
    }
  }
});

var count = store.get('count')
var firstFood = store.get('foods', 0)
store.forEach('foods', function(food){
  // ...
});
```

Each data item receives a definition, which is an object with `type`, `value` and `validate` properties.

  * `type` - Possible values include: `'item'`, `'map'`, and `'list'`. Optional; defaults to `'item'`. The `type` determines what kinds of operations are available on this store property.
  * `value` - The initial value of this property in the store. If `type === 'map'`, this must be a plain object. If `type === 'list'`, this must be an array. This is optional, with a default value depending on `type`.
  * `validate` - An optional function that runs against every value set on this store property. For `'map'` and `'list'` types, this runs against every item in that map or list. It should throw for bad values. The return value is discarded.

## Immutability and Cloning

JS objects aren't immutable, but treating them as such makes many things easier.
Thus, stoar rejects resetting a mutable property to itself, and provides a `clone()` method that you can use instead of `get()` in order to treat objects as immutable.
(Note: cloning internally uses lodash's clone methods.)

```js
var store = new Stoar({
  defs: {
    user: {
      value: { name: 'jorge' }
    }
  }
});

var user = store.get('user');
user.name = 'Jorge';
store.set('user', user); // error!

var user = store.clone('user');
user.name = 'Jorge';
store.set('user', user); // success
```

Clones are shallow by default. You can optionally deep clone by passing `true`:

```js
var deepClone = store.clone('stuff', true);
```

## API

### Items

 * `store.set(prop, val)` - Updates the item to the given value.
 * `store.unset(prop)` - Sets the item to undefined.
 * `store.get(prop)` - Returns the item.
 * `store.clone(prop, [deep])` - Returns a clone of the item. Set `deep` to true for a deep clone.

### Maps

 * `store.set(prop, key, val)` - Updates the value at the given key.
 * `store.unset(prop, key)` - Deletes the value the given key.
 * `store.setAll(prop, newMap)` - Merges in the new values.
 * `store.resetAll(prop, newMap)` - Overwrites the map with the new values.
 * `store.clear(prop)` - Empties out the map.
 * `store.get(prop, key)` - Returns the value at the given key.
 * `store.clone(prop, deep)` - Clone the value at the given key. Set `deep` to true for a deep clone.
 * `store.has(prop, key)` - Returns true if the map has the given key as an own property.
 * `store.getAll(prop)` - Returns a copy of the map. Modifying the copy will not change the map.
 * `store.keys(prop)` - Returns an array of map keys.
 * `store.values(prop)` - Returns an array of map values.
 * `store.forEach(prop, cb, [ctx])` - Iterate the map. `cb` is passed `value` and `name` params.

### Lists

 * `store.set(prop, idx, val)` - Updates the value at the given index.
 * `store.resetAll(prop, newList)` - Overwrites the list with the new values.
 * `store.clear(prop)` - Empties out the list.
 * `store.push(prop, val)` - Appends a value.
 * `store.unshift(prop, val)` - Prepends a value.
 * `store.pop(prop)` - Removes and returns the last value.
 * `store.shift(prop)` - Removes and returns the first value.
 * `store.get(prop, idx)` - Returns the value at the given index.
 * `store.clone(prop, idx, deep)` - Clone the value at the given index. Set `deep` to true for a deep clone.
 * `store.length(prop)` - Returns the length.
 * `store.getAll(prop)` - Returns a copy of the list. Modifying the copy will not change the list.

All of these are strictly accessors and apply directly into the corresponding `Array.prototype` method, with `prop` shifted off the args.

 * `store.filter(prop, ...)`
 * `store.map(prop, ...)`
 * `store.some(prop, ...)`
 * `store.every(prop, ...)`
 * `store.forEach(prop, ...)`
 * `store.reduce(prop, ...)`
 * `store.reduceRight(prop, ...)`
 * `store.join(prop, sep)`
 * `store.slice(prop, ...)`
 * `store.concat(prop, ...)`
 * `store.indexOf(prop, ...)`
 * `store.lastIndexOf(prop, ...)`
