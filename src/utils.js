export function sanitizeUrl(url) {
    for (let i = 0, len = url.length; i < len; i++) {
        const charCode = url.charCodeAt(i)
        if (charCode === 63 || charCode === 59 || charCode === 35) {
            return url.slice(0, i)
        }
    }

    return url
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
