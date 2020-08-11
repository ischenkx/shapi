const { RouteTree } = require(`./route_tree`)
const { error } = require(`../../std/replies`)

const HttpMethods = {
    DELETE: 'DELETE',
    GET: 'GET',
    HEAD: 'HEAD',
    OPTIONS: 'OPTIONS',
    PATCH: 'PATCH',
    POST: 'POST',
    PUT: 'PUT',
}

class Router {
    constructor(varsConfig) {
        this.methodsTree = {}
        this.varsConfig = {}
        this.varsConfig = varsConfig || this.varsConfig
    }

    addRoute(parts, methods, handlers, middlewares) {
        methods = methods.filter(m => m in HttpMethods)
        if (!methods.length)
            methods = Object.values(HttpMethods)
        for (let method of methods) {
            if (!this.methodsTree[method])
                this.methodsTree[method] = new RouteTree
            this.methodsTree[method].addRoute(parts.map(p => p.copy()), handlers, middlewares)
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
        let routeParts = tree.find(req.path)
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
        }
        routeParts[routeParts.length - 1].route.serve(req, res, params)
    }
}

exports.Router = Router
exports.HttpMethods = HttpMethods