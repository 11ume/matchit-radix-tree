import { create } from './indexFn.js'

const greet = () => {}

create('GET', '/a/foo/bar/e/:foo/:bar/:baz', greet)
