const sameSiteValues = ['Strict', 'Lax', 'None']

module.exports = function configureCookie(name, val, opts) {
    if(!name || !val) return null
    let cookie = `${name}=${val};`
    if(opts) {
        let expires = opts['expires']
        if(expires instanceof Date) {
            expires = expires.toUTCString()
        }
        if(typeof expires === 'string') cookie += `Expires=${expires};`

        let maxAge = opts['maxAge']
        if(typeof maxAge === 'number') cookie += `Max-Age=${maxAge};`

        let domain = opts['domain']
        if(typeof domain === 'string') cookie += `Domain=${domain};`

        let path = opts['path']
        if(typeof path === 'string') cookie += `Path=${path};`

        if(opts['secure']) cookie += `Secure;`

        if(opts['httpOnly']) cookie += `HttpOnly;`

        let sameSite = opts['sameSite']
        if(sameSite in sameSiteValues) cookie += `SameSite=${sameSite};`
    }
    return cookie
}