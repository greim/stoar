
/*
 * MOCHA TESTS
 * http://visionmedia.github.com/mocha/
 */

var assert = require('assert');
var await = require('await');
var Stoar = require('../index');

describe('stoar', function(){

  it('should construct with data', function(){
    new Stoar({data:{}});
  });

  it('should construct with defs', function(){
    new Stoar({defs:{}});
  });

  it('should get data', function(){
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

  it('should throw when mutables are set to same value', function(){
    var obj = {}
    var store = new Stoar({data:{foo:obj}});
    assert.throws(function(){
      store.set('foo', obj);
    })
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

describe('items', function(){

  it('should validate at start', function(){
    assert.throws(function(){
      var store = new Stoar({
        defs: { count:{
          value: -1,
          validate: function(count){
            if (count < 0) throw 'bad'
          }
        }}
      })
    }, /bad/)
  })

  describe('accessors', function(){

    it('should get', function(){
      var store = new Stoar({
        data: { foo:'bar' }
      })
      assert.strictEqual(store.get('foo'), 'bar')
    })

    it('should clone', function(){
      var obj = {blah:3}
      var store = new Stoar({
        data: { foo:obj }
      })
      var obj2 = store.clone('foo')
      assert.ok(obj !== obj2)
      assert.deepEqual(obj, obj2)
    })

    it('should shallow clone', function(){
      var obj = {blah:{blah:2}}
      var store = new Stoar({
        data: { foo:obj }
      })
      var obj2 = store.clone('foo')
      assert.ok(obj !== obj2)
      assert.ok(obj.blah === obj2.blah)
      assert.deepEqual(obj, obj2)
    })

    it('should deep clone', function(){
      var obj = {blah:{blah:2}}
      var store = new Stoar({
        data: { foo:obj }
      })
      var obj2 = store.clone('foo', true)
      assert.ok(obj !== obj2)
      assert.ok(obj.blah !== obj2.blah)
      assert.deepEqual(obj, obj2)
    })
  })

  describe('mutators', function(){

    it('should set', function(){
      var store = new Stoar({
        data: { foo:'bar' }
      })
      store.set('foo', 'baz')
      assert.strictEqual(store.get('foo'), 'baz')
    })

    it('should not set unknown prop', function(){
      var store = new Stoar({
        data: { foo:'bar' }
      })
      assert.throws(function(){
        store.set('x', 'baz')
      })
    })

    it('should change on set', function(done){
      var store = new Stoar({
        data: { foo:'bar' }
      })
      store.on('propChange', function(prop, change){
        assert.strictEqual(prop, 'foo')
        assert.strictEqual(change.oldVal, 'bar')
        assert.strictEqual(change.newVal, 'baz')
        done()
      })
      store.set('foo', 'baz')
    })

    it('should unset', function(){
      var store = new Stoar({
        data: { foo:'bar' }
      })
      assert.strictEqual(store.get('foo'), 'bar')
      store.unset('foo')
      assert.strictEqual(store.get('foo'), undefined)
    })

    it('should change on unset', function(done){
      var store = new Stoar({
        data: { foo:'bar' }
      })
      store.on('propChange', function(prop, change){
        assert.strictEqual(prop, 'foo')
        assert.strictEqual(change.oldVal, 'bar')
        assert.strictEqual(change.newVal, undefined)
        done()
      })
      store.unset('foo')
    })

    it('should validate on set', function(){
      var store = new Stoar({
        defs: { count:{
          value: 0,
          validate: function(count){
            if (count < 0) throw 'bad'
          }
        }}
      })
      store.set('count', 1)
      assert.throws(function(){
        store.set('count', -1)
      }, /bad/)
    })
  })
})

describe('maps', function(){

  it('should validate at start', function(){
    assert.throws(function(){
      var store = new Stoar({
        defs: { counts:{
          type: 'map',
          value: {a:-1},
          validate: function(count){
            if (count < 0) throw new Error('bad')
          }
        }}
      })
    })
  })

  describe('accessors', function(){

    it('should get', function(){
      var store = new Stoar({
        defs: { foo:{
          type: 'map',
          value: {a:1}
        }}
      })
      assert.strictEqual(store.get('foo', 'a'), 1)
    })

    it('should get undefined', function(){
      var store = new Stoar({
        defs: { foo:{
          type: 'map',
          value: {a:1}
        }}
      })
      assert.strictEqual(store.get('foo', 'b'), undefined)
    })

    it('should clone', function(){
      var obj = {blah:3}
      var store = new Stoar({
        defs: { foo:{
          type: 'map',
          value: {a:obj}
        }}
      })
      var obj2 = store.clone('foo', 'a')
      assert.ok(obj !== obj2)
      assert.deepEqual(obj, obj2)
    })

    it('should clone undefined', function(){
      var store = new Stoar({
        defs: { foo:{
          type: 'map',
          value: {}
        }}
      })
      var obj = store.clone('foo', 'a')
      assert.deepEqual(obj, undefined)
    })

    it('should clone null', function(){
      var store = new Stoar({
        defs: { foo:{
          type: 'map',
          value: {a:null}
        }}
      })
      var obj = store.clone('foo', 'a')
      assert.deepEqual(obj, null)
    })

    it('should shallow clone', function(){
      var obj = {blah:{blah:2}}
      var store = new Stoar({
        defs: { foo:{
          type: 'map',
          value: {a:obj}
        }}
      })
      var obj2 = store.clone('foo', 'a')
      assert.ok(obj !== obj2)
      assert.ok(obj.blah === obj2.blah)
      assert.deepEqual(obj, obj2)
    })

    it('should deep clone', function(){
      var obj = {blah:{blah:2}}
      var store = new Stoar({
        defs: { foo:{
          type: 'map',
          value: {a:obj}
        }}
      })
      var obj2 = store.clone('foo', 'a', true)
      assert.ok(obj !== obj2)
      assert.ok(obj.blah !== obj2.blah)
      assert.deepEqual(obj, obj2)
    })

    it('should getAll', function(){
      var store = new Stoar({defs:{
        flags: {
          type: 'map',
          value: {
            foo:true
          }
        }
      }})
      assert.deepEqual(store.getAll('flags'),{foo:true})
    })

    it('getAll should copy', function(){
      var flags = {foo:true}
      var store = new Stoar({defs:{
        flags: {
          type: 'map',
          value: flags
        }
      }})
      var flags2 = store.getAll('flags')
      assert.deepEqual(flags,flags2)
      assert.ok(flags !== flags2)
    })

    it('should has', function(){
      var store = new Stoar({defs:{
        flags: {
          type: 'map',
          value: {
            foo:true,
            baz:undefined
          }
        }
      }})
      assert.ok(store.has('flags','foo'))
      assert.ok(!store.has('flags','bar'))
      assert.ok(store.has('flags','baz'))
    })

    it('should keys', function(){
      var store = new Stoar({defs:{
        flags: {
          type: 'map',
          value: {
            foo:true,
            bar:false
          }
        }
      }})
      assert.deepEqual(store.keys('flags'),['foo','bar'])
    })

    it('should values', function(){
      var store = new Stoar({defs:{
        flags: {
          type: 'map',
          value: {
            foo:true,
            bar:false
          }
        }
      }})
      assert.deepEqual(store.values('flags'),[true,false])
    })

    it('should forEach', function(){
      var store = new Stoar({defs:{
        flags: {
          type: 'map',
          value: {
            foo:true,
            bar:false
          }
        }
      }})
      var count = 0
      store.forEach('flags',function(val, key){
        if (count === 0){
          assert.strictEqual(val, true)
          assert.strictEqual(key, 'foo')
        } else if (count === 1){
          assert.strictEqual(val, false)
          assert.strictEqual(key, 'bar')
        }
        count++
      })
      assert.strictEqual(count, 2)
    })

    it('should forEach with ctx', function(){
      var store = new Stoar({defs:{
        flags: {
          type: 'map',
          value: {
            bar:false
          }
        }
      }})
      var that = {}
      store.forEach('flags',function(val, key){
        assert.strictEqual(that, this)
      }, that)
    })
  })

  describe('mutators', function(){

    it('should set', function(){
      var store = new Stoar({
        defs: { foo:{
          type: 'map',
          value: {a:1}
        }}
      })
      store.set('foo', 'a', 2)
      assert.strictEqual(store.get('foo', 'a'), 2)
    })

    it('should change on set', function(done){
      var store = new Stoar({
        defs: { foo:{
          type: 'map',
          value: {a:1}
        }}
      })
      store.on('propChange',function(prop, ch){
        assert.strictEqual(prop, 'foo')
        assert.strictEqual(ch.oldVal, 1)
        assert.strictEqual(ch.newVal, 2)
        assert.strictEqual(ch.key, 'a')
        done()
      })
      store.set('foo', 'a', 2)
    })

    it('should validate set', function(){
      var store = new Stoar({
        defs: { foo:{
          type: 'map',
          value: {a:1},
          validate: function(val){
            if (val < 0) throw 'bad'
          }
        }}
      })
      assert.throws(function(){
        store.set('foo', 'a', -1)
      }, /bad/)
    })

    it('should unset', function(){
      var store = new Stoar({
        defs: { foo:{
          type: 'map',
          value: {a:1}
        }}
      })
      assert.ok(store.has('foo','a'))
      store.unset('foo', 'a')
      assert.strictEqual(store.get('foo','a'), undefined)
      assert.ok(!store.has('foo','a'))
    })

    it('should change on unset', function(done){
      var store = new Stoar({
        defs: { foo:{
          type: 'map',
          value: {a:1}
        }}
      })
      store.on('propChange',function(prop, ch){
        assert.strictEqual(prop, 'foo')
        assert.strictEqual(ch.oldVal, 1)
        assert.strictEqual(ch.newVal, undefined)
        assert.strictEqual(ch.key, 'a')
        done()
      })
      store.unset('foo', 'a')
    })

    it('should setAll', function(){
      var store = new Stoar({defs:{
        flags: {
          type: 'map',
          value: {
            foo:true
          }
        }
      }})
      store.setAll('flags', {bar:false,baz:true})
      assert.deepEqual(store.getAll('flags'),{foo:true,bar:false,baz:true})
    })

    it('should change on setAll', function(done){
      var store = new Stoar({defs:{
        flags: {
          type: 'map',
          value: {
            foo:true,
            bar:false
          }
        }
      }})
      var pr = await('baz','bar').onkeep(function(){done()})
      store.on('propChange',function(prop, ch){
        assert.strictEqual(prop, 'flags')
        if (ch.key === 'baz'){
          assert.strictEqual(ch.oldVal, undefined)
          assert.strictEqual(ch.newVal, true)
          pr.keep('baz')
        } else if (ch.key === 'bar'){
          assert.strictEqual(ch.oldVal, false)
          assert.strictEqual(ch.newVal, true)
          pr.keep('bar')
        } else {
          done('bad key')
        }
      })
      store.setAll('flags', {baz:true,bar:true})
    })

    it('should validate setAll', function(){
      var store = new Stoar({
        defs: { foo:{
          type: 'map',
          value: {a:1},
          validate: function(val){
            if (val < 0) throw 'bad'
          }
        }}
      })
      assert.throws(function(){
        store.setAll('foo', {x:-1})
      }, /bad/)
    })

    it('should resetAll', function(){
      var store = new Stoar({defs:{
        flags: {
          type: 'map',
          value: {
            foo:true
          }
        }
      }})
      store.resetAll('flags', {bar:false,baz:true})
      assert.deepEqual(store.getAll('flags'),{bar:false,baz:true})
    })

    it('should change on resetAll', function(done){
      var store = new Stoar({defs:{
        flags: {
          type: 'map',
          value: {
            foo:true
          }
        }
      }})
      var pr = await('baz','foo').onkeep(function(){done()})
      store.on('propChange',function(prop, ch){
        assert.strictEqual(prop, 'flags')
        if (ch.key === 'baz'){
          assert.strictEqual(ch.oldVal, undefined)
          assert.strictEqual(ch.newVal, true)
          pr.keep('baz')
        } else if (ch.key === 'foo'){
          assert.strictEqual(ch.oldVal, true)
          assert.strictEqual(ch.newVal, undefined)
          pr.keep('foo')
        } else {
          done('bad key')
        }
      })
      store.resetAll('flags', {baz:true})
    })

    it('should validate resetAll', function(){
      var store = new Stoar({
        defs: { foo:{
          type: 'map',
          value: {a:1},
          validate: function(val){
            if (val < 0) throw 'bad'
          }
        }}
      })
      assert.throws(function(){
        store.resetAll('foo', {x:-1})
      })
    })

    it('should clear', function(){
      var store = new Stoar({defs:{
        flags: {
          type: 'map',
          value: {
            foo:true
          }
        }
      }})
      store.clear('flags')
      assert.deepEqual(store.getAll('flags'),{})
    })

    it('should change on clear', function(done){
      var store = new Stoar({defs:{
        flags: {
          type: 'map',
          value: {
            foo:true
          }
        }
      }})
      store.on('propChange',function(prop, ch){
        assert.strictEqual(prop, 'flags')
        assert.strictEqual(ch.key, 'foo')
        assert.strictEqual(ch.oldVal, true)
        assert.strictEqual(ch.newVal, undefined)
        done()
      })
      store.clear('flags')
    })
  })
})

describe('lists', function(){

  it('should validate on start', function(){
    assert.throws(function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[false],validate:function(x){if(!x)throw 'bad'}}
      }})
    },/bad/)
  })

  describe('accessors', function(){

    it('should get', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:['zz']}
      }})
      assert.strictEqual(st.get('names', 0), 'zz')
    })

    it('should get undefined', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[]}
      }})
      assert.strictEqual(st.get('names', 0), undefined)
    })

    it('should clone', function(){
      var ob1 = {x:1}
      var st = new Stoar({defs:{
        names: {type:'list',value:[ob1]}
      }})
      var ob2 = st.clone('names',0)
      assert.deepEqual(ob1,ob2)
      assert.ok(ob1!==ob2)
    })

    it('should length', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[1,2,3]}
      }})
      assert.strictEqual(st.length('names'),3)
    })

    it('should getAll', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[2,3,4]}
      }})
      assert.deepEqual(st.getAll('names'),[2,3,4])
    })

    it('should getAll copy', function(){
      var names1 = [3,4,5]
      var st = new Stoar({defs:{
        names: {type:'list',value:names1}
      }})
      var names2 = st.getAll('names')
      assert.deepEqual(names1,names2)
      assert.ok(names1!==names2)
    })

    it('should filter', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[1,2,3,4]}
      }})
      var odds = st.filter('names',function(x){
        return x%2
      })
      assert.deepEqual(odds,[1,3])
    })

    it('should filter with context', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[1,2,3,4]}
      }})
      var that = {}
      var odds = st.filter('names',function(x){
        assert.strictEqual(that,this)
      }, that)
    })

    it('should map', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[0,1,2]}
      }})
      var dubs = st.map('names',function(x){
        return x*2
      })
      assert.deepEqual(dubs,[0,2,4])
    })

    it('should some', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[true,false]}
      }})
      assert.strictEqual(st.some('names',function(x){return x}),true)
    })

    it('should some false', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[false,false]}
      }})
      assert.strictEqual(st.some('names',function(x){return x}),false)
    })

    it('should every', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[true,true]}
      }})
      assert.strictEqual(st.every('names',function(x){return x}),true)
    })

    it('should every false', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[true,false]}
      }})
      assert.strictEqual(st.every('names',function(x){return x}),false)
    })

    it('should join', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[1,2,3]}
      }})
      assert.strictEqual(st.join('names','-'),'1-2-3')
    })

    it('should slice', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[6,7,8]}
      }})
      assert.deepEqual(st.slice('names'),st.getAll('names'))
    })

    it('should concat', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[2,3,4]}
      }})
      assert.deepEqual(st.concat('names', [5,6]),[2,3,4,5,6])
    })

    it('should indexOf', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[4,3,2]}
      }})
      assert.strictEqual(st.indexOf('names',3), 1)
    })
  })

  describe('mutators', function(){

    it('should set', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[]}
      }})
      st.set('names',0,4)
      assert.strictEqual(st.get('names',0),4)
    })

    it('should change on set', function(done){
      var st = new Stoar({defs:{
        names: {type:'list',value:[]}
      }})
      st.on('propChange',function(prop,ch){
        assert.strictEqual(prop,'names')
        assert.strictEqual(ch.oldVal,undefined)
        assert.strictEqual(ch.newVal,4)
        assert.strictEqual(ch.index,0)
        done()
      })
      st.set('names',0,4)
    })

    it('should set validate', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[],validate:function(x){if(!x)throw 'bad'}}
      }})
      st.set('names',0,true)
      assert.throws(function(){
        st.set('names',0,false)
      },/bad/)
    })

    it('should resetAll', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[1,2]}
      }})
      st.resetAll('names',[3,4])
      assert.deepEqual(st.getAll('names'),[3,4])
    })

    it('should change on resetAll', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[1,2]}
      }})
      var r = []
      st.on('propChange',function(prop,ch){
        assert.strictEqual(prop,'names')
        r.push(ch.oldVal,ch.newVal,ch.index)
      })
      st.resetAll('names',[3])
      assert.deepEqual(r,[1,3,0,2,undefined,1])
    })

    it('should resetAll validate', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[],validate:function(x){if(!x)throw 'bad'}}
      }})
      st.resetAll('names',[3,4])
      assert.throws(function(){
        st.resetAll('names',[3,false])
      },/bad/)
    })

    it('should clear', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[2,3,4]}
      }})
      st.clear('names')
      assert.deepEqual(st.getAll('names'),[])
    })

    it('should change on clear', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[1,2]}
      }})
      var r = []
      st.on('propChange',function(prop,ch){
        assert.strictEqual(prop,'names')
        r.push(ch.oldVal,ch.newVal,ch.index)
      })
      st.clear('names')
      assert.deepEqual(r,[1,undefined,0,2,undefined,1])
    })

    it('should push', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[1]}
      }})
      st.push('names','d')
      assert.deepEqual(st.getAll('names'),[1,'d'])
    })

    it('should change on push', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[1,2]}
      }})
      var r = []
      st.on('propChange',function(prop,ch){
        assert.strictEqual(prop,'names')
        r.push(ch.oldVal,ch.newVal,ch.index)
      })
      st.push('names','d')
      assert.deepEqual(r,[undefined,'d',2])
    })

    it('should push validate', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[],validate:function(x){if(!x)throw 'bad'}}
      }})
      st.push('names','d')
      assert.throws(function(){
        st.push('names',false)
      },/bad/)
    })

    it('should unshift', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[1]}
      }})
      st.unshift('names','d')
      assert.deepEqual(st.getAll('names'),['d',1])
    })

    it('should change on unshift', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[1]}
      }})
      var r = []
      st.on('propChange',function(prop,ch){
        assert.strictEqual(prop,'names')
        r.push(ch.oldVal,ch.newVal,ch.index)
      })
      st.unshift('names','d')
      assert.deepEqual(r,[1,'d',0,undefined,1,1])
    })

    it('should unshift validate', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[],validate:function(x){if(!x)throw 'bad'}}
      }})
      st.unshift('names','d')
      assert.throws(function(){
        st.unshift('names',false)
      },/bad/)
    })

    it('should pop', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[1,2]}
      }})
      assert.strictEqual(st.pop('names'),2)
      assert.deepEqual(st.getAll('names'),[1])
    })

    it('should change on pop', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[1,2]}
      }})
      var r = []
      st.on('propChange',function(prop,ch){
        assert.strictEqual(prop,'names')
        r.push(ch.oldVal,ch.newVal,ch.index)
      })
      st.pop('names')
      assert.deepEqual(r,[2,undefined,1])
    })

    it('should shift', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[3,4]}
      }})
      assert.strictEqual(st.shift('names'),3)
      assert.deepEqual(st.getAll('names'),[4])
    })

    it('should change on shift', function(){
      var st = new Stoar({defs:{
        names: {type:'list',value:[1,2]}
      }})
      var r = []
      st.on('propChange',function(prop,ch){
        assert.strictEqual(prop,'names')
        r.push(ch.oldVal,ch.newVal,ch.index)
      })
      st.shift('names')
      assert.deepEqual(r,[1,2,0,2,undefined,1])
    })
  })
})

describe('immutable', function(){

  it('should not set mutable to self', function(){
    var obj = {}
    var store = new Stoar({
      data: {foo:obj}
    })
    assert.throws(function(){
      store.set('foo',obj)
    })
  })

  it('should not change on immutable sameness', function(){
    var store = new Stoar({
      data: {foo:'w'}
    })
    store.on('propChange', function(){
      assert.ok(false)
    })
    store.set('foo','w')
  })

  it('should not change on immutable sameness null', function(){
    var store = new Stoar({
      data: {foo:null}
    })
    store.on('propChange', function(){
      assert.ok(false)
    })
    store.set('foo',null)
  })

  it('should not change on immutable sameness undefined', function(){
    var store = new Stoar({
      data: {foo:undefined}
    })
    store.on('propChange', function(){
      assert.ok(false)
    })
    store.set('foo',undefined)
  })

  it('should not change on immutable sameness function', function(){
    var fn = function(){}
    var store = new Stoar({
      data: {foo:fn}
    })
    store.on('propChange', function(){
      assert.ok(false)
    })
    store.set('foo',fn)
  })
})

describe('loadables', function(){

  it('should allow loadable', function(){
    var store = new Stoar({
      defs: {
        foo: {
          type: 'item',
          value: 4,
          loadable: true
        }
      }
    })
  })

  it('should allow loadable :loading', function(){
    var store = new Stoar({
      defs: {
        foo: {
          type: 'item',
          value: 4,
          loadable: true
        }
      }
    })
    store.set('foo:loading', true)
    assert.strictEqual(store.get('foo:loading'), true)
  })

  it('should allow loadable :status', function(){
    var store = new Stoar({
      defs: {
        foo: {
          type: 'item',
          value: 4,
          loadable: true
        }
      }
    })
    store.set('foo:status', 'currently loading')
    assert.strictEqual(store.get('foo:status'), 'currently loading')
  })

  it('should allow loadable :timestamp', function(){
    var store = new Stoar({
      defs: {
        foo: {
          type: 'item',
          value: 4,
          loadable: true
        }
      }
    })
    var time = Date.now()
    store.set('foo:timestamp', time)
    assert.strictEqual(store.get('foo:timestamp'), time)
  })
})











