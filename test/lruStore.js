/* globals decribe */
'use strict'
const assert = require('assert')
const LruStore = require('../lruStore')
const LRU = require('lru-cache')

describe('# LRU Store test', function() {
  const store = new LruStore({max: 1})
  it('returns undefined when not found', async function() {
    assert.equal(await store.get('foo'), undefined)
  })

  it('returns cached value', async function() {
    await store.set('foo', 42)
    assert.equal(await store.get('foo'), 42)
  })

  it('uses passed-in arguments', async function() {
    await store.set('foo', 42)
    await store.set('bar', 43)

    assert.equal(await store.get('foo'), undefined)
    assert.equal(await store.get('bar'), 43)
  })

  it('deletes values', async function() {
    await store.set('foo', 42)
    assert.equal(await store.get('foo'), 42)
    await store.del('foo')
    assert.equal(await store.get('foo'), undefined)
  })
})
