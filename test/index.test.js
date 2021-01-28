import test from 'ava'
import RouteMatchEngine from '../index.js'

test('simple route', (t) => {
    const r = new RouteMatchEngine()
    const handler = () => false
    r.create('GET', '/users/:name/:surname', handler)
    const found = r.lookup({
        method: 'GET'
        , url: '/users/john/carter'
    })

    t.is(handler, found.handler)
    t.deepEqual(found.params, {
        name: 'john'
        , surname: 'carter'
    })
})

test('simple route match must fail', (t) => {
    const r = new RouteMatchEngine()
    const handler = () => false
    r.create('GET', '/users/:name/:surname', handler)
    const foundFistCase = r.lookup({
        method: 'GET'
        , url: '/users/john/carter/'
    })

    const foundCaseTwo = r.lookup({
        method: 'GET'
        , url: '/users/john'
    })

    const foundCaseThree = r.lookup({
        method: 'GET'
        , url: '/users/'
    })

    const foundCaseFour = r.lookup({
        method: 'GET'
        , url: '/users'
    })

    t.is(foundFistCase, null)
    t.is(foundCaseTwo, null)
    t.is(foundCaseThree, null)
    t.is(foundCaseFour, null)
})
