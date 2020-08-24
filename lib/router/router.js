const {HttpMethods} = require("./route_part");
const { RouteTree } = require(`./route_tree`)
const { error } = require(`../../std/replies`)



class Router {
    constructor(varsConfig) {
        this.methodsTree = {}
        this.varsConfig = {}
        this.varsConfig = varsConfig || this.varsConfig
    }

    addRoute(parts, label, methods, handlers, middlewares) {
        methods = methods.filter(m => m in HttpMethods)
        if (!methods.length)
            methods = Object.values(HttpMethods)
        for (let method of methods) {
            if (!this.methodsTree[method])
                this.methodsTree[method] = new RouteTree
            this.methodsTree[method].addRoute(parts.map(p => p.copy()), label, handlers, middlewares)
        }
    }

    setup() {
        for (let method in this.methodsTree)
            this.methodsTree[method].balance()
    }

    getRoutes() {
        let routes = {}
        for (let method in this.methodsTree) {
            let tree = this.methodsTree[method]
            routes[method] = tree.getReader()
        }
        return routes
    }

    async process(req, res) {
        let tree = this.methodsTree[req.method.toUpperCase()]
        if (!tree) {
            error('this method is not served', 404).send(res)
            return
        }
        let path = decodeURI(req.path)
        let routeParts = tree.find(path)
        if (!routeParts) {
            error('no such path', 404).send(res)
            return
        }
        let params = {}
        req.set('params', params)
        for (let i = 0; i < routeParts.length; i++) {
            let intermediatePoint = routeParts[i]
            if (intermediatePoint.data)
                Object.assign(params, intermediatePoint.data)
            if (this.varsConfig.request)
                params[this.varsConfig.request] = req
            await intermediatePoint.route.serveMiddleware(req, res, params)
        }
        await routeParts[routeParts.length - 1].route.serve(req, res, params)
    }
}

exports.Router = Router