
/*
 * MOCHA TESTS
 * http://visionmedia.github.com/mocha/
 */

var assert = require('assert');
//var await = require('await');
var Stoar = require('../index');

describe('dispatcher', function(){

  it('should work', function(){
    var dsp = Stoar.dispatcher()
    assert.ok(dsp)
  })

  it('should dispatch', function(done){
    var dsp = Stoar.dispatcher()
    var fooStore = Stoar.store({data:{foo:1}})
    dsp.registerStore(fooStore, function(action, payload){
      assert.strictEqual(action, 'foo')
      assert.strictEqual(payload, 'bar')
      done()
    })
    dsp._send('foo','bar')
  })

  it('should run in order', function(){
    var order = ''
    var dsp = Stoar.dispatcher()
    var fooStore = Stoar.store({data:{foo:1}})
    var barStore = Stoar.store({data:{bar:1}})
    dsp.registerStore(fooStore, function(action, payload){
      order += 'a'
    })
    dsp.registerStore(barStore, function(action, payload){
      order += 'b'
    })
    dsp._send('foo','bar')
    assert.strictEqual(order, 'ab')
  })

  it('should waitFor', function(){
    var order = ''
    var dsp = Stoar.dispatcher()
    var fooStore = Stoar.store({data:{foo:1}})
    var barStore = Stoar.store({data:{bar:1}})
    dsp.registerStore(fooStore, function(action, payload){
      this.waitFor(barStore)
      order += 'a'
    })
    dsp.registerStore(barStore, function(action, payload){
      order += 'b'
    })
    dsp._send('foo','bar')
    assert.strictEqual(order, 'ba')
  })

  it('should fail on cyclic dependencies', function(){
    var dsp = Stoar.dispatcher()
    var fooStore = Stoar.store({data:{foo:1}})
    var barStore = Stoar.store({data:{bar:1}})
    dsp.registerStore(fooStore, function(action, payload){
      this.waitFor(barStore)
    })
    dsp.registerStore(barStore, function(action, payload){
      this.waitFor(fooStore)
    })
    assert.throws(function(){
      dsp._send('foo','bar')
    }, /cycle/)
  })

  it('should fail on indirect cyclic dependencies', function(){
    var dsp = Stoar.dispatcher()
    var fooStore = Stoar.store({data:{foo:1}})
    var barStore = Stoar.store({data:{bar:1}})
    var bazStore = Stoar.store({data:{baz:1}})
    dsp.registerStore(fooStore, function(action, payload){
      this.waitFor(barStore)
    })
    dsp.registerStore(barStore, function(action, payload){
      this.waitFor(bazStore)
    })
    dsp.registerStore(bazStore, function(action, payload){
      this.waitFor(fooStore)
    })
    assert.throws(function(){
      dsp._send('foo','bar')
    }, /cycle/)
  })

  it('should fail on duplicate registration', function(){
    var dsp = Stoar.dispatcher()
    var fooStore = Stoar.store({data:{foo:1}})
    dsp.registerStore(fooStore, function(){})
    assert.throws(function(){
      dsp.registerStore(fooStore, function(){})
    }, /already/)
  })
})











