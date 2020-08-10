const { createServer } = require(`http`)

const defaultClientHandler = (req, res) => res.end()

const ServerState = {
    "Running": 1,
    "Stopped": 2
}

exports.Server = class Server {
    constructor(config) {
        this.clientHandler = defaultClientHandler
        this.state = ServerState.Stopped
        this.config = config || {}
        this.httpServer = createServer((req, res) => {
            this.clientHandler(req, res)
        })
    }

    get listenOptions() {
        let listenOptions = {}
        listenOptions.port = this.config.port || 8080
        listenOptions.readableAll = true
        listenOptions.writableAll = true
        listenOptions.exclusive = false
        listenOptions.ipv6Only = false
        return listenOptions
    }

    run() {
        return new Promise((ok, err) => {
            let opts = this.listenOptions
            if (this.state == ServerState.Running) {
                err('already running')
            }
            this.httpServer.listen(opts, () => {
                this.state = ServerState.Running
                ok(opts)
            }).on('error', err)
        })
    }

    stop() {
        this.httpServer.close(() => this.state = ServerState.Stopped)
    }
    
    onclient(handler) {
        this.clientHandler = handler || defaultClientHandler
    }
}
