const Context = require(`../context/context.js`)

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
        return new Promise((ok, err) => {
            let bodyChunks = []
            this.request.on('data', chunk => {
                bodyChunks.push(chunk)
            }).on('end', () => {
                ok(Buffer.concat(bodyChunks))
            }).on('error', err)
        })
    }
    setHeader(header, value) {
        this.response.setHeader(header, value)
    }
}

exports.Request = Request