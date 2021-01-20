/*
  Char codes:
    '#': 35
    '*': 42
    '-': 45
    '/': 47
    ':': 58
    ';': 59
    '?': 63
*/

const http = require('http')
const fastDecode = require('fast-decode-uri-component')
const Node = require('./node')
const NODE_TYPES = Node.prototype.types
const httpMethods = http.METHODS
const FULL_PATH_REGEXP = /^https?:\/\/.*?\//

function Router () {
  this.onBadUrl = null
  this.defaultRoute = null
  this.caseSensitive = true
  this.ignoreTrailingSlash = false
  this.maxParamLength = 100
  this.trees = {}
  this.routes = []
}

Router.prototype.on = function on (method, path, opts, handler) {
  if (typeof opts === 'function') {
    handler = opts
    opts = {}
  }
  
  this._on(method, path, opts, handler)

  if (this.ignoreTrailingSlash && path !== '/' && !path.endsWith('*')) {
    if (path.endsWith('/')) {
      this._on(method, path.slice(0, -1), opts, handler)
    } else {
      this._on(method, path + '/', opts, handler)
    }
  }
}

Router.prototype._on = function _on (method, path, opts, handler) {
  if (Array.isArray(method)) {
    for (var k = 0; k < method.length; k++) {
      this._on(method[k], path, opts, handler)
    }
    return
  }

  const params = []
  var j = 0

  this.routes.push({
    method: method,
    path: path,
    opts: opts,
    handler: handler
  })

  for (var i = 0, len = path.length; i < len; i++) {
    // search for parametric or wildcard routes
    // parametric route
    if (path.charCodeAt(i) === 58) {
      var nodeType = NODE_TYPES.PARAM
      j = i + 1
      var staticPart = path.slice(0, i)

      if (this.caseSensitive === false) {
        staticPart = staticPart.toLowerCase()
      }

      // add the static part of the route to the tree
      this._insert(method, staticPart, NODE_TYPES.STATIC, null, null, null, null)

      // isolate the parameter name
      while (i < len && path.charCodeAt(i) !== 47) {
        if (path.charCodeAt(i) !== 45) {
          i++
        } else {
          break
        }
      }

      if (i < len && path.charCodeAt(i) !== 47) {
        nodeType = NODE_TYPES.MULTI_PARAM
      }

      var parameter = path.slice(j, i)
    
      params.push(parameter.slice(0, i))

      path = path.slice(0, j) + path.slice(i)
      i = j
      len = path.length

      // if the path is ended
      if (i === len) {
        var completedPath = path.slice(0, i)
        if (this.caseSensitive === false) {
          completedPath = completedPath.toLowerCase()
        }
        return this._insert(method, completedPath, nodeType, params, handler)
      }
      // add the parameter and continue with the search
      staticPart = path.slice(0, i)
      if (this.caseSensitive === false) {
        staticPart = staticPart.toLowerCase()
      }
      this._insert(method, staticPart, nodeType, params, null, null)

      i--
    // wildcard route
    } else if (path.charCodeAt(i) === 42) {
      this._insert(method, path.slice(0, i), NODE_TYPES.STATIC, null, null, null, null)
      // add the wildcard parameter
      params.push('*')
      return this._insert(method, path.slice(0, len), NODE_TYPES.MATCH_ALL, params, handler, null)
    }
  }

  if (this.caseSensitive === false) {
    path = path.toLowerCase()
  }

  // static route
  this._insert(method, path, NODE_TYPES.STATIC, params, handler, null)
}

Router.prototype._insert = function _insert (method, path, kind, params, handler) {
  const route = path
  var prefix = ''
  var pathLen = 0
  var prefixLen = 0
  var len = 0
  var max = 0
  var node = null

  var currentNode = this.trees[method]
  if (typeof currentNode === 'undefined') {
    currentNode = new Node({ method: method })
    this.trees[method] = currentNode
  }

  while (true) {
    prefix = currentNode.prefix
    prefixLen = prefix.length
    pathLen = path.length
    len = 0

    // search for the longest common prefix
    max = pathLen < prefixLen ? pathLen : prefixLen
    while (len < max && path[len] === prefix[len]) len++

    // the longest common prefix is smaller than the current prefix
    // let's split the node and add a new child
    if (len < prefixLen) {
      node = new Node(
        {
          method: method,
          prefix: prefix.slice(len),
          children: currentNode.children,
          kind: currentNode.kind,
          handler: currentNode.handler
        }
      )
      if (currentNode.wildcardChild !== null) {
        node.wildcardChild = currentNode.wildcardChild
      }

      // reset the parent
      currentNode
        .reset(prefix.slice(0, len))
        .addChild(node)

      // if the longest common prefix has the same length of the current path
      // the handler should be added to the current node, to a child otherwise
      if (len === pathLen) {
          currentNode.setHandler(handler, params)
          currentNode.kind = kind
      } else {
        node = new Node({
          method: method,
          prefix: path.slice(len),
          kind: kind,
          handlers: null
        })
       
        node.setHandler(handler, params)
        currentNode.addChild(node)
      }

    // the longest common prefix is smaller than the path length,
    // but is higher than the prefix
    } else if (len < pathLen) {
      // remove the prefix
      path = path.slice(len)
      // check if there is a child with the label extracted from the new path
      node = currentNode.findByLabel(path)
      // there is a child within the given label, we must go deepen in the tree
      if (node) {
        currentNode = node
        continue
      }
      // there are not children within the given label, let's create a new one!
      node = new Node({ method: method, prefix: path, kind: kind })
      node.setHandler(handler, params)
      currentNode.addChild(node)

    // the node already exist
    } else if (handler) {
        currentNode.setHandler(handler, params)
    }
    return
  }
}

Router.prototype.reset = function reset () {
  this.trees = {}
  this.routes = []
}

Router.prototype.off = function off (method, path) {
  var self = this

  if (Array.isArray(method)) {
    return method.map(function (method) {
      return self.off(method, path)
    })
  }

  // Rebuild tree without the specific route
  const ignoreTrailingSlash = this.ignoreTrailingSlash
  var newRoutes = self.routes.filter(function (route) {
    if (!ignoreTrailingSlash) {
      return !(method === route.method && path === route.path)
    }
    if (path.endsWith('/')) {
      const routeMatches = path === route.path || path.slice(0, -1) === route.path
      return !(method === route.method && routeMatches)
    }
    const routeMatches = path === route.path || (path + '/') === route.path
    return !(method === route.method && routeMatches)
  })
  if (ignoreTrailingSlash) {
    newRoutes = newRoutes.filter(function (route, i, ar) {
      if (route.path.endsWith('/') && i < ar.length - 1) {
        return route.path.slice(0, -1) !== ar[i + 1].path
      } else if (route.path.endsWith('/') === false && i < ar.length - 1) {
        return (route.path + '/') !== ar[i + 1].path
      }
      return true
    })
  }
  self.reset()
  newRoutes.forEach(function (route) {
    self.on(route.method, route.path, route.opts, route.handler)
  })
}

Router.prototype.lookup = function lookup (req, res) {
  var handle = this.find(req.method, sanitizeUrl(req.url))
  if (handle === null) return this._defaultRoute(req, res)
  return handle.handler(req, res, handle.params)
}

Router.prototype.find = function find (method, path) {
  var currentNode = this.trees[method]
  if (!currentNode) return null

  // if (path.charCodeAt(0) !== 47) { // 47 is '/'
  //   path = path.replace(FULL_PATH_REGEXP, '/')
  // }

  var originalPath = path
  var originalPathLength = path.length

  if (this.caseSensitive === false) {
    path = path.toLowerCase()
  }

  var maxParamLength = this.maxParamLength
  var wildcardNode = null
  var pathLenWildcard = 0
  var decoded = null
  var pindex = 0
  var params = []
  var i = 0
  var idxInOriginalPath = 0

  while (true) {
    var pathLen = path.length
    var prefix = currentNode.prefix
    var prefixLen = prefix.length
    var len = 0
    var previousPath = path
    // found the route
    if (pathLen === 0 || path === prefix) {
      var handle = currentNode.handler
      if (handle !== null && handle !== undefined) {
        var paramsObj = {}
        if (handle.paramsLength > 0) {
          var paramNames = handle.params

          for (i = 0; i < handle.paramsLength; i++) {
            paramsObj[paramNames[i]] = params[i]
          }
        }

        return {
          handler: handle.handler,
          params: paramsObj
        }
      }
    }

    // search for the longest common prefix
    i = pathLen < prefixLen ? pathLen : prefixLen
    while (len < i && path.charCodeAt(len) === prefix.charCodeAt(len)) len++

    if (len === prefixLen) {
      path = path.slice(len)
      pathLen = path.length
      idxInOriginalPath += len
    }

    var node = currentNode.findChild(path)

    if (node === null) {
      node = currentNode.parametricBrother
      if (node === null) {
        return this._getWildcardNode(wildcardNode, originalPath, pathLenWildcard)
      }

      var goBack = previousPath.charCodeAt(0) === 47 ? previousPath : '/' + previousPath
      if (originalPath.indexOf(goBack) === -1) {
        // we need to know the outstanding path so far from the originalPath since the last encountered "/" and assign it to previousPath.
        // e.g originalPath: /aa/bbb/cc, path: bb/cc
        // outstanding path: /bbb/cc
        var pathDiff = originalPath.slice(0, originalPathLength - pathLen)
        previousPath = pathDiff.slice(pathDiff.lastIndexOf('/') + 1, pathDiff.length) + path
      }
      idxInOriginalPath = idxInOriginalPath -
        (previousPath.length - path.length)
      path = previousPath
      pathLen = previousPath.length
      len = prefixLen
    }

    var kind = node.kind

    // static route
    if (kind === NODE_TYPES.STATIC) {
      // if exist, save the wildcard child
      if (currentNode.wildcardChild !== null) {
        wildcardNode = currentNode.wildcardChild
        pathLenWildcard = pathLen
      }
      currentNode = node
      continue
    }

    if (len !== prefixLen) {
      return this._getWildcardNode(wildcardNode, originalPath, pathLenWildcard)
    }

    // if exist, save the wildcard child
    if (currentNode.wildcardChild !== null) {
      wildcardNode = currentNode.wildcardChild
      pathLenWildcard = pathLen
    }

    // parametric route
    if (kind === NODE_TYPES.PARAM) {
      currentNode = node
      i = path.indexOf('/')
      if (i === -1) i = pathLen
      if (i > maxParamLength) return null
      decoded = fastDecode(originalPath.slice(idxInOriginalPath, idxInOriginalPath + i))
      if (decoded === null) {
        return this.onBadUrl !== null
          ? this._onBadUrl(originalPath.slice(idxInOriginalPath, idxInOriginalPath + i))
          : null
      }
      params[pindex++] = decoded
      path = path.slice(i)
      idxInOriginalPath += i
      continue
    }

    // wildcard route
    if (kind === NODE_TYPES.MATCH_ALL) {
      decoded = fastDecode(originalPath.slice(idxInOriginalPath))
      if (decoded === null) {
        return this.onBadUrl !== null
          ? this._onBadUrl(originalPath.slice(idxInOriginalPath))
          : null
      }
      params[pindex] = decoded
      currentNode = node
      path = ''
      continue
    }

    // multiparametric route
    if (kind === NODE_TYPES.MULTI_PARAM) {
      currentNode = node
      i = 0
      if (node.regex !== null) {
        var matchedParameter = path.match(node.regex)
        if (matchedParameter === null) return null
        i = matchedParameter[1].length
      } else {
        while (i < pathLen && path.charCodeAt(i) !== 47 && path.charCodeAt(i) !== 45) i++
        if (i > maxParamLength) return null
      }
      decoded = fastDecode(originalPath.slice(idxInOriginalPath, idxInOriginalPath + i))
      if (decoded === null) {
        return this.onBadUrl !== null
          ? this._onBadUrl(originalPath.slice(idxInOriginalPath, idxInOriginalPath + i))
          : null
      }
      params[pindex++] = decoded
      path = path.slice(i)
      idxInOriginalPath += i
      continue
    }

    wildcardNode = null
  }
}

Router.prototype._getWildcardNode = function (node, path, len) {
  if (node === null) return null
  var decoded = fastDecode(path.slice(-len))
  if (decoded === null) {
    return this.onBadUrl !== null
      ? this._onBadUrl(path.slice(-len))
      : null
  }
  var handle = node.handler
  if (handle !== null && handle !== undefined) {
    return {
      handler: handle.handler,
      params: { '*': decoded }
    }
  }
  return null
}

Router.prototype._defaultRoute = function (req, res) {
  if (this.defaultRoute !== null) {
    return this.defaultRoute(req, res)
  } else {
    res.statusCode = 404
    res.end()
  }
}

Router.prototype._onBadUrl = function (path) {
  const onBadUrl = this.onBadUrl
  return {
    handler: (req, res) => onBadUrl(path, req, res),
    params: {}
  }
}

for (var i in http.METHODS) {
  /* eslint no-prototype-builtins: "off" */
  if (!http.METHODS.hasOwnProperty(i)) continue
  const m = http.METHODS[i]
  const methodName = m.toLowerCase()

  if (Router.prototype[methodName]) throw new Error('Method already exists: ' + methodName)

  Router.prototype[methodName] = function (path, handler) {
    return this.on(m, path, handler)
  }
}

Router.prototype.all = function (path, handler) {
  this.on(httpMethods, path, handler)
}

module.exports = Router

function sanitizeUrl (url) {
  for (var i = 0, len = url.length; i < len; i++) {
    var charCode = url.charCodeAt(i)
    // Some systems do not follow RFC and separate the path and query
    // string with a `;` character (code 59), e.g. `/foo;jsessionid=123456`.
    // Thus, we need to split on `;` as well as `?` and `#`.
    if (charCode === 63 || charCode === 59 || charCode === 35) {
      return url.slice(0, i)
    }
  }
  return url
}
