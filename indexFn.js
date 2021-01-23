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

// map only static parts of parametric route
const mapNodesByStaticPart = (path, nodes) => nodes.map((node, key) => {
    if (node.type === NODE_TYPE.PARAM) {
        const staticPart = path.slice(0, key)
        return {
            ...node
            , staticPart
        }
    }

    return {
        ...node
    }
})

const mapNodesByParams = (path, nodes) => nodes
    .filter(node => node.type === NODE_TYPE.PARAM)
    .map(node => {
        // isolate the parameter name
        const start = node.location
        let i = start
        // move right
        while (i < path.length && path[i] !== '/') i++

        const jump = node.location + 1
        const param = path.slice(jump, i)

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
    mapNodesByParams(path, nodeByStaticParts)

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

