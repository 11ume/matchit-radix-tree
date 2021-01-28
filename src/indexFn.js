// route finder engine
import Node, { NODE_TYPE } from './node.js'

const trees = {}

// descompose route
const serchParams = (method, inPath, handler) => {
    let path = inPath
    const params = []

    for (let i = 0, jump, len = path.length; i < len; i++) {
        // parametric route parts
        if (path[i] === ':') {
            jump = i + 1
            const nodeType = NODE_TYPE.PARAM
            let staticPart = path.slice(0, i)

            // for node type param
            // add the static part of the route to the tree
            // insertNodeInTree({
            //     method
            //     , path: staticPart
            //     , type: NODE_TYPE.STATIC
            // })

            // isolate the parameter name
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
                // for node type param
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

            // for node type static
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
