const {HttpMethods} = require("../lib/router/route_part");

function methods(...names) {
    names = names.filter(name => name.toUpperCase() in HttpMethods)
    return names.length ? `[${names.join(',')}]` : ``
}

module.exports = {methods}