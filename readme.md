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
  data: { count: 0 }
});
```

A Stoar can contain whatever data you want to put in there, with defaults.

```js
var store = new Stoar({
  data: {
    count: 0,
    isFresh: true,
    name: 'untitled'
  }
});
var count = store.get('count'); // 0
store.set('count', 1);
count = store.get('count'); // 1
```

## Immutability and Cloning

JS objects aren't immutable, but treating them as such can avoid bugs and slowness.
Thus, it might sometimes be helpful to `clone()` instead of `get()`.
(Note: cloning internally uses lodash's clone methods.)

```js
var store = new Stoar({
  data: {
    flags: {
      foo: true,
      bar: false
    }
  }
});
var flags = store.clone('flags');
flags.bar = true;
store.set('flags', flags);
```

If we hadn't used `clone()` above, `flags.bar = true` would have altered the
state of any views currently holding a reference to the flags object, *without*
also notifying them of the change. When they finally were notified, the view
would have had no way to tell that the incoming value was any different from the
previous one, since it had been silently overwritten.

You can optionally deep clone by passing `true`:

```js
var deepClone = store.clone('stuff', true);
```

## Dispatchers and Emitters

In addition to creating a Stoar, you create a dispatcher and an emitter.
The dispatcher intercepts and mediates input, while the emitter intercepts and mediates output.
In its simplest incarnation, it simply passes through change events.

```js
var store = new Stoar({
  data: { count: 0 }
});

var emitter = store.emitter();
var dispatcher = store.dispatcher();

// listen to the emitter
emitter.on('change:count', function(count, old){
  console.log('count changed from %d to %d', old, count);
});

// send commands to the dispatcher
dispatcher.command('change:count', 2);
// log: "count changed from 0 to 2"
```

For each x in your store data, you can `dispatcher.command('change:x', newValue)` and also `emitter.on('change:x', handler)`.

Not very interesting by itself.
The power comes when you customize your dispatchers and emitters.

## Dispatchers

You can add custom commands.

```js
var dispatcher = store.dispatcher({
  fetch: function(){
    var store = this.store;
    store.set('loading', true);
    fetch(function(items){
      store.set('items', items);
      store.set('loading', false);
    });
  }
});
dispatcher.command('fetch');
```

Anyone listening to `change:loading` or `change:items` would be notified in the appropriate order.
Custom commands give you more control of how the store gets updated.

A dispatcher custom command may be of the same name as a default command.
If so, returning false from the method prevents the default action.

```js
var store = new Stoar({
  data: { count: 0 }
});
var dispatcher = store.dispatcher({
  'change:count': function(count){
    if (isNaN(count - 0)){
      return false;
    }
  }
});
dispatcher.command('change:count', 'not a number');
// no effect
```

## Emitters

An emitter is an instance of a node.js EventEmitter, but with extra capabilities.
Like dispatchers, emitters get more interesting when you emit custom events.

```js
var emitter = store.emitter({
  'change:count': function(newCount, oldCount){
    if (newCount >= 5 && oldCount < 5){
      this.emit('countPassedThreshold');
    }
  }
});
```

Now anyone listening to `countPassedThreshold` will be notified when the count increases to five or more.

Emitters also have a generic `change`.

```js
var emitter = store.emitter({
  change: function(name, val, old){
    console.log('%s changed from %s to %s', name, val, old);
  }
});

emitter.on('change', function(name, val, old){
  // ...
});

dispatcher.command('change:count', 3);
// log: count changed from 0 to 3
```

An emitter event can also return false to prevent listeners from being notified.

```js
var emitter = store.emitter({
  'change:count': function(newCount, oldCount){
    if (newCount === oldCount){
      return false;
    }
  }
});
```

## Init methods

And, everything has an optional init function that runs once at creation time.

```js
var store = new Stoar({
  init: function(){...},
  data: { count: 0 }
});
var emitter = store.emitter({
  init: function(){...}
});
var dispatcher = store.dispatcher({
  init: function(){...}
});
```

## Building a Flux app

A Stoar represents your application state.
Views call `dispatcher.command()` when they want to change the state.
Views call `emitter.on()` in order to know when to update themselves to reflect application state.
In this way, data flow is strictly one-way.
In other words, views never update themselves in response to other views, except via the dispatcher->store->emitter pathway.

## Testing

Have [mocha](http://visionmedia.github.io/mocha/) installed and run `npm test`.

```sh
% npm test
```

