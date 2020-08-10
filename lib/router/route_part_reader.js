exports.RoutePartReader = class RoutePartReader {
    constructor(part) {
        this.handlers = []
        this.middlewares = []
        this.label = ''
        this.subs = []
        this.label = part.label
        this.handlers = part.handlers.map(h => h.args)
        this.middlewares = part.middlewares.map(mw => mw.args)
        this.subs = part.subRoutes.map(r => new RoutePartReader(r))
    }
}
