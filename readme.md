# Stoar

A [Flux](http://facebook.github.io/react/docs/flux-overview.html) data store providing dispatcher and event emitter capabilities.
This is not a complete Flux implementation, just the data store part.

```sh
% npm install stoar
```

```js
var Stoar = require('stoar');
```

In its simplest incarnation a Stoar instance simply passes through change events.

```js
var store = new Stoar({
  data: { count: 0 }
});

var emitter = store.emitter();
emitter.on('change:count', function(newCount, oldCount){ ... });
var dispatcher = store.dispatcher();
dispatcher.command('change:count', 2);
```

A Stoar instance can contain arbitrary stuff.

```js
var store = new Stoar({
  data: {
    count: 0,
    isFresh: true,
    name: 'untitled'
  }
});
```

## Dispatchers

For each x in data, you can `dispatcher.command('change:x', newValue)` and also `emitter.on('change:x', handler)`.
However, dispatchers get more interesting when you add custom commands.

```js
var dispatcher = store.dispatcher({
  commands: {reset:'handleReset'},
  handleReset: function(){
    this.store.set('count', 0);
    this.store.set('isFresh', true);
  }
});
dispatcher.command('reset');
```

Custom commands give you more control of how the store gets updated.
Anyone doing `emitter.on('change:count')` or `emitter.on('change:isFresh')` would now be notified.

## Emitters

An emitter is an instance of a node.js EventEmitter, but with extra capabilities.
Like dispatchers, emitters get more interesting when you add custom events.

```js
var emitter = store.emitter({
  events: {'change:count':'handleCountChange'},
  handleCountChange: function(newCount, oldCount){
    if (newCount >= 5 && oldCount < 5){
      this.emit('countPassedThreshold');
    }
  }
});
```

Now anyone can be notified when the count increases to five or more.
