const xlsx = require('xlsx');

const { Stock, RowCallback } = require('./types');
const { ReportNotFoundError } = require('./errors');
const { getCompaniesDetails } = require('./nse');

/**
 * Get closing report based on passed date
 * @param {Date} date - Date
 * 
 * @returns {Promise<Stock[]>}
 */
async function getClosingData(date) {
    const companies = await getCompaniesDetails();
    const report = await downloadClosingReport(date, {
        callback: {
            row: (data) => {
                data.name =  companies && companies[data.symbol] ? companies[data.symbol].name : (data.name ?? null);
            }
        }
    });
    
    return report;
}

/**
 * Generate closing report url
 * @param {Date} date - Date for which the report should be downloaded
 * 
 * @returns {Promise<{url: string, filename: string}>}
 */
async function getClosingReportURL(date) {
    const day = date.getDate().toString().padStart('2', '0');
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart('2', '0');
    const formattedDate = `${year}${month}${day}`;

    const filename = `BhavCopy_BSE_CM_0_0_0_${formattedDate}_F_0000.CSV`;
    return {
        filename: filename.replace('.zip', ''),
        url: `https://www.bseindia.com/download/BhavCopy/Equity/${filename}`
    };
}

/**
 * Download closing report
 * @param {Date} date - Date
 * @param {object} options - Options
 * @param {object} [options.callback] - Callbacks
 * @param {RowCallback} [options.callback.row] - Row map callback
 * 
 * @returns {Promise<Stock[]>}
 */
async function downloadClosingReport(date, options = {}) {
    const { url: closingReportUrl } = await getClosingReportURL(date);
    const buffer = await downloadFileFromURL(closingReportUrl);
    const workbook = xlsx.read(buffer);
    const json = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]).map(row => {
        const mapped = {
            name: row.FinInstrmNm,
            isin: row.ISIN,
            symbol: row.TckrSymb,
            open: row.OpnPric,
            high: row.HghPric,
            low: row.LwPric,
            close: row.ClsPric,
            last: row.LastPric,
            prev_close: row.PrvsClsgPric,
            total_trading_volume: row.TtlTradgVol,
            total_trading_value: row.TtlTrfVal,
            total_no_of_tx_executed: row.TtlNbOfTxsExctd
        };

        if (options.callback && typeof options.callback.row === 'function') {
            options.callback.row(mapped);
        }

        return mapped;
    });

    return json;
}

/**
 * Download file from URL
 * @param {string} url - Download file url
 * 
 * @returns {Promise<Buffer>}
 */
async function downloadFileFromURL(url) {
    const response = await fetch(url);
    
    if (response.status !== 200) {
        throw new ReportNotFoundError(`Cannot find report for the passed date, please verify the date!`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer, 'binary');

    return buffer;
}

module.exports = {
    getClosingData
};
