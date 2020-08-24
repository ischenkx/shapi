const Callable  = require(`../utils/callable`)
const { ConstPart } = require(`./route_part`)
const { RoutePartReader }  = require(`./route_part_reader`)

class ProcessedRoutePart {
    constructor(route, data, input, subRoutesOffset = 0) {
        this.route = route
        this.data = data
        this.input = input
        this.subRoutesOffset = subRoutesOffset
    }
}

module.exports = class RouteTree {
    constructor() {
        this.base = new ConstPart("/")
    }

    addRoute(parts, label, handlers, middlewares, isPrefix = false) {
        let currentPart = this.base
        for (let part of parts) {
            currentPart = currentPart.add(part)
        }
        currentPart.isPrefix = isPrefix
        // console.log(currentPart)

        currentPart.handlers.push(...handlers.map(h => new Callable(h)))
        currentPart.middlewares.push(...middlewares.map(h => new Callable(h)))
        currentPart.label = label
    }

    find(path) {
        let stringParts = path.split('/').filter(p => !!p)
        if (!stringParts.length) {
            return [stringParts, [new ProcessedRoutePart(this.base, '/', '', 0)]]
        }
        let parts = [new ProcessedRoutePart(this.base, null,  '',0)]
        let finished = false
        let i = 0
        while (!finished) {
            let strPart = stringParts[i]
            let gotcha = false
            let curPart = parts[parts.length - 1]
            let subs = curPart.route.subRoutes
            while (!gotcha && curPart.subRoutesOffset < subs.length) {
                let sub = subs[curPart.subRoutesOffset++]
                let res = sub.process(strPart)
                if (!res.ok)
                    continue
                gotcha = true
                parts.push(new ProcessedRoutePart(sub, res.value, res.input, 0))
                finished = parts.length === (stringParts.length + 1)
                i++
            }
            if (!gotcha) {
                let last = parts[parts.length-1]
                if(last) {
                    if(last.route.isPrefix) return [stringParts, parts]
                }
                parts.pop()
                if (parts.length <= 0 || --i < 0)
                    finished = true
            }
        }
        return parts.length === stringParts.length + 1 ? [stringParts, parts] : [stringParts, null]
    }

    getReader() {
        return new RoutePartReader(this.base)
    }
    
    balance() {
        this.base.balance()
    }
}
