const { formatDate } = require(`../../utils/format_date`);

function logger(name) {
    return (req) => {
        console.log(`${name} ${formatDate(new Date, "%Y-%m-%d %H:%M:%S", true)} ${req.method} ${req.path}`);
    };
}

exports.logger = logger