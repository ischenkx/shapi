const { HttpMethods } = require("../../lib/router/route_part");
const { formatDate } = require(`../../lib/utils/format_date`);

function logger(name) {
    return (req) => {
        let method = req.method
        if(method === HttpMethods.DELETE)
            method = `\x1b[31m${method}\x1b[0m`
        else
            method = `\x1b[33m${method}\x1b[0m`
        console.log(`\x1b[32m${name}\x1b[0m ${formatDate(new Date, "%Y-%m-%d %H:%M:%S", true)} ${method} ${req.path}`);
    };
}

module.exports = logger