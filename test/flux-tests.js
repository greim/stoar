
/*
 * MOCHA TESTS
 * http://visionmedia.github.com/mocha/
 */

var assert = require('assert');
//var await = require('await');
var Stoar = require('../index');

describe('flux', function(){

  it('should allow store mutation in callback', function(done){
    var d = Stoar.dispatcher()
    var c = d.commander()
    var s = d.store({ foo: 1 }, function(action, payload){
      s.set('foo', 2)
      assert.strictEqual(s.get('foo'), 2)
      done()
    })
    c.send('foo','bar')
  })

  it('should disallow other store mutation in callback', function(done){
    var d = Stoar.dispatcher()
    var c = d.commander()
    var s2 = d.store({ foo: 1 }, function(action, payload){})
    var s1 = d.store({ bar: 1 }, function(action, payload){
      s1.set('bar', 2)
      assert.strictEqual(s1.get('bar'), 2)
      assert.throws(function(){
        s2.set('foo',2)
      })
      done()
    })
    c.send('foo','bar')
  })

  it('should disallow store mutation outside callback', function(){
    var d = Stoar.dispatcher()
    var c = d.commander()
    var s = d.store({ foo: 1 }, function(action, payload){})
    assert.throws(function(){
      s.set('foo',2)
    })
  })

  it('should allow other store mutation with waitFor', function(done){
    var d = Stoar.dispatcher()
    var c = d.commander()
    var s2 = d.store({ bar: 1 }, function(action, payload){
      s2.set('bar',3)
      done()
    })
    var s1 = d.store({ foo: 1 }, function(action, payload){
      s1.set('foo', 2)
      assert.strictEqual(s1.get('foo'), 2)
      this.waitFor(s2)
    })
    c.send('foo','bar')
  })

  it('should allow other store mutation with waitFor first', function(done){
    var d = Stoar.dispatcher()
    var c = d.commander()
    var s2 = d.store({ bar: 1 }, function(action, payload){})
    var s1 = d.store({ foo: 1 }, function(action, payload){
      this.waitFor(s2)
      s1.set('foo', 2)
      assert.strictEqual(s1.get('foo'), 2)
      done()
    })
    c.send('foo','bar')
  })

  it('should allow other store mutation with waitFor last', function(done){
    var d = Stoar.dispatcher()
    var c = d.commander()
    var s2 = d.store({ bar: 1 }, function(action, payload){})
    var s1 = d.store({ foo: 1 }, function(action, payload){
      s1.set('foo', 2)
      assert.strictEqual(s1.get('foo'), 2)
      this.waitFor(s2)
      done()
    })
    c.send('foo','bar')
  })
})











