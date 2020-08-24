const fs = require('fs')

const JsonReplyHeaders = {
    'Content-Type': 'application/json'
}

const HtmlReplyHeaders = {
    'Content-Type': 'text/html'
}

class JsonReply {
    constructor(data = {}) {
        this.data = data
    }

    send(writer) {
        writer.writeHead(200, JsonReplyHeaders)
        writer.end(JSON.stringify(this.data))
    }
}
class HtmlReply {
    constructor(payload = '') {
        this.payload = payload
    }

    send(writer) {
        writer.writeHead(200, HtmlReplyHeaders)
        writer.end(this.payload)
    }
}
class ErrorReply {
    constructor(reason, status = 500) {
        this.reason = reason
        this.status = status
    }

    send(writer) {
        writer.writeHead(this.status)
        writer.end(this.reason)
    }
}
class RedirectReply {
    constructor(to) {
        this.to = to
    }

    send(writer) {
        writer.writeHead(301, { 'Location': this.to })
        writer.end()
    }
}

class HtmlFileReply {
    static files = {}
    static useCaching = true

    constructor(path) {
        this.path = path
    }

    send(writer) {
        writer.writeHead(200, HtmlReplyHeaders)
        let data = null
        if(HtmlFileReply.useCaching) {
            data = HtmlFileReply.files[this.path]
            if(!data) {
                HtmlFileReply.files[this.path] = data = fs.readFileSync(this.path)
                fs.watch(this.path, (e, file) => {
                    HtmlFileReply.files[this.path] = fs.readFileSync(this.path)
                })
            }
            writer.end(data)
            return
        }
        fs.readFile(this.path, (err, data)=>{
            if(err) {
                error('Wrong file path: '+this.path).send(writer)
            } else {
                writer.end(data)
            }
        })
    }
}

function json(data) {
    return new JsonReply(data)
}

function html(data) {
    return new HtmlReply(data)
}

function error(reason, status = 500) {
    return new ErrorReply(reason, status)
}

function redirect(to) {
    return new RedirectReply(to)
}

function htmlFile(path) {
    return new HtmlFileReply(path)
}

module.exports = {
    html, htmlFile, json, error, redirect
}