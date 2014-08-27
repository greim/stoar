/*******************************************************************************
 * @copyright (c) Wayin, Inc. All Rights Reserved.
 ******************************************************************************/

/*
 * MOCHA TESTS
 * http://visionmedia.github.com/mocha/
 */

var assert = require('assert');
var Stoar = require('../index');

describe('jork', function(){

  it('should construct', function(){
    new Stoar({data:{}});
  });

  it('should init', function(done){
    new Stoar({init:done,data:{}});
  });

  it('should init with this', function(){
    new Stoar({
      init:function(){
        assert.ok(this instanceof Stoar);
      },
      data:{
        foo: null
      }
    });
  });

  it('should init with data', function(){
    new Stoar({
      init:function(){
        assert.ok(this._data.foo === null);
      },
      data:{
        foo: null
      }
    });
  });

  it('should get', function(){
    var store = new Stoar({data:{foo:null}});
    assert.strictEqual(store.get('foo'), null);
  });

  it('should create a dispatcher', function(){
    var store = new Stoar({data:{foo:null}});
    var dispatcher = store.dispatcher({commands:{}});
    assert.ok(dispatcher);
  });

  it('should create an emitter', function(){
    var store = new Stoar({data:{foo:null}});
    var emitter = store.emitter({events:{}});
    assert.ok(emitter);
  });

  it('should pass thru a command', function(done){
    var store = new Stoar({data:{foo:null}});
    var dispatcher = store.dispatcher({commands:{}});
    var emitter = store.emitter({events:{}});
    emitter.on('change:foo', function(value, old){
      assert.strictEqual(value, true);
      assert.strictEqual(old, null);
      done();
    });
    dispatcher.command('change:foo', true);
  });

  it('should update store on passing thru a command', function(done){
    var store = new Stoar({data:{foo:null}});
    var dispatcher = store.dispatcher({commands:{}});
    var emitter = store.emitter({events:{}});
    emitter.on('change:foo', function(value){
      assert.strictEqual(this._store._data.foo, true);
      done();
    });
    dispatcher.command('change:foo', true);
  });

  it('emitter handler should make this be emitter', function(done){
    var store = new Stoar({data:{foo:null}});
    var dispatcher = store.dispatcher({commands:{}});
    var emitter = store.emitter({events:{}});
    emitter.on('change:foo', function(value){
      assert.strictEqual(this, emitter);
      done();
    });
    dispatcher.command('change:foo', true);
  });

  it('should handle a custom command', function(done){
    var store = new Stoar({data:{foo:null}});
    var dispatcher = store.dispatcher({
      commands:{custom:'customHandler'},
      customHandler:function(val){
        this.command('change:foo', val)
      }
    });
    var emitter = store.emitter({events:{}});
    emitter.on('change:foo', function(value, old){
      assert.strictEqual(value, true);
      assert.strictEqual(old, null);
      done();
    });
    dispatcher.command('custom', true);
  });

  it('should receive a custom event', function(done){
    var store = new Stoar({data:{foo:null}});
    var dispatcher = store.dispatcher({commands:{}});
    var emitter = store.emitter({
      events:{'change:foo':'handleFooChange'},
      handleFooChange: function(value, old){
        assert.strictEqual(value, true);
        assert.strictEqual(old, null);
        done();
      }
    });
    dispatcher.command('change:foo', true);
  });

  it('should pass along a custom event', function(done){
    var store = new Stoar({data:{foo:null}});
    var dispatcher = store.dispatcher({commands:{}});
    var emitter = store.emitter({
      events:{'change:foo':'handleFooChange'},
      handleFooChange: function(value, old){
        this.emit('fooChange', 3);
      }
    });
    emitter.on('fooChange', function(num){
      assert.strictEqual(num, 3);
      done();
    });
    dispatcher.command('change:foo', true);
  });

  it('custom commands should override default ones', function(done){
    var aVal = null;
    var store = new Stoar({data:{foo:null}});
    var dispatcher = store.dispatcher({
      commands:{'change:foo':'fooChange'},
      fooChange: function(val){aVal = val;}
    });
    var emitter = store.emitter({events:{}});
    emitter.on('change:foo', function(num){
      done(new Error('no override!'));
    });
    dispatcher.command('change:foo', true);
    assert.strictEqual(aVal, true);
    done();
  });

  it('dispatcher should have this.store', function(done){
    var store = new Stoar({data:{foo:null}});
    var dispatcher = store.dispatcher({
      init: function(){
        assert.strictEqual(this.store, store);
        done();
      }
    });
  });
});

