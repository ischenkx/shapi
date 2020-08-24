const Context = require(`./lib/context/context.js`)
const Server = require(`./lib/http_server/server.js`)
const Router = require(`./lib/router/router.js`)
const Request = require(`./lib/request/request.js`)
const RouteBuilder = require(`./lib/router/route_builder.js`)

class Shapi extends Context {
    constructor(cfg = {}) {
        cfg = cfg || {}
        super(cfg.context)
        this.server = new Server(cfg.server)
        this.router = new Router(cfg.router)
        this.server.onclient((rawReq, rawRes) => {
            let req = new Request(rawReq, rawRes, this)
            this.router.process(req, rawRes)
        })
    }

    on(path, label = path) {
        return new RouteBuilder(this.router)
            .on(path, label)
    }

    use(...mw) {
        return new RouteBuilder(this.router)
            .use(...mw)
    }

    with(path, label = path) {
        return new RouteBuilder(this.router)
            .with(path, label)
    }

    async run() {
        this.router.setup()
        try {
            let opts = await this.server.run()
            let output = `Shapi started at port ${opts.port}`
            console.log(('-').repeat(output.length+4))
            console.log(`|${(' ').repeat(output.length+2)}|`)
            console.log(`| \x1b[32m${output}\x1b[0m |`)
            console.log(`|${(' ').repeat(output.length+2)}|`)

            console.log(('-').repeat(output.length+4))
        }
        catch (e) {
            console.error(e)
        }
    }

    stop() {
        this.server.stop()
    }
    
    getRoutes() {
        return this.router.getRoutes()
    }
}

module.exports = Shapi