export const types = {
    STATIC: 0
    , PARAM: 1
    , MATCH_ALL: 2
    , REGEX: 3
    , MULTI_PARAM: 4
}

function Node (options = {}) {
    this.prefix = options.prefix || '/'
    this.label = this.prefix[0]
    this.children = options.children || {}
    this.numberOfChildren = Object.keys(this.children).length
    this.kind = options.kind || this.types.STATIC
    this.handler = options.handler
    this.wildcardChild = null
    this.parametricBrother = null
}

Object.defineProperty(Node.prototype, 'types', {
    value: types
})

Node.prototype.getLabel = function () {
    return this.prefix[0]
}

Node.prototype.addChild = function (node) {
    let label = ''
    switch (node.kind) {
        case this.types.STATIC:
            label = node.getLabel()
            break
        case this.types.PARAM:
        case this.types.REGEX:
        case this.types.MULTI_PARAM:
            label = ':'
            break
        case this.types.MATCH_ALL:
            this.wildcardChild = node
            label = '*'
            break
        default:
            throw new Error(`Unknown node kind: ${node.kind}`)
    }

    this.children[label] = node
    this.numberOfChildren = Object.keys(this.children).length

    const labels = Object.keys(this.children)
    let parametricBrother = this.parametricBrother
    for (let i = 0; i < labels.length; i++) {
        const child = this.children[labels[i]]
        if (child.label === ':') {
            parametricBrother = child
            break
        }
    }

    // Save the parametric brother inside static children
    const iterate = (nod) => {
        if (!nod) {
            return
        }

        if (nod.kind !== this.types.STATIC) {
            return
        }

        if (nod !== this) {
            nod.parametricBrother = parametricBrother || nod.parametricBrother
        }

        const lab = Object.keys(nod.children)
        for (let i = 0; i < lab.length; i++) {
            iterate(nod.children[lab[i]])
        }
    }

    iterate(this)

    return this
}

Node.prototype.reset = function (prefix) {
    this.prefix = prefix
    this.children = {}
    this.kind = this.types.STATIC
    this.handler = null
    this.numberOfChildren = 0
    this.wildcardChild = null
    return this
}

Node.prototype.findByLabel = function (path) {
    return this.children[path[0]]
}

Node.prototype.findChild = function (path) {
    let child = this.children[path[0]]
    if (child !== undefined && (child.numberOfChildren > 0 || child.handler !== null)) {
        if (path.slice(0, child.prefix.length) === child.prefix) {
            return child
        }
    }

    child = this.children[':']
    if (child !== undefined && (child.numberOfChildren > 0 || child.handler !== null)) {
        return child
    }

    child = this.children['*']
    if (child !== undefined && (child.numberOfChildren > 0 || child.handler !== null)) {
        return child
    }

    return null
}

Node.prototype.setHandler = function (handler, params) {
    if (!handler) return
    this.handler = {
        handler: handler
        , params: params
        , paramsLength: params.length
    }
}

export default Node
