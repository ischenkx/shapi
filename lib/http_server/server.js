const { createServer: createHttpServer } = require(`http`)
const { createServer: createHttpsServer } = require('https')
const { createServer: createHttp2Server, 
    createSecureServer: createHttp2SecureServer} = require('http2')
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
        this.setupServer()
    }

    requestHandler() {
        return (req, res) => {
            this.clientHandler(req, res)
        }
    }

    setupServer() {
        if(this.state === ServerState.Running ) return

        if(this.config.secure) {
            if(this.config.http2) {
                this.httpServer = createHttp2SecureServer(this.config, this.requestHandler())
            } else {
                this.httpServer = createHttpsServer(this.config, this.requestHandler())
            }
        } else {
            if(this.config.http2) {
                this.httpServer = createHttp2Server(this.config, this.requestHandler())
            } else {
                this.httpServer = createHttpServer(this.config, this.requestHandler())
            }
        }
    }

    run() {
        return new Promise((ok, err) => {
            if (this.state === ServerState.Running) {
                return err('already running')
            }

            if(!this.config.port) this.config.port = port

            this.httpServer.listen(this.config, () => {
                this.state = ServerState.Running
                this.config.port = this.httpServer.address().port
                ok(this.config)
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
