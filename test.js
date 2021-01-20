const http = require('http')
const router = require('./index')

const r = new router()
r.on('GET', '/users/:id', (req, res, params) => {
  res.end('{"message":"hello world"}' + params.id)
})

const server = http.createServer((req, res) => {
  r.lookup(req, res)
})

server.listen(3000, err => {
  if (err) throw err
  console.log('Server listening on: http://localhost:3000')
})