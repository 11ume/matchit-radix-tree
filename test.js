import { createServer } from 'http'
import Router from './index.js'

const r = new Router()
r.on('GET', '/users/:foo/:id', (req, res, params) => {
    res.end('{"message":"hello world"}' + params.foo + params.id)
})

r.on('GET', '/cats/:foo/:id', (req, res, params) => {
    res.end('{"cats":"hello world"}' + params.foo + params.id)
})

const server = createServer((req, res) => {
    r.lookup(req, res)
})

server.listen(3000, err => {
    if (err) throw err
    console.log('Server listening on: http://localhost:3000')
})
