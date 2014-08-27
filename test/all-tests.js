
/*
 * MOCHA TESTS
 * http://visionmedia.github.com/mocha/
 */

var assert = require('assert');
var Stoar = require('../index');

describe('stoar', function(){

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
        assert.strictEqual(this.get('foo'), null);
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
    var dispatcher = store.dispatcher();
    assert.ok(dispatcher);
  });

  it('should create an emitter', function(){
    var store = new Stoar({data:{foo:null}});
    var emitter = store.emitter();
    assert.ok(emitter);
  });

  it('should pass thru a command', function(done){
    var store = new Stoar({data:{foo:null}});
    var dispatcher = store.dispatcher();
    var emitter = store.emitter();
    emitter.on('change:foo', function(value){
      assert.strictEqual(value, true);
      done();
    });
    dispatcher.command('change:foo', true);
  });

  it('should provide previous value', function(done){
    var store = new Stoar({data:{foo:null}});
    var dispatcher = store.dispatcher();
    var emitter = store.emitter();
    emitter.on('change:foo', function(value, old){
      assert.strictEqual(old, null);
      done();
    });
    dispatcher.command('change:foo', true);
  });

  it('should update store on passing thru a command', function(done){
    var store = new Stoar({data:{foo:null}});
    var dispatcher = store.dispatcher();
    var emitter = store.emitter();
    emitter.on('change:foo', function(value){
      assert.strictEqual(this.store.get('foo'), true);
      done();
    });
    dispatcher.command('change:foo', true);
  });

  it('emitter handler should make this be emitter', function(done){
    var store = new Stoar({data:{foo:null}});
    var dispatcher = store.dispatcher();
    var emitter = store.emitter();
    emitter.on('change:foo', function(value){
      assert.strictEqual(this, emitter);
      done();
    });
    dispatcher.command('change:foo', true);
  });

  it('should handle a custom command', function(done){
    var store = new Stoar({data:{foo:null}});
    var dispatcher = store.dispatcher({
      custom:function(val){
        this.store.set('foo', val)
      }
    });
    var emitter = store.emitter();
    emitter.on('change:foo', function(value){
      assert.strictEqual(value, true);
      done();
    });
    dispatcher.command('custom', true);
  });

  it('should receive a custom event', function(done){
    var store = new Stoar({data:{foo:null}});
    var dispatcher = store.dispatcher();
    var emitter = store.emitter({
      'change:foo': function(value){
        assert.strictEqual(value, true);
        done();
      }
    });
    dispatcher.command('change:foo', true);
  });

  it('should pass along a custom event', function(done){
    var store = new Stoar({data:{foo:null}});
    var dispatcher = store.dispatcher();
    var emitter = store.emitter({
      'change:foo': function(value){
        this.emit('fooChange', 3);
      }
    });
    emitter.on('fooChange', function(num){
      assert.strictEqual(num, 3);
      done();
    });
    dispatcher.command('change:foo', true);
  });

  it('custom commands should precede default ones of same name', function(done){
    var aVal = '';
    var store = new Stoar({data:{foo:null}});
    var dispatcher = store.dispatcher({
      'change:foo': function(val){aVal += 'a';}
    });
    var emitter = store.emitter();
    emitter.on('change:foo', function(num){
      aVal += 'b';
    });
    dispatcher.command('change:foo', true);
    assert.strictEqual(aVal, 'ab');
    done();
  });

  it('dont block a default command if return undefined', function(done){
    var val = '';
    var store = new Stoar({data:{foo:null}});
    var emitter = store.emitter();
    var dispatcher = store.dispatcher({
      'change:foo': function(){
        val += 'a';
      }
    });
    emitter.on('change:foo', function(num){
      val += 'b';
    });
    dispatcher.command('change:foo', true);
    assert.strictEqual(val, 'ab');
    assert.strictEqual(store.get('foo'), true);
    done();
  });

  it('block a default command if return falsy', function(done){
    var val = '';
    var store = new Stoar({data:{foo:null}});
    var emitter = store.emitter();
    var dispatcher = store.dispatcher({
      'change:foo': function(){
        val += 'a';
        return false;
      }
    });
    emitter.on('change:foo', function(num){
      val += 'b';
    });
    dispatcher.command('change:foo', true);
    assert.strictEqual(val, 'a');
    assert.strictEqual(store.get('foo'), null);
    done();
  });

  it('dispatcher init should have this.store', function(done){
    var store = new Stoar({data:{foo:null}});
    var dispatcher = store.dispatcher({
      init: function(){
        assert.strictEqual(this.store, store);
        done();
      }
    });
  });

  it('dispatcher method should have this.store', function(done){
    var store = new Stoar({data:{foo:null}});
    store.dispatcher({
      foo: function(){
        assert.strictEqual(this.store, store);
        done();
      }
    }).command('foo');

  });

  it('emitter init should have this.store', function(done){
    var store = new Stoar({data:{foo:null}});
    var emitter = store.emitter({
      init: function(){
        assert.strictEqual(this.store, store);
        done();
      }
    });
  });

  it('emitter method should have this.store', function(done){
    var store = new Stoar({data:{foo:null}});
    var emitter = store.emitter({
      'change:foo': function(){
        assert.strictEqual(this.store, store);
        done();
      }
    });
    store.set('foo', true);
  });
});

