import test from 'ava'
import matcher from '../index.js'

test('route match base', (t) => {
    const r = matcher()
    const handler = () => false
    r.create('GET', '/', handler)
    const found = r.lookup('GET', '/')

    t.is(handler, found.handler)
})

test('route match without slash', (t) => {
    const r = matcher()
    const handler = () => false
    r.create('GET', 'foo', handler)
    const found = r.lookup('GET', 'foo')

    t.is(handler, found.handler)
    t.is('foo', 'foo')
})

test('route match base parametric', (t) => {
    const r = matcher()
    const handler = () => false
    r.create('GET', '/:id', handler)
    const found = r.lookup('GET', '/foo')

    t.is(handler, found.handler)
    t.is('foo', found.params.id)
})

test('route match base whit sigle path', (t) => {
    const r = matcher()
    const handler = () => false
    r.create('GET', '/users', handler)
    const found = r.lookup('GET', '/users')

    t.is(handler, found.handler)
})

test('route match base whit multi path', (t) => {
    const r = matcher()
    const handler = () => false
    r.create('GET', '/users/special', handler)
    const found = r.lookup('GET', '/users/special')

    t.is(handler, found.handler)
})

test('parametric route match, sigle param', (t) => {
    const r = matcher()
    const handler = () => false
    r.create('GET', '/users/:name', handler)
    const found = r.lookup('GET', '/users/john')

    t.is(handler, found.handler)
    t.deepEqual(found.params, {
        name: 'john'
    })
})

test('parametric route match multi param', (t) => {
    const r = matcher()
    const handler = () => false
    r.create('GET', '/users/:name/:surname', handler)
    const found = r.lookup('GET', '/users/john/carter')

    t.is(handler, found.handler)
    t.deepEqual(found.params, {
        name: 'john'
        , surname: 'carter'
    })
})

test('parametric route match only first param whit slash in the end', (t) => {
    const r = matcher()
    const handler = () => false
    r.create('GET', '/users/:name/:surname', handler)
    const found = r.lookup('GET', '/users/john/')

    t.is(handler, found.handler)
    t.deepEqual(found.params, {
        name: 'john'
        , surname: ''
    })
})

test('parametric routes match all must fail', (t) => {
    const r = matcher()
    const handler = () => false
    r.create('GET', '/users/:name/:surname', handler)

    const foundFistCase = r.lookup('GET', '/users/john/carter/')
    const foundCaseTwo = r.lookup('GET', '/users/john')
    const foundCaseThree = r.lookup('GET', '/users/')
    const foundCaseFour = r.lookup('GET', '/users')
    const foundCaseFive = r.lookup('GET', '/users/john/carter/a')

    t.is(foundFistCase, null)
    t.is(foundCaseTwo, null)
    t.is(foundCaseThree, null)
    t.is(foundCaseFour, null)
    t.is(foundCaseFive, null)
})
