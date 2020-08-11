const { Result } = require(`../utils/result`)
const { HttpMethods } = require(`./router`)
const { error } = require(`../../std/replies`)

const methodsRegex = /^\[(?<methods>[\w|\|]*)\]/m
const genericRe = /\{[\s]*(?<name>\w+)[\s]*(\:[\s]*(?<type>\w+)?[\s]*)?\}/m

const ParamTypes = {
    Int: 'int',
    Float: 'float',
    Number: 'number',
    Bool: 'bool',
    String: 'string',
    Any: 'any'
}

const ParamTypesPriorityTable = {
    [ParamTypes.Bool]: 0.1,
    [ParamTypes.Float]: 0.2,
    [ParamTypes.Number]: 0.3,
    [ParamTypes.Int]: 0.4,
    [ParamTypes.String]: 0.5,
    [ParamTypes.Any]: 0.6,
}

class BaseRoutePart {
    constructor() {
        this.subRoutes = []
        this.middlewares = []
        this.label = null
        this.handlers = []
    }

    merge(part) {
        for (let handler of part.handlers)
            if (!this.handlers.includes(handler))
                this.handlers.push(handler)
        for (let mw of part.middlewares)
            if (!this.middlewares.includes(mw))
                this.middlewares.push(mw)
    }

    balance() {
        this.subRoutes = this.subRoutes
            .sort((l, m) => l.priority - m.priority)
        this.subRoutes.forEach(s => s.balance())
    }

    add(part) {
        for (let route of this.subRoutes) {
            if (route.compare(part)) {
                route.merge(part)
                return route
            }
        }
        return this.subRoutes.push(part), part
    }

    async serveMiddleware(req, res, params) {
        for (let mw of this.middlewares) {
            let reply = await mw.callDict(params, [req])
            if (reply) {
                reply.send(res)
                return true
            }
        }
        return false
    }

    async serve(req, res, params) {
        for (let handler of this.handlers) {
            let reply = await handler.callDict(params, [req])
            if (reply) {
                reply.send(res)
                return
            }
        }
        error('no reply').send(res)
    }
}
class ConstPart extends BaseRoutePart {
    constructor(data) {
        super()
        this.data = data
        this.label = data
    }

    copy() {
        let part = new ConstPart('')
        part.data = this.data
        part.handlers = [...this.handlers]
        part.label = this.label
        part.priority = this.priority
        part.middlewares = [...this.middlewares]
        return part
    }

    compare(part) {
        return part.isConstant() ? part.data == this.data : false
    }

    process(part) {
        return new Result(part == this.data, null)
    }

    isConstant() {
        return true
    }
}
class GenericPart extends BaseRoutePart {
    constructor(name, type) {
        super()
        this.name = name
        this.type = type
        this.parser = (data) => new Result(false, null)
        this.label = `{${name}: ${type}}`
        this.init()
    }

    get priority() {
        return ParamTypesPriorityTable[this.type]
    }

    set priority(n) {
        console.warn('Priority cannot be set. Don\'t try')
    }

    init() {
        let parserCharacter = '\\w+'
        let parserFunc = data => null
        switch (this.type) {
            case ParamTypes.Bool:
                parserCharacter = 'true|false'
                parserFunc = (data) => {
                    return { [this.name]: data == 'true' }
                }
                break
            case ParamTypes.Float:
                parserCharacter = '\\d+\\.\\d+'
                parserFunc = (data) => {
                    return { [this.name]: parseFloat(data) }
                }
                break
            case ParamTypes.Int:
                parserCharacter = '\\d+'
                parserFunc = (data) => {
                    return { [this.name]: parseInt(data) }
                }
                break
            case ParamTypes.Number:
                parserCharacter = '(\\d+\\.\\d+)|(\\d+)'
                parserFunc = (data) => {
                    return { [this.name]: parseFloat(data) }
                }
                break
            case ParamTypes.String:
                parserCharacter = '\\w+'
                parserFunc = (data) => {
                    return { [this.name]: data }
                }
                break
            case ParamTypes.Any:
                parserCharacter = '\\w+'
                parserFunc = (data) => {
                    return { [this.name]: data }
                }
                break
            default:
                throw new Error('Wrong type: ' + this.type)
        }
        let re = new RegExp(`^(?<${this.name}>${parserCharacter})$`, 'm')
        this.parser = (data) => {
            let result = re.exec(data)
            if (!result)
                return new Result(false, null)
            let param = result.groups[this.name]
            return new Result(true, parserFunc(param))
        }
    }

    copy() {
        let part = new GenericPart('b', ParamTypes.Any)
        part.name = this.name
        part.type = this.type
        part.handlers = [...this.handlers]
        part.label = this.label
        part.middlewares = [...this.middlewares]
        part.init()
        return part
    }

    compare(part) {
        if (part.isConstant())
            return false
        let gpart = part
        return gpart.name == this.name && gpart.type == this.type
    }

    isConstant() {
        return false
    }
    
    process(part) {
        return this.parser(part)
    }
}
function getRoutePart(part) {
    part = part.trim()
    if (!part)
        return null
    let gpResult = genericRe.exec(part)
    if (gpResult) {
        let { name, type } = gpResult.groups
        type = type || ParamTypes.Any
        type = type.toLowerCase()
        if (ParamTypesPriorityTable[type] === undefined) {
            throw new Error('Wrong type: ' + type)
        }
        return new GenericPart(name, type)
    }
    return new ConstPart(part)
}
 function getRouteParts(route) {
    route = route.trim()
    if (!route || route == '/')
        return []
    return route.split('\/')
        .map(p => p.trim())
        .filter(p => p)
        .map(getRoutePart)
        .filter(p => p)
}
 function getRouteMethods(route) {
    route = route.trim()
    let parsedMethods = methodsRegex.exec(route)
    if (parsedMethods) {
        let methodsStr = parsedMethods.groups.methods
        if (methodsStr) {
            let methods = methodsStr.split('|')
                .map(m => m.trim().toUpperCase())
                .filter(m => m in HttpMethods)
            route = route.slice(parsedMethods[0].length)
            if (!methods.length)
                methods = []
            return [route, methods]
        }
    }
    return [route, []]
}

exports.getRouteMethods = getRouteMethods
exports.getRouteParts = getRouteParts
exports.getRoutePart = getRoutePart
exports.BaseRoutePart = BaseRoutePart
exports.ConstPart = ConstPart