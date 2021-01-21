import { createServer } from 'http'
import Router from './index.js'

const r = new Router()
r.create('GET', '/users/:foo/:id', (req, res, params) => {
    res.end('{"message":"hello world"}' + params.foo + params.id)
})

const server = createServer((req, res) => {
    const found = r.lookup(req)
    found.handler(req, res, found.params)
})

server.listen(3000, err => {
    if (err) throw err
    console.log('Server listening on: http://localhost:3000')
})
