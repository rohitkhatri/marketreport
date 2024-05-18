const { getClosingData: getNSEClosingReport } = require('./nse');
const { getClosingData: getBSEClosingReport } = require('./bse');

const exchange = {
    NSE: getNSEClosingReport,
    BSE: getBSEClosingReport
};

/**
 * 
 * @param {'NSE'|'BSE'} exchangeType - Exchange
 * @param {Date} [date] - Date for which the report has to be downloaded
 */
async function getClosingReport(exchangeType, date) {
    date = date ?? new Date();

    return exchange[exchangeType](date);
}

module.exports = {
    getClosingReport
};
