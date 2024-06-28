const xlsx = require('xlsx');

const { RowCallback } = require('./types');
const { ReportNotFoundError } = require('./errors');
const { getCompaniesDetails, extractFileFromZip } = require('./nse');

/**
 * Get closing report based on passed date
 * @param {Date} date - Date
 * 
 * @returns {Promise<import('./types').ClosingReport>}
 */
async function getClosingData(date) {
    const companies = await getCompaniesDetails();
    const report = await downloadClosingReport(date, {
        callback: {
            row: (data) => {
                data.name = (companies && companies[data.symbol] ? companies[data.symbol].name : (data.name ?? null))?.trim();
            }
        }
    });
    
    return report;
}

/**
 * Generate closing report url
 * @param {Date} date - Date for which the report should be downloaded
 * 
 * @returns {Promise<{url: string, filename: string, type: 'zip'|'csv'}>}
 */
async function getClosingReportURL(date) {
    const day = date.getDate().toString().padStart('2', '0');
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart('2', '0');
    const formattedDate = `${year}${month}${day}`;

    const output = {
        filename: `BhavCopy_BSE_CM_0_0_0_${formattedDate}_F_0000.csv`,
        url: `https://www.bseindia.com/download/BhavCopy/Equity/BhavCopy_BSE_CM_0_0_0_${formattedDate}_F_0000.csv`,
        type: 'csv'
    };

    if (date >= new Date('2024-01-01') ) {
        return output;
    } else if (date >= new Date('2022-08-17') && date <= new Date('2023-12-31')) {
        output.filename = `BSE_EQ_BHAVCOPY_${day}${month}${year}.csv`;
        output.url = `https://www.bseindia.com/download/BhavCopy/Equity/${output.filename.replace('.csv', '.zip')}`;
        output.type = 'zip';
    } else if (date >= new Date('2016-12-10') && date <= new Date('2022-08-16')) {
        output.filename = `EQ_ISINCODE_${day}${month}${year.toString().substring(2)}.CSV`;
        output.url = `https://www.bseindia.com/download/BhavCopy/Equity/${output.filename.replace('.CSV', '.zip')}`;
        output.type = 'zip';
    }
    
    return output;
}

/**
 * Download closing report
 * @param {Date} date - Date
 * @param {object} options - Options
 * @param {object} [options.callback] - Callbacks
 * @param {RowCallback} [options.callback.row] - Row map callback
 * 
 * @returns {Promise<{ ClosingReport }>}
 */
async function downloadClosingReport(date, options = {}) {
    const { url: closingReportUrl, filename, type: fileType } = await getClosingReportURL(date);
    const fileBuffer = await downloadFileFromURL(closingReportUrl);
    const buffer = fileType === 'csv' ? fileBuffer : await extractFileFromZip(fileBuffer, filename);
    const workbook = xlsx.read(buffer);
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    const data = rows.map(row => {
        const mapped = {
            name: row.FinInstrmNm ?? row.SC_NAME,
            isin: row.ISIN ?? row.ISIN_CODE,
            symbol: row.TckrSymb ?? row['SCRIP ID'],
            series: row.SctySrs,
            open: row.OpnPric ?? row['OPEN PRICE'] ?? row.OPEN,
            high: row.HghPric ?? row['HIGH PRICE'] ?? row.HIGH,
            low: row.LwPric ?? row['LOW PRICE'] ?? row.LOW,
            close: row.ClsPric ?? row['CLOSING PRICE'] ?? row.CLOSE,
            last: row.LastPric ?? row.LAST,
            prev_close: row.PrvsClsgPric ?? row['PREVIOUS CLOSE PRICE'] ?? row.PREVCLOSE,
            total_trading_volume: row.TtlTradgVol ?? row.NO_OF_SHRS,
            total_trading_value: row.TtlTrfVal ?? row.NET_TURNOV,
            total_no_of_tx_executed: row.TtlNbOfTxsExctd ?? row.NO_TRADES
        };

        mapped.symbol = mapped.symbol ?? mapped.isin;
        mapped.name = mapped.name ?? mapped.symbol;

        if (options.callback && typeof options.callback.row === 'function') {
            options.callback.row(mapped);
        }

        return mapped;
    });

    return {
        data,
        report_url: closingReportUrl
    };
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
        throw new ReportNotFoundError(`Report not found - ${url}`, {
            exchange: 'BSE',
            report_url: url
        });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer, 'binary');

    return buffer;
}

module.exports = {
    getClosingData
};
