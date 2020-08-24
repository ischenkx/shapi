const Context = require(`../context/context`)
const parseCookies = require('../utils/parse_cookies')
const configureCookie = require('../utils/configure_cookie')

class Request extends Context {
    constructor(request, response, parent = null) {
        super(parent)
        this.request = request
        this.response = response
    }

    get path() {
        if (this._path)
            return this._path
        this._path = this.request.url.split('?')[0]
        return this.path
    }

    get method() {
        return this.request.method.toUpperCase()
    }

    get headers() {
        return this.request.headers
    }

    readBody() {
        if(this._body) return this._body
        this._body = new Promise((ok, err) => {
            let bodyChunks = []
            this.request.on('data', chunk => {
                bodyChunks.push(chunk)
            }).on('end', () => {
                this._body = Buffer.concat(bodyChunks)
                ok(this._body)
            }).on('error', err)
        })
    }

    setCookie(name, val, options) {
        let cookie = configureCookie(name, val, options)
        if(!cookie) return
        let cookies = this.response.getHeader('Set-Cookie')||[]
        cookies.push(cookie)
        this.response.setHeader('Set-Cookie', cookies)
    }

    getCookies() {
        if(this._cookies) return this._cookies
        this._cookies = parseCookies(this.request)
        return this._cookies
    }

    setHeader(header, value) {
        this.response.setHeader(header, value)
    }
}

module.exports = Request