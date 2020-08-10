const { Func }  = require(`../utils/reflect`)
const { ConstPart, getRouteParts } = require(`./route_part`)
const { RoutePartReader }  = require(`./route_part_reader`)

class ProcessedRoutePart {
    constructor(route, data, subRoutesOffset = 0) {
        this.route = route
        this.data = data
        this.subRoutesOffset = subRoutesOffset
    }
}

exports.RouteTree = class RouteTree {
    constructor() {
        this.base = new ConstPart("/")
    }

    add(path, middlewares, handlers) {
        let parts = getRouteParts(path)
        let currentPart = this.base
        for (let part of parts) {
            currentPart = currentPart.add(part)
        }
        currentPart.handlers.push(...handlers.map(h => new Func(h)))
        currentPart.middlewares.push(...middlewares.map(h => new Func(h)))
    }

    addRoute(parts, handlers, middlewares) {
        let currentPart = this.base
        for (let part of parts) {
            currentPart = currentPart.add(part)
        }
        currentPart.handlers.push(...handlers.map(h => new Func(h)))
        currentPart.middlewares.push(...middlewares.map(h => new Func(h)))
    }

    find(path) {
        let stringParts = path.split('/').filter(p => p)
        if (!stringParts.length) {
            return [new ProcessedRoutePart(this.base, '/', 0)]
        }
        let parts = [new ProcessedRoutePart(this.base, null, 0)]
        let finished = false
        let i = 0
        while (!finished) {
            let strPart = stringParts[i]
            let gotit = false
            let curPart = parts[parts.length - 1]
            let subs = curPart.route.subRoutes
            while (!gotit && curPart.subRoutesOffset < subs.length) {
                let sub = subs[curPart.subRoutesOffset++]
                let res = sub.process(strPart)
                if (!res.ok)
                    continue
                gotit = true
                parts.push(new ProcessedRoutePart(sub, res.value, 0))
                finished = parts.length == (stringParts.length + 1)
                i++
            }
            if (!gotit) {
                parts.pop()
                if (parts.length <= 0 || --i < 0)
                    finished = true
            }
        }
        return parts.length == stringParts.length + 1 ? parts : null
    }

    getReader() {
        return new RoutePartReader(this.base)
    }
    
    balance() {
        this.base.balance()
    }
}
