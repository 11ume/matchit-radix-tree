import { createServer } from 'http'
import Router from './index.js'

const r = new Router()

function handler(req, res, params) {
    res.end('{"message":"hello world"}' + params.i)
}

// curl http://localhost:3000/users/1/ :: only message
// curl http://localhost:3000/users/1/wild :: message + wild
// curl http://localhost:3000/users/asd :: never ends
// curl http://localhost:3000/users/ :: never ends
// curl http://localhost:3000/users :: status 404

// r.create('GET', '/users/:foo/:id', handler)
r.create('GET', '/u/:i', handler)
// r.create('GET', '/books/:genre/*', (req, res, params) => {
//     res.end('{"message":"hello world"}' + params.genre + params['*'])
// })

const notFound = (res) => {
    res.statusCode = 404
    res.end()
}

const server = createServer((req, res) => {
    const found = r.lookup(req)
    if (!found) return notFound(res)
    found.handler(req, res, found.params)
})

server.listen(3000, err => {
    if (err) throw err
    console.log('Server listening on: http://localhost:3000')
})
