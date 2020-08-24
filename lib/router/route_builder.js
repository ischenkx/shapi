const { getRouteParts, getRouteMethods }  = require(`./route_part`)

class RouteView {
    constructor(rawInput, label = rawInput) {
        this.methods = []
        this.routeParts = []
        this.label = label
        this.isPrefix = false
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
        this.currentView = null
        this.joinedView = null
    }

    join() {
        if (this.joinedView)
            return this.joinedView
        let methods = this.prefix.methods
        if(this.currentView)
            if(this.currentView.methods.length)
                methods = this.currentView.methods
        let parts =[...this.prefix.routeParts]
        if(this.currentView) parts.push(...this.currentView.routeParts)
        this.joinedView = new RouteView('', this.currentView ? this.currentView.label : '')
        this.joinedView.methods = methods
        this.joinedView.routeParts = parts
        this.joinedView.isPrefix = !this.currentView;
        return this.join()
    }

    addHandlers(handlers) {
        let view = this.join()
        this.router.addRoute(view.routeParts, view.label, view.methods, handlers, [], view.isPrefix)
    }

    addMiddlewares(mws) {
        let view = this.join()
        this.router.addRoute(view.routeParts, view.label, view.methods, [], mws, view.isPrefix)
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

module.exports = RouteBuilder