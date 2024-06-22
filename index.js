const { getClosingReport } = require('./exchange');
const { ReportNotFoundError } = require('./exchange/errors');

module.exports = {
    ReportNotFoundError,
    getClosingReport
};
