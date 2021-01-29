import Router from './index.js'

const r = new Router()
function handler() {}

// curl http://localhost:3000/users/1/ :: only message
// curl http://localhost:3000/users/1/wild :: message + wild
// curl http://localhost:3000/users/asd :: never ends
// curl http://localhost:3000/users/ :: never ends
// curl http://localhost:3000/users :: status 404

r.create('GET', '/users/:foo/:bar', handler)

const found = r.lookup({
    method: 'GET'
    , url: '/users/foo/'
})
console.log(found)
