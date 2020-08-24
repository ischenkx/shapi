const functionArgsRe = /^\s*(async)?\s*(function)?\s*(\w*)\s*\((?<args>.*)\)/;
const arrowFunctionArgsRe = /^\s*\(?(?<args>[\w\s,$_]*)\)?\s*\=\>\s*/
const objectMethodRe = /^\s*(async)?\s*(?<name>[\w$]*)\s*\((?<args>.*)\)/

class Callable {
    constructor(fn) {
        this.fn = fn;
        this.args = [];
        this.valid = false;
        this.isFunction = false
        this.collectInfo();
    }
    collectInfo() {
        this.valid = this.isValid();
        if (!this.valid)
            return;
        if(typeof this.fn === 'function') {
            this.isFunction = true
            let strFn = this.fn.toString();
            let parseResult = functionArgsRe.exec(strFn);
            if (!parseResult) parseResult = arrowFunctionArgsRe.exec(strFn)
            if (parseResult) {
                if (parseResult.groups.args) {
                    let argsStr = parseResult.groups.args;
                    this.args = argsStr.split(', ')
                        .map(a => a.trim());
                }
            }
        } else {
            this.isFunction = false
            if(typeof this.fn.call !== 'function') {
                this.valid = false
                return
            }
            let strFn = this.fn.call.toString();
            let parseResult = objectMethodRe.exec(strFn);
            if (parseResult) {
                if (parseResult.groups.args) {
                    let argsStr = parseResult.groups.args;
                    this.args = argsStr.split(', ')
                        .map(a => a.trim());
                }
            } else {
                this.valid = false
            }
        }

    }
    isValid() {
        if(!this.fn) return false
        return !!this.fn.call;

    }
    call(argsList, argsDict = null) {
        if (!this.valid)
            return;
        if (!argsList) {
            argsList = [];
        }
        let offset = argsList.length;
        if (argsDict) {
            for (let i = offset; i < this.args.length; i++) {
                let val = argsDict[this.args[i]];
                if (val !== undefined)
                    argsList.push(val);
            }
        }
        if(this.isFunction) return this.fn(...args);
        return this.fn.call(...args)
    }
    callDict(argsDict, argsList = []) {
        if (!this.valid)
            return;
        let args = [];
        if (argsList) {
            let n = Math.min(argsList.length, this.args.length);
            for (let i = 0; i < n; i++) {
                let argName = this.args[i];
                if (!(argName in argsDict))
                    args.push(argsList[i]);
            }
        }
        let offset = args.length;
        if (argsDict) {
            for (let i = offset; i < this.args.length; i++) {
                let val = argsDict[this.args[i]];
                if (val !== undefined)
                    args.push(val);
            }
        }
        if(this.isFunction) return this.fn(...args);
        return this.fn.call(...args)
    }
}

module.exports = Callable