import Node, { NODE_TYPES } from './node.js'
import { sanitizeUrl, groupParams as paramsToObject } from './src/utils.js'

class Router {
    constructor({ maxParamLength = 100 } = {}) {
        this.trees = {}
        this.maxParamLength = maxParamLength
    }

    lookup(req) {
        const url = sanitizeUrl(req.url)
        return this.find(req.method, url)
    }

    isRouteFound(currentNode, paramsIn) {
        const handler = currentNode.handler
        if (handler !== null && handler !== undefined) {
            if (handler.paramsLength > 0) {
                const params = paramsToObject(handler, paramsIn, handler.params)
                return {
                    handler: handler.handler
                    , params
                }
            }

            return {
                handler: handler.handler
                , params: {}
            }
        }

        return null
    }

    find(method, inPath) {
        let path = inPath
        let currentNode = this.trees[method]

        // input params
        const paramsIn = []
        const originalPath = path
        const maxParamLength = this.maxParamLength
        const originalPathLength = path.length

        let i = 0
        let param = null
        let pindex = 0
        let wildcardNode = null
        let pathLenWildcard = 0
        let idxInOriginalPath = 0

        while (true) {
            const prefix = currentNode.prefix
            const prefixLen = prefix.length
            let len = 0
            let pathLen = path.length
            let previousPath = path

            // found the route
            if (pathLen === 0 || path === prefix) {
                const found = this.isRouteFound(currentNode, paramsIn)
                if (found) return found
            }

            // search for the longest common prefix
            i = pathLen < prefixLen ? pathLen : prefixLen
            while (len < i && path.charCodeAt(len) === prefix.charCodeAt(len)) {
                len++
            }

            if (len === prefixLen) {
                path = path.slice(len)
                pathLen = path.length
                idxInOriginalPath += len
            }

            let node = currentNode.findChild(path)

            if (node === null) {
                node = currentNode.parametricBrother
                if (node === null) {
                    this.getWildcardNode(wildcardNode, originalPath, pathLenWildcard)
                    return
                }

                const goBack = previousPath.charCodeAt(0) === 47 ? previousPath : '/' + previousPath
                if (originalPath.indexOf(goBack) === -1) {
                    // we need to know the outstanding path so far from the originalPath since the last encountered "/" and assign it to previousPath.
                    // e.g originalPath: /aa/bbb/cc, path: bb/cc
                    // outstanding path: /bbb/cc
                    const pathDiff = originalPath.slice(0, originalPathLength - pathLen)
                    previousPath = pathDiff.slice(pathDiff.lastIndexOf('/') + 1, pathDiff.length) + path
                }

                idxInOriginalPath = idxInOriginalPath - (previousPath.length - path.length)
                path = previousPath
                pathLen = previousPath.length
                len = prefixLen
            }

            const kind = node.kind

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
                this.getWildcardNode(wildcardNode, originalPath, pathLenWildcard)
                return
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
                if (i === -1) {
                    i = pathLen
                }

                if (i > maxParamLength) {
                    return null
                }

                param = originalPath.slice(idxInOriginalPath, idxInOriginalPath + i)
                if (param === null) {
                    return null
                }

                paramsIn[pindex++] = param
                path = path.slice(i)
                idxInOriginalPath += i
                continue
            }

            // wildcard route
            if (kind === NODE_TYPES.MATCH_ALL) {
                param = originalPath.slice(idxInOriginalPath)
                if (param === null) {
                    return null
                }

                paramsIn[pindex] = param
                currentNode = node
                path = ''
                continue
            }

            wildcardNode = null
        }
    }

    // search params in parametric route and search wildcard characters in routes
    serchParams(method, inPath, handler) {
        let path = inPath
        const params = []

        // /users/:id
        for (let i = 0, jump, len = path.length; i < len; i++) {
            // parametric route
            if (path[i] === ':') {
                const nodeType = NODE_TYPES.PARAM
                jump = i + 1
                let staticPart = path.slice(0, i)

                // add the static part of the route to the tree
                this.insert(method, staticPart, NODE_TYPES.STATIC, null, null)

                // isolate the parameter name :foo
                while (i < len && path[i] !== '/') {
                    i++
                }

                const parameter = path.slice(jump, i)
                params.push(parameter.slice(0, i))

                path = path.slice(0, jump) + path.slice(i)
                i = jump
                len = path.length

                // if the path is ended
                if (i === len) {
                    let completedPath = path.slice(0, i)
                    completedPath = completedPath.toLowerCase()
                    this.insert(method, completedPath, nodeType, params, handler)
                    return
                }

                // add the parameter and continue with the search
                staticPart = path.slice(0, i)
                staticPart = staticPart.toLowerCase()
                this.insert(method, staticPart, nodeType, params, null)

                i--
            } else if (path[i] === '*') {
                // wildcard route
                if (path[i] === '*') {
                    this.insert(method, path.slice(0, i), NODE_TYPES.STATIC, null, null)

                    // add the wildcard parameter
                    params.push('*')
                    this.insert(method, path.slice(0, len), NODE_TYPES.MATCH_ALL, params, handler)
                    return
                }
            }
        }

        // static route /users
        this.insert(method, path, NODE_TYPES.STATIC, params, handler)
    }

    // search for parametric or wildcard routes
    create(method, path, handler) {
        this.serchParams(method, path, handler)
    }

    insert(method, inPath, kind, params, handler) {
        let path = inPath
        let len = 0
        let max = 0
        let node = null
        let prefix = ''
        let pathLen = 0
        let prefixLen = 0
        let currentNode = this.trees[method]

        if (typeof currentNode === 'undefined') {
            currentNode = new Node()
            this.trees[method] = currentNode
        }

        while (true) {
            len = 0
            prefix = currentNode.prefix
            pathLen = path.length
            prefixLen = prefix.length

            // search for the longest common prefix
            max = pathLen < prefixLen ? pathLen : prefixLen
            while (len < max && path[len] === prefix[len]) {
                len++
            }

            // the longest common prefix is smaller than the current prefix
            // let's split the node and add a new child
            if (len < prefixLen) {
                node = new Node({
                    prefix: prefix.slice(len)
                    , children: currentNode.children
                    , kind: currentNode.kind
                    , handler: currentNode.handler
                })

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
                        prefix: path.slice(len)
                        , kind
                        , handlers: null
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
                node = new Node({
                    kind
                    , prefix: path
                })

                node.setHandler(handler, params)
                currentNode.addChild(node)
            }

            return
        }
    }

    getWildcardNode(node, path, len) {
        if (node === null) {
            return null
        }

        const param = path.slice(-len)
        if (param === null) {
            return null
        }

        const handle = node.handler
        if (handle !== null && handle !== undefined) {
            return {
                handler: handle.handler
                , params: {
                    '*': param
                }
            }
        }
        return null
    }
}

export default Router

