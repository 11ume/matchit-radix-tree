/*
    Remove in end of the path
    '#': 35
    ';': 59
    '?': 63
*/
export function sanitizeUrl(path) {
    for (let i = 0, len = path.length; i < len; i++) {
        const charCode = path.charCodeAt(i)
        if (charCode === 63 || charCode === 59 || charCode === 35) {
            return path.slice(0, i)
        }
    }

    return path
}

export function groupParams(handler, params) {
    const paramsObj = {}
    const paramNames = handler.params
    for (let i = 0; i < handler.paramsLength; i++) {
        const key = paramNames[i]
        paramsObj[key] = params[i]
    }

    return paramsObj
}
