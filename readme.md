# Stoar

A set of tools for the [Flux](http://facebook.github.io/react/docs/flux-overview.html) architecture.
It provides you with:

 * **Dispatcher** - An object that mediates data flow to and from your stores. This is the central hub of your Flux app.
 * **Store** - A container for application state.
 * **Commander** - The entry point where data flows into the stores.
 * **Notifier** - The exit point where data flows out of the stores.

```sh
% npm install stoar
```

```js
var Stoar = require('stoar');
```

## Building a basic Flux app

Here are the things you do in order to build a Flux app.
First, define your objects.
These will be singletons which should be accessible to the rest of your code.

 1. Create a dispatcher.
 1. Create one or more stores from the dispatcher and provide action callbacks for each.
 1. Create a commander from the dispatcher, with optional custom methods.
 1. Create a notifier from the dispatcher.

Next, wire up these objects.

 1. Listen for change events on the notifier, re-rendering your top-level React component(s) for each change. Do not listen for change events from anywhere but the top level components, as changes will propagate down via your render functions.
 1. Send actions to the commander in response to various events in your app, e.g. user-initiated, server-push, app initialize, window resize, polling/fetching, etc. Actions always have the signature `(action, payload)` where `action` is a string and `payload` is any value whatsoever.
 1. At any point in the app it's okay to read data from the stores. However, only in a given store's action callback is it okay to mutate that store.

Here's the same thing but laid out as files.

```js
// ------------------------------------
// dispatcher.js
var Stoar = require('stoar');
module.exports = Stoar.dispatcher();
```
```js
// ------------------------------------
// ui-store.js
var dispatcher = require('./dispatcher');
var uiStore = module.exports = dispatcher.store({
  // define data here
}, function(action, payload){
  uiStore.set(...) // mutate the store here
});
```
```js
// ------------------------------------
// data-store.js
var dispatcher = require('./dispatcher');
var uiStore = require('./ui-store');
var dataStore = module.exports = dispatcher.store({
  // define data here
}, function(action, payload){
  this.waitFor(uiStore);
  // respond to the action while being able
  // to see the latest data in uiStore
});
```
```js
// ------------------------------------
// commander.js
var dispatcher = require('./dispatcher');
module.exports = dispatcher.commander({
  doCustomThing: function(){}
});
```
```js
// ------------------------------------
// notifier.js
var dispatcher = require('./dispatcher');
module.exports = dispatcher.notifier();
```
```js
// ------------------------------------
// main-controller.js
var notifier = require('./notifier');
notifier.on('change', function(){
  topLevelComponent.setProps(...)
});
```
```js
// ------------------------------------
// some-component.jsx
var commander = require('./commander');
...
commander.send(action, payload); // send an action to dispatcher
commander.doCustomThing(); // custom method might have side effects
...
```

## Stores

```js
var store = Stoar.store({
  count: {
    type: 'item',
    value: 0
  },
  foods: {
    type: 'list',
    value: ['pizza','salad','eggs']
  }
});

var count = store.get('count')
var firstFood = store.get('foods', 0)
store.forEach('foods', function(food){
  // ...
});
```

Two data items are defined in this store: `count` and `foods`.
Each receives a definition, which is an object with `type`, `value` and `validate` properties.

  * **type** - Possible values include: `item`, `map`, and `list`. Optional; defaults to `item`. The `type` determines what kinds of operations are available on this store property.
  * **value** - The initial content of this property in the store. If `type === 'map`, this must be a plain object. If `type === 'list'`, this must be an array. This is optional, with a default value depending on `type`.
  * **validate** - An optional function that runs against every value set on this store property. For `map` and `list` types, this runs against every item in that map or list. It should throw for bad values. The return value is discarded.
  * **loadable** - Indicates that this property is associated with a remote data source. Setting this to `true` merely causes some extra properties to be added. For example if the property is called `posts`, then properties called `posts:loading`, `posts:status`, and `posts:timestamp` will be created too, each with a corresponding `type`. It's up to you whether and how to use these extra properties.

## Immutability and Cloning

JS objects aren't immutable, but treating them as such makes many things easier.
Thus, stoar rejects resetting a mutable property to itself, and provides a `clone()` method that you can use instead of `get()` in order to treat objects as immutable.

```js
var store = new Stoar({
  user: {
    value: { name: 'jorge' }
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

### Top-level API

 * `var disp = Stoar.dispatcher()` - Create a dispatcher.

### Dispatcher API

 * `var store = dispatcher.store(defs, actionCallback)` - Create a store. `defs` is an object describing the store's data. `actionCallback` is a callback that receives a signature `(action, payload)` for whenever the dispatcher receives a command, or an object keyed by action names and whose values are functions receiving an `(action, payload)` signature.
 * `var commander = dispatcher.commander(methods)` - Create a commander. `methods` is an object containing any custom method you'd like to have on the created commander.
 * `var notifier = dispatcher.notifier()` - Create a notifier.
 * `dispatcher.waitFor(store)` - Call this synchronously from within a store's action callback. Causes another store to be updated first.

### Store

 * `store.absorb(payload)` - Convenience method to apply a `mutate` action directly. Can only be called synchronously from within an action callback. (See commander API below).

### Item accessors

 * `store.get(prop)` - Returns the item.
 * `store.clone(prop, [isDeep])` - Returns a clone of the item.

### Item mutators

 * `store.set(prop, val)` - Updates the item to the given value.
 * `store.unset(prop)` - Sets the item to undefined.
 * `store.toggle(prop)` - Inverts the value in place using `!`.

### Map accessors

 * `store.get(prop, key)` - Returns the value at the given key.
 * `store.clone(prop, isDeep)` - Clone the value at the given key.
 * `store.has(prop, key)` - Returns true if the map has the given key as an own property.
 * `store.getAll(prop)` - Returns a copy of the map. Modifying the copy will not change the map.
 * `store.keys(prop)` - Returns an array of map keys.
 * `store.values(prop)` - Returns an array of map values.
 * `store.forEach(prop, cb, [ctx])` - Iterate the map. `cb` is passed signature `(value, name)`.
 * `store.isIdentical(prop, otherMap)` - Test whether the top-level contents of a different object are identical using `===`.

### Map mutators

 * `store.set(prop, key, val)` - Updates the value at the given key.
 * `store.unset(prop, key)` - Deletes the value at the given key.
 * `store.setAll(prop, newMap)` - Merges in the new values.
 * `store.resetAll(prop, newMap)` - Overwrites the map with the new values.
 * `store.setExistingValuesTo(prop, val)` - Sets each existing map value to `val`. Leaves keys unchanged.
 * `store.clear(prop)` - Empties out the map.
 * `store.toggle(prop, key)` - Inverts the value in place using `!`.

### List accessors

 * `store.get(prop, idx)` - Returns the value at the given index.
 * `store.clone(prop, idx, isDeep)` - Clone the value at the given index.
 * `store.length(prop)` - Returns the length.
 * `store.getAll(prop)` - Returns a copy of the list. Modifying the copy will not change the list.
 * `store.isIdentical(prop, otherList)` - Test whether the top-level contents of a different list are identical using `===`.

All of these are strictly accessors and call directly into the `Array.prototype` method of the same name, but with `prop` shifted off the args.
In old browsers you may need to polyfill `Array.prototype` in order for these to work.

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

### Lists mutators

 * `store.set(prop, idx, val)` - Updates the value at the given index.
 * `store.resetAll(prop, newList)` - Overwrites the list with the new values.
 * `store.setExistingValuesTo(prop, val)` - Sets each existing list value to `val`. Array length unchanged.
 * `store.clear(prop)` - Empties out the list.
 * `store.push(prop, val)` - Appends a value.
 * `store.unshift(prop, val)` - Prepends a value.
 * `store.pop(prop)` - Removes and returns the last value.
 * `store.shift(prop)` - Removes and returns the first value.
 * `store.truncateLength(prop, length)` - Limits length of list to `length`. If `length` is bigger, becomes a no-op.
 * `store.toggle(prop, idx)` - Inverts the value in place using `!`.

### Commander API

 * `commander.send(action, payload)` - Send an action directly to the dispatcher.
 * `commander.myCustomMethod(any, args)` - Call a custom method that you provided when creating the commander.
 * `commander[mutatorMethod](store, ...args`) - Proxy for any store mutator method. Stores can't be mutated outside of their action callbacks. This therefore translates into an action called `mutate` which is passed to the given store. The payload contains the arguments passed to the commander, except with `store` shifted off the list. For convenience, in the action callback, you can do `if (action === 'mutate') { this.absorb(payload) }` in order to apply mutations directly.

### Notifier API

 * `notifier.on('change', callback)` - Listen for changes to any of the stores that have been registered with the dispatcher. `callback` is passed a signature `(store, property, change)`, where `change` is an object like `{ oldVal: something, newVal: something }`. If the changed property was a list or map, `change` will also contain `index` or `key`, respectively.












