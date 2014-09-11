
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
    var cdr = dsp.commander()
    assert.ok(cdr)
  })

  it('should not work twice', function(){
    var dsp = Stoar.dispatcher()
    var cdr1 = dsp.commander()
    assert.throws(function(){
      var cdr2 = dsp.commander()
    })
  })

  it('should send', function(done){
    var dsp = Stoar.dispatcher()
    var cdr = dsp.commander()
    var fooStore = Stoar.store({data:{foo:1}})
    dsp.registerStore(fooStore, function(action, payload){
      assert.strictEqual(action, 'foo')
      assert.strictEqual(payload, 'bar')
      done()
    })
    cdr.send('foo','bar')
  })

  it('should accept custom methods', function(done){
    var dsp = Stoar.dispatcher()
    var cdr = dsp.commander({
      foo: function(){
        this.send('x','y')
      }
    })
    var fooStore = Stoar.store({data:{foo:1}})
    dsp.registerStore(fooStore, function(action, payload){
      assert.strictEqual(action, 'x')
      assert.strictEqual(payload, 'y')
      done()
    })
    cdr.foo()
  })
})











