import { NODE_TYPE } from '../node.js'

const CHAR_TYPE = {
    PARAM: 1
    , STATIC: 2
}

const findParamEndIndex = (path, char, i = 0) => {
    if (i < path.length && path[i] !== char) return findParamEndIndex(path, char, i + 1)
    return i
}

const removeParamNames = (paramsStr, fn) => paramsStr
    .split('')
    .filter((char, key) => fn(char, key))
    .join('')

export const getParamsNodes = (nodes) => nodes.filter((node) => node.type === NODE_TYPE.PARAM)

// indentificate all node characters
// parametric route chars ":"
// static route chars "/", "a", "b"..
export const mapNodesTypes = (path) => path
    .split('')
    .map((char, key) => {
        if (char === ':') {
            return {
                char
                , location: key
                , charType: CHAR_TYPE.PARAM
            }
        }

        return {
            char
            , location: key
            , charType: CHAR_TYPE.STATIC
        }
    })

// path in -> /users/:foo/:bar/:baz
// fn out -> :/:/:
const createParamIds = (paramNodesLength, strIn = '', i = 0) => {
    let strOut = strIn
    if (i < paramNodesLength - 1) {
        strOut = strIn + ':/'
        return createParamIds(paramNodesLength, strOut, i + 1)
    }

    return strOut + ':'
}

// path in -> /users/:foo/:bar
// fn out -> /users/:/:
export const getCompletePath = (path, paramNodesLength) => {
    if (paramNodesLength > 0) {
        const index = path.indexOf(':')
        const mainPath = path.slice(0, index)
        const paramsIds = createParamIds(paramNodesLength)
        return mainPath + paramsIds
    }

    return path
}

// param node static part
const paramNodeStaticPart = (routePath, node) => {
    const pathStart = routePath.slice(0, node.location)
    const index = pathStart.indexOf(':')

    if (index < 0) {
        return {
            ...node
            , path: pathStart
            , type: NODE_TYPE.STATIC
        }
    }

    const params = pathStart.slice(index, node.location)
    const pathEnd = removeParamNames(params, (char) => char === '/' || char === ':')
    const staticPart = pathStart.slice(0, index) + pathEnd

    return {
        ...node
        , path: staticPart
        , type: NODE_TYPE.STATIC
    }
}

export const mapNodesStaticParts = (routePath, nodes) => nodes
    .map(node => {
        if (node.charType !== CHAR_TYPE.PARAM) {
            return {
                ...node
            }
        }

        // param node static part
        return paramNodeStaticPart(routePath, node)
    })

export const mapNodesParams = (path, nodes) => nodes
    .map(node => {
        if (node.charType !== CHAR_TYPE.PARAM) {
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

// (char, key) => {
//     if (char !== '/' && key === params.length - 1) {
//         return ''
//     }
//     return char === '/' || char === ':'
// }
