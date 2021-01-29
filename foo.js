import matcher from './index.js'

const r = matcher()
const handler = () => false
r.create('GET', '/foo', handler, () => undefined)
const found = r.lookup('GET', '/foo')

console.log(found)
