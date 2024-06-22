const { getClosingData: getNSEClosingReport } = require('./nse');
const { getClosingData: getBSEClosingReport } = require('./bse');
const { Exchange, Stock } = require('./types');

const exchange = {
    NSE: getNSEClosingReport,
    BSE: getBSEClosingReport
};

/**
 * Get closing report for NSE & BSE
 * @param {Exchange} exchangeType - Exchange
 * @param {Date} [date] - Date for which the report has to be downloaded
 * 
 * @returns {Promise<Stock[]>}
 * @throws {import('./errors').ReportNotFoundError}
 */
async function getClosingReport(exchangeType, date) {
    date = date ?? new Date();

    return exchange[exchangeType](date);
}

module.exports = {
    getClosingReport
};
