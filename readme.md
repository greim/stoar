# Stoar

A [Flux](http://facebook.github.io/react/docs/flux-overview.html) data store providing dispatcher and event emitter capabilities.
This is not a complete Flux implementation, just the data store part.

```sh
% npm install stoar
```

```js
var Stoar = require('stoar');
```

It's easy to make a Stoar.

```js
var store = new Stoar({
  data: { count: 0 }
});
```

A Stoar can also contain an init method that runs at construction time, and whatever data you want to put in there, starting with some defaults.

```js
var store = new Stoar({
  init: function(){
    console.log(this.get('name'));
    // log: "untitled"
  },
  data: {
    count: 0,
    isFresh: true,
    name: 'untitled'
  }
});
```

In its simplest incarnation a Stoar simply passes through change events.

```js
var store = new Stoar({
  data: { count: 0 }
});

var emitter = store.emitter();
var dispatcher = store.dispatcher();

emitter.on('change:count', function(count, old){
  console.log('count changed from %d to %d', old, count);
});

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
  reset: function(){
    this.store.set('count', 0);
    this.store.set('isFresh', true);
  }
});
dispatcher.command('reset');
```

Custom commands give you more control of how the store gets updated.
Anyone doing `emitter.on('change:count')` or `emitter.on('change:isFresh')` would now be notified.
You can also have an optional `init` method which runs once at the start.

```js
var dispatcher = store.dispatcher({
  init: function(){...}
});
```

## Emitters

An emitter is an instance of a node.js EventEmitter, but with extra capabilities.
Like dispatchers, emitters get more interesting when you add custom events.

```js
var emitter = store.emitter({
  'change:count': function(newCount, oldCount){
    if (newCount >= 5 && oldCount < 5){
      this.emit('countPassedThreshold');
    }
  }
});
```

Now anyone can be notified when the count increases to five or more.
You can also have an optional `init` method which runs once at the start.

```js
var emitter = store.emitter({
  init: function(){...}
});
```
