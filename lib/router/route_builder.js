const { getRouteParts, getRouteMethods }  = require(`./route_part`)

class RouteView {
    constructor(rawInput, label = rawInput) {
        this.label = label
        this.methods = []
        this.routeParts = []
        this.parse(rawInput)
    }

    parse(rawInput) {
        let [input, methods] = getRouteMethods(rawInput)
        this.methods = methods
        this.routeParts = getRouteParts(input)
    }

    addParts(parts) {
        this.routeParts.push(...parts.map(p => p.copy()))
    }

    addMethods(methods) {
        for (let method of methods) {
            if (!this.methods.includes(method))
                this.methods.push(method)
        }
    }

    add(view) {
        this.addMethods(view.methods)
        this.addParts(view.routeParts)
    }

    static merge(view1, view2) {
        let methods = [...view2.methods]
        let parts = [...view1.routeParts, ...view2.routeParts]
        let view = new RouteView('', view2.label)
        view.methods = methods
        view.routeParts = parts
        return view
    }
}

class RouteBuilder {
    constructor(router) {
        this.router = router
        this.prefix = new RouteView('/')
        this.currentView = new RouteView('/')
        this.joinedView = null
    }

    join() {
        if (this.joinedView)
            return this.joinedView
        let methods = this.currentView.methods.length ? this.currentView.methods : this.prefix.methods
        methods = [...methods]
        let parts = [...this.prefix.routeParts, ...this.currentView.routeParts]
        this.joinedView = new RouteView('', this.currentView.label)
        this.joinedView.methods = methods
        this.joinedView.routeParts = parts
        return this.join()
    }

    addHandlers(handlers) {
        let view = this.join()
        this.router.addRoute(view.routeParts, view.methods, handlers, [])
    }

    addMiddlewares(mws) {
        let view = this.join()
        this.router.addRoute(view.routeParts, view.methods, [], mws)
    }

    with(spec, label = spec) {
        let tmp = new RouteView(spec, label)
        let newPrefix = RouteView.merge(this.prefix, tmp)
        let builder = new RouteBuilder(this.router)
        builder.prefix = newPrefix
        return builder
    }

    on(input, label = input) {
        this.currentView = new RouteView(input, label)
        this.joinedView = null
        return this
    }

    use(...middlewares) {
        this.addMiddlewares(middlewares)
        return this
    }
    
    do(...handlers) {
        this.addHandlers(handlers)
        return this
    }
}

exports.RouteBuilder = RouteBuilder