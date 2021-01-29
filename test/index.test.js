const test = require('ava')
const matcher = require('../index.js')

test('route match base', (t) => {
    const r = matcher()
    const handler = () => false
    r.create('GET', '/', handler)
    const found = r.lookup('GET', '/')

    t.is(handler, found.handler)
})

test('route match base multi handler', (t) => {
    const r = matcher()
    const handler = () => false
    const handlerTwo = () => true
    r.create('GET', '/', handler, handlerTwo)
    const found = r.lookup('GET', '/')

    const [h1, h2] = found.handlers
    t.is(h1, handler)
    t.is(h2, handlerTwo)
})

test('route match without slash', (t) => {
    const r = matcher()
    const handler = () => false
    r.create('GET', 'foo', handler)
    const found = r.lookup('GET', 'foo')

    t.is(handler, found.handler)
})

test('route match route wildcard', (t) => {
    const r = matcher()
    const handler = () => false
    r.create('GET', '/path/*', handler)
    const found = r.lookup('GET', '/path/foo')

    t.is(found.handler, handler)
    t.is(found.params['*'], 'foo')
})

test('route match route wildcard multi path', (t) => {
    const r = matcher()
    const handler = () => false
    r.create('GET', '/path/subpath/*', handler)
    const found = r.lookup('GET', '/path/subpath/bar')

    t.is(found.handler, handler)
    t.is(found.params['*'], 'bar')
})

test('route match base parametric', (t) => {
    const r = matcher()
    const handler = () => false
    r.create('GET', '/:id', handler)
    const found = r.lookup('GET', '/foo')

    t.is(found.handler, handler)
    t.is(found.params.id, 'foo')
})

test('route match base whit sigle path', (t) => {
    const r = matcher()
    const handler = () => false
    r.create('GET', '/path', handler)
    const found = r.lookup('GET', '/path')

    t.is(found.handler, handler)
})

test('route match base whit multi path', (t) => {
    const r = matcher()
    const handler = () => false
    r.create('GET', '/path/special', handler)
    const found = r.lookup('GET', '/path/special')

    t.is(found.handler, handler)
})

test('parametric route match, sigle param', (t) => {
    const r = matcher()
    const handler = () => false
    r.create('GET', '/path/:name', handler)
    const found = r.lookup('GET', '/path/john')

    t.is(found.handler, handler)
    t.deepEqual(found.params, {
        name: 'john'
    })
})

test('parametric route match multi param', (t) => {
    const r = matcher()
    const handler = () => false
    r.create('GET', '/path/:name/:surname', handler)
    const found = r.lookup('GET', '/path/john/carter')

    t.is(found.handler, handler)
    t.deepEqual(found.params, {
        name: 'john'
        , surname: 'carter'
    })
})

test('parametric route match only first param whit slash in the end', (t) => {
    const r = matcher()
    const handler = () => false
    r.create('GET', '/path/:name/:surname', handler)
    const found = r.lookup('GET', '/path/john/')

    t.is(found.handler, handler)
    t.deepEqual(found.params, {
        name: 'john'
        , surname: ''
    })
})

test('parametric routes match all must fail', (t) => {
    const r = matcher()
    const handler = () => false
    r.create('GET', '/path/:name/:surname', handler)

    const foundFistCase = r.lookup('GET', '/path/john/carter/')
    const foundCaseTwo = r.lookup('GET', '/path/john')
    const foundCaseThree = r.lookup('GET', '/path/')
    const foundCaseFour = r.lookup('GET', '/path')
    const foundCaseFive = r.lookup('GET', '/path/john/carter/a')

    t.is(foundFistCase, null)
    t.is(foundCaseTwo, null)
    t.is(foundCaseThree, null)
    t.is(foundCaseFour, null)
    t.is(foundCaseFive, null)
})
