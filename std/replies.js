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
    return {
        data: null,
        headers: {
            'Location': to
        },
        status: 301
    }
}

exports.html = html
exports.json = json
exports.error = error
exports.redirect = redirect