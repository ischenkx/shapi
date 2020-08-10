const { Context } = require(`../context/context.js`)
const { Server } = require(`../http_server/server.js`)
const { Router } = require(`../router/router.js`)
const { Request } = require(`../request/request.js`)
const { RouteBuilder } = require(`../router/route_builder.js`)

class Api extends Context {
    constructor(cfg = null) {
        cfg = cfg || {}
        super(cfg.context)
        this.server = new Server(cfg.serverConfig)
        this.router = new Router(cfg.vars)
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
            console.log(`
                Japi started at port ${opts.port}
            `)
        }
        catch (e) {
            console.log(e)
        }
    }

    stop() {
        this.server.stop()
    }
    
    getRoutes() {
        return this.router.getRoutes()
    }
}

exports.Api = Api