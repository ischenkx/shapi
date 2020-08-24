const functionArgsParser = /^\s*(async)?\s*(function)?\s*(\w*)\s*\((?<args>.*)\)/;
const arrowFunctionArgsParser = /^\s*\(?(?<args>[\w\s,$_]*)\)?\s*\=\>\s*/
 class Func {
    constructor(fn) {
        this.fn = fn;
        this.args = [];
        this.valid = false;
        this.collectInfo();
    }
    collectInfo() {
        this.valid = this.isValid();
        if (!this.valid)
            return;
        let strFn = this.fn.toString();
        let parseResult = functionArgsParser.exec(strFn);
        if (!parseResult) parseResult = arrowFunctionArgsParser.exec(strFn)
        if (parseResult) {
            if (parseResult.groups.args) {
                let argsStr = parseResult.groups.args;
                this.args = argsStr.split(', ')
                    .map(a => a.trim());
            }
        }
    }
    isValid() {

        return !!this.fn && (typeof this.fn === 'function');
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
        return this.fn(...argsList);
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
        return this.fn(...args);
    }
}

exports.Func = Func