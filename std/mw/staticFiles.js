const fs = require('fs')
const chokidar = require('chokidar')
const path = require('path')

class FileReply {
    constructor(buffer) {
        this.buffer = buffer
    }

    send(writer) {
        writer.end(this.buffer)
    }
}

class StaticFiles {
    constructor(path) {
        this.path = path
        this.cache = {}
        this.chokidar = chokidar.watch(this.path)
        this.chokidar.on('all', (e, file)=>{
            this.cache[file] = null
        })
    }
    async call(_req) {
        let rpath = _req.restPath
        let fullPath = path.join(this.path, rpath)
        if(this.cache[fullPath]) {
            return await this.cache[fullPath]
        }
        this.cache[fullPath] = new Promise((ok, fail)=>{
            fs.readFile(fullPath, (err, data)=>{
                if(err) return fail(err)
                this.cache[fullPath] = new FileReply(data)
                ok(this.cache[fullPath])
            })
        })
        return this.call(_req)
    }
}

function staticFiles(path = '/') {
    return new StaticFiles(path)
}

module.exports = staticFiles