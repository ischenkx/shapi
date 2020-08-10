class Context {
    constructor(parent = null) {
        this.data = {}
        this.parent = parent
    }
    set(name, value) {
        this.data[name] = value
    }
    get(name) {
        let val = this.data[name]
        return val ? val : this.parent ? this.parent.get(name) : null
    }
}

exports.Context = Context
