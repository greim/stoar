
/*
 * MOCHA TESTS
 * http://visionmedia.github.com/mocha/
 */

var assert = require('assert');
//var await = require('await');
var Stoar = require('../index');

describe('flux', function(){

  it('should allow store mutation', function(){
    var s = Stoar.store({
      data: { foo: 1 }
    })
    s.set('foo', 2)
    assert.strictEqual(s.get('foo'), 2)
  })

  it('should allow store mutation after registering', function(done){
    var d = Stoar.dispatcher()
    var c = d.commander()
    var s = Stoar.store({ data: { foo: 1 } })
    d.registerStore(s, function(action, payload){
      s.set('foo', 2)
      assert.strictEqual(s.get('foo'), 2)
      done()
    })
    c.send('foo','bar')
  })

  it('should disallow other store mutation after registering', function(done){
    var d = Stoar.dispatcher()
    var c = d.commander()
    var s1 = Stoar.store({ data: { foo: 1 } })
    var s2 = Stoar.store({ data: { bar: 1 } })
    d.registerStore(s2, function(action, payload){})
    d.registerStore(s1, function(action, payload){
      s1.set('foo', 2)
      assert.strictEqual(s1.get('foo'), 2)
      assert.throws(function(){
        s2.set('bar',2)
      })
      done()
    })
    c.send('foo','bar')
  })

  it('should disallow store mutation after registering outside callback', function(){
    var d = Stoar.dispatcher()
    var c = d.commander()
    var s = Stoar.store({ data: { foo: 1 } })
    d.registerStore(s, function(action, payload){})
    assert.throws(function(){
      s.set('foo',2)
    })
  })

  it('should allow other store mutation with waitFor', function(done){
    var d = Stoar.dispatcher()
    var c = d.commander()
    var s1 = Stoar.store({ data: { foo: 1 } })
    var s2 = Stoar.store({ data: { bar: 1 } })
    d.registerStore(s2, function(action, payload){
      s2.set('bar',3)
      done()
    })
    d.registerStore(s1, function(action, payload){
      s1.set('foo', 2)
      assert.strictEqual(s1.get('foo'), 2)
      this.waitFor(s2)
    })
    c.send('foo','bar')
  })

  it('should allow other store mutation with waitFor first', function(done){
    var d = Stoar.dispatcher()
    var c = d.commander()
    var s1 = Stoar.store({ data: { foo: 1 } })
    var s2 = Stoar.store({ data: { bar: 1 } })
    d.registerStore(s2, function(action, payload){})
    d.registerStore(s1, function(action, payload){
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
    var s1 = Stoar.store({ data: { foo: 1 } })
    var s2 = Stoar.store({ data: { bar: 1 } })
    d.registerStore(s2, function(action, payload){})
    d.registerStore(s1, function(action, payload){
      s1.set('foo', 2)
      assert.strictEqual(s1.get('foo'), 2)
      this.waitFor(s2)
      done()
    })
    c.send('foo','bar')
  })
})











