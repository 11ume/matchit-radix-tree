// route finder engine
import Node, { NODE_TYPE } from './node.js'

// const trees = {}
// const insertNodeInTree = ({
//     method
//     , path
//     , type
//     , params = null
//     , handler = null
// }) => {
//     let altPath = path
//     let len = 0
//     let max = 0
//     let node = null
//     let prefix = ''
//     let pathLen = 0
//     let prefixLen = 0
//     let currentNode = trees[method]

//     if (typeof currentNode === 'undefined') {
//         currentNode = new Node()
//         trees[method] = currentNode
//     }

//     while (true) {
//         len = 0
//         prefix = currentNode.prefix
//         pathLen = altPath.length
//         prefixLen = prefix.length

//         // search for the longest common prefix
//         max = pathLen < prefixLen ? pathLen : prefixLen
//         while (len < max && altPath[len] === prefix[len]) {
//             len++
//         }

//         // the longest common prefix is smaller than the current prefix
//         // let's split the node and add a new child
//         if (len < prefixLen) {
//             node = new Node({
//                 prefix: prefix.slice(len)
//                 , children: currentNode.children
//                 , type: currentNode.type
//                 , handler: currentNode.handler
//             })

//             if (currentNode.wildcardChild !== null) {
//                 node.wildcardChild = currentNode.wildcardChild
//             }

//             // reset the parent
//             currentNode
//                 .reset(prefix.slice(0, len))
//                 .addChild(node)

//             // if the longest common prefix has the same length of the current path
//             // the handler should be added to the current node, to a child otherwise
//             if (len === pathLen) {
//                 currentNode.setHandler(handler, params)
//                 currentNode.type = type
//             } else {
//                 node = new Node({
//                     prefix: altPath.slice(len)
//                     , type
//                     , handlers: null
//                 })

//                 node.setHandler(handler, params)
//                 currentNode.addChild(node)
//             }

//             // the longest common prefix is smaller than the path length,
//             // but is higher than the prefix
//         } else if (len < pathLen) {
//             // remove the prefix
//             altPath = altPath.slice(len)
//             // check if there is a child with the label extracted from the new path
//             node = currentNode.findByLabel(altPath)
//             // there is a child within the given label, we must go deepen in the tree
//             if (node) {
//                 currentNode = node
//                 continue
//             }
//             // there are not children within the given label, let's create a new one!
//             node = new Node({
//                 type
//                 , prefix: altPath
//             })

//             node.setHandler(handler, params)
//             currentNode.addChild(node)
//         }

//         return
//     }
// }

// identificate route node chars by type
// parametric route chars ":"
// static route chars "/", "a", "b"
const idNodesByCharType = (path) => path
    .split('')
    .map((char, key) => {
        if (char === ':') {
            return {
                char
                , location: key
                , type: NODE_TYPE.PARAM
            }
        }

        return {
            char
            , location: key
            , type: NODE_TYPE.STATIC
        }
    })

// moves to the right until the end of the parameter, defined by the next closer slash
const findParamEndIndex = (path, char, i = 0) => {
    if (i < path.length && path[i] !== char) return findParamEndIndex(path, char, i + 1)
    return i
}

const removeParamName = (reducibles) => reducibles.split('').filter((char) => char === ':' || char === '/').join('')

// map only static parts of parametric route
const mapNodesByStaticPart = (path, nodes) => nodes.map((node) => {
    if (node.type === NODE_TYPE.PARAM) {
        const start = path.slice(0, node.location)
        const index = start.indexOf(':')
        if (index < 0) {
            return {
                ...node
                , staticPart: start
            }
        }

        const params = start.slice(index, node.location)
        const str = removeParamName(params)
        const staticPart = start.slice(0, index) + str
        return {
            ...node
            , staticPart
        }
    }

    return {
        ...node
    }
})

// isolate the parameters names
const mapNodesByParams = (path, nodes) => nodes
    .map(node => {
        if (node.type !== NODE_TYPE.PARAM) {
            return {
                ...node
            }
        }

        const jumpChar = node.location + 1
        const paramEndIndex = findParamEndIndex(path, '/', node.location)
        const param = path.slice(jumpChar, paramEndIndex)

        return {
            ...node
            , param
        }
    })

// descompose route
const serchParams = (method, inPath, handler) => {
    let path = inPath
    const params = []
    const nodeByCharType = idNodesByCharType(path)
    const nodeByStaticParts = mapNodesByStaticPart(path, nodeByCharType)
    const nodesByParams = mapNodesByParams(path, nodeByStaticParts)
    for (let i = 0, jump, len = path.length; i < len; i++) {
        // parametric route parts
        if (path[i] === ':') {
            jump = i + 1
            const nodeType = NODE_TYPE.PARAM
            let staticPart = path.slice(0, i)

            // add the static part of the route to the tree
            // insertNodeInTree({
            //     method
            //     , path: staticPart
            //     , type: NODE_TYPE.STATIC
            // })

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
                // insertNodeInTree({
                //     method
                //     , path: completedPath
                //     , type: nodeType
                //     , params
                //     , handler
                // })
                return
            }

            // add the parameter and continue with the search
            staticPart = path.slice(0, i)
            staticPart = staticPart.toLowerCase()
            // insertNodeInTree({
            //     method
            //     , path: staticPart
            //     , type: nodeType
            //     , params
            // })

            i--
        }
    }

    // static route parts
    // insertNodeInTree(method, path, NODE_TYPE.STATIC, params, handler)
}

export const create = (method, path, handler) => {
    serchParams(method, path, handler)
}

// export const router = () => {
//     const tree = {}
//     return {
//         create: (method, path, handler) => {
//             serchParams(tree, method, path, handler)
//         }
//     }
// }

