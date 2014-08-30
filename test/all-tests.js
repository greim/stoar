
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

  it('should clone', function(){
    var foo = {bar:'a'};
    var store = new Stoar({data:{foo:foo}});
    var clonedFoo = store.clone('foo');
    assert.deepEqual(foo, clonedFoo);
    assert.ok(foo !== clonedFoo);
  });

  it('should shallow clone', function(){
    var foo = {bar:{bar:'baz'}};
    var store = new Stoar({data:{foo:foo}});
    var clonedFoo = store.clone('foo');
    assert.deepEqual(foo, clonedFoo);
    assert.ok(foo !== clonedFoo);
    assert.ok(foo.bar === clonedFoo.bar);
  });

  it('should deep clone', function(){
    var foo = {bar:{baz:'a'}};
    var store = new Stoar({data:{foo:foo}});
    var clonedFoo = store.clone('foo', true);
    assert.deepEqual(foo, clonedFoo);
    assert.ok(foo.bar !== clonedFoo.bar);
  });

  it('deep cloning should allow non-json types', function(){
    var func = function(){}
    var foo = {bar:{baz:func}};
    var store = new Stoar({data:{foo:foo}});
    var clonedFoo = store.clone('foo', true);
    assert.deepEqual(foo, clonedFoo);
    assert.strictEqual(func, clonedFoo.bar.baz);
  });

  it('clone doesnt break on immutables', function(){
    var store = new Stoar({data:{foo:'foo'}});
    var clonedFoo = store.clone('foo');
    assert.strictEqual('foo', clonedFoo);
  });

  it('deep clone doesnt break on immutables', function(){
    var store = new Stoar({data:{foo:'foo'}});
    var clonedFoo = store.clone('foo', true);
    assert.strictEqual('foo', clonedFoo);
  });

  it('should clone arrays', function(){
    var foo = ['a','b','c'];
    var store = new Stoar({data:{foo:foo}});
    var clonedFoo = store.clone('foo');
    assert.deepEqual(foo, clonedFoo);
    assert.ok(foo !== clonedFoo);
  });

  it('should shallow clone arrays', function(){
    var foo = ['a','b',{x:'y'}];
    var store = new Stoar({data:{foo:foo}});
    var clonedFoo = store.clone('foo');
    assert.deepEqual(foo, clonedFoo);
    assert.ok(foo[2] === clonedFoo[2]);
  });

  it('should deep clone arrays', function(){
    var foo = ['a','b',{x:'y'}];
    var store = new Stoar({data:{foo:foo}});
    var clonedFoo = store.clone('foo', true);
    assert.deepEqual(foo, clonedFoo);
    assert.deepEqual(foo[2], clonedFoo[2]);
    assert.ok(foo[2] !== clonedFoo[2]);
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
      assert.strictEqual(store.get('foo'), true);
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

  it('dont block a default command if return truthy', function(done){
    var val = '';
    var store = new Stoar({data:{foo:null}});
    var emitter = store.emitter();
    var dispatcher = store.dispatcher({
      'change:foo': function(){
        val += 'a';
        return true;
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

  it('dispatcher method should receive all params', function(done){
    var store = new Stoar({data:{foo:null}});
    store.dispatcher({
      foo: function(a, b, c){
        assert.strictEqual(a, 1);
        assert.strictEqual(b, 2);
        assert.strictEqual(c, 3);
        done();
      }
    }).command('foo', 1, 2, 3);
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

  it('dont block a default emit when return undefined', function(done){
    var store = new Stoar({data:{foo:null}});
    var emitter = store.emitter({
      'change:foo': function(){}
    });
    emitter.on('change:foo', function(){
      done();
    });
    store.set('foo', true);
  });

  it('dont block a default emit when return truthy', function(done){
    var store = new Stoar({data:{foo:null}});
    var emitter = store.emitter({
      'change:foo': function(){
        return true;
      }
    });
    emitter.on('change:foo', function(){
      done();
    });
    store.set('foo', true);
  });

  it('block a default emit when return falsy', function(done){
    var store = new Stoar({data:{foo:null}});
    var emitter = store.emitter({
      'change:foo': function(){
        return false;
      }
    });
    emitter.on('change:foo', function(){
      throw new Error('didnt block');
    });
    store.set('foo', true);
    done();
  });

  it('should handle bare change event', function(){
    var res = '';
    var store = new Stoar({data:{foo:null}});
    var emitter = store.emitter({
      'change': function(prop, val, old){
        res += 'a';
        assert.strictEqual(prop, 'foo');
        assert.strictEqual(val, true);
        assert.strictEqual(old, null);
      }
    });
    emitter.on('change', function(prop, val, old){
      res += 'b';
      assert.strictEqual(prop, 'foo');
      assert.strictEqual(val, true);
      assert.strictEqual(old, null);
    });
    emitter.on('change:foo', function(val, old){
      res += 'c';
      assert.strictEqual(val, true);
      assert.strictEqual(old, null);
    });
    store.set('foo', true);
    assert.strictEqual(res, 'abc');
  });

  it('returning false from change should prevent change:foo', function(){
    var store = new Stoar({data:{foo:null}});
    var emitter = store.emitter({
      'change': function(){
        return false;
      }
    });
    emitter.on('change:foo', function(val, old){
      throw new Error('did not prevent');
    });
    store.set('foo', true);
  });

  it('should not emit when immutables are set to the same value', function(){
    var store = new Stoar({data:{foo:1}});
    var emitter = store.emitter();
    emitter.on('change:foo', function(){
      throw new Error('change event on immutable sameness');
    });
    store.set('foo', 1);
  });

  it('should not emit when null is set to null', function(){
    var store = new Stoar({data:{foo:null}});
    var emitter = store.emitter();
    emitter.on('change:foo', function(){
      throw new Error('change event on null sameness');
    });
    store.set('foo', null);
  });

  it('should not emit when undefined is set to undefined', function(){
    var store = new Stoar({data:{foo:undefined}});
    var emitter = store.emitter();
    emitter.on('change:foo', function(){
      throw new Error('change event on undefined sameness');
    });
    store.set('foo', undefined);
  });

  it('should emit when undefined is set to null', function(){
    var store = new Stoar({data:{foo:undefined}});
    var emitter = store.emitter();
    var success = false;
    emitter.on('change:foo', function(){
      success = true;
    });
    store.set('foo', null);
    assert.ok(success);
  });

  it('should emit when null is set to undefined', function(){
    var store = new Stoar({data:{foo:null}});
    var emitter = store.emitter();
    var success = false;
    emitter.on('change:foo', function(){
      success = true;
    });
    store.set('foo', undefined);
    assert.ok(success);
  });
});

