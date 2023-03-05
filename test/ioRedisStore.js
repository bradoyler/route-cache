/* globals decribe */
'use strict'
const assert = require('assert')
const IoRedisStore = require('../ioRedisStore')
const sinon = require("sinon")


class FakeRedisClient {
  constructor() {
    this.reset()
  }

  async get(key) {
    const result = this.store.get(key)
    // IoRedis returns null when the key is not found.
    return Promise.resolve(result == undefined ? null : result)
  }

  async set(key, value, ttl) {
    this.store.set(key, value)
    return Promise.resolve()
  }

  async del(key) {
    this.store.delete(key)
    return Promise.resolve()
  }

  reset() {
    this.store = new Map()
  }
}

describe('# ioRedisStore test', function() {
  const fakeRedisClient = new FakeRedisClient()
  const store = new IoRedisStore(fakeRedisClient)

  afterEach(function() {
    sinon.restore()
    fakeRedisClient.reset()
  })

  it('returns undefined when not found', async function() {
    assert.equal(await store.get('foo'), undefined)
  })

  it('returns cached value', async function() {
    await store.set('foo', {value: 42})
    assert.deepEqual(await store.get('foo'), {value: 42})
  })

  it('serializes values', async function() {
    const setSpy = sinon.spy(fakeRedisClient, 'set')

    await store.set('foo', {value: 42})
    await store.set('foo', 42)

    assert(setSpy.calledTwice)
    assert.deepEqual(
      setSpy.firstCall.args,
      ['foo', '{"value":42}', 'PX', undefined]
    )

    assert.deepEqual(
      setSpy.secondCall.args,
      ['foo', '42', 'PX', undefined]
    )
  })

  it('sets ttl', async function() {
    const setSpy = sinon.spy(fakeRedisClient, 'set')
    await store.set('foo', {value: 42}, 1200)

    assert(setSpy.calledOnce)
    assert.deepEqual(
      setSpy.firstCall.args,
      ['foo', '{"value":42}', 'PX', 1200])
  })

  it('deletes values', async function() {
    await store.set('foo', {value:42})
    assert.deepEqual(await store.get('foo'), {value:42})
    await store.del('foo')
    assert.deepEqual(await store.get('foo'), undefined)
  })
})
