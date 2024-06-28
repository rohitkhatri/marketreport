const AdmZip = require('adm-zip');
const xlsx = require('xlsx');
const fs = require('fs/promises');

const { ReportNotFoundError } = require('./errors');
const { months, companiesCacheFile } = require('./constants');

/**
 * @callback RowMapCallback
 * @param {object} data - Row data object
 */

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
 * @returns {Promise<string?>}
 */
async function getCompaniesDetailReportURL(date) {
    const response = await fetch('https://www.nseindia.com/regulations/listing-compliance/nse-market-capitalisation-all-companies');
    const content = await response.text();
    const match = content.match(/<a data-entity-type="file"(?:.*)href="(.*)">/);

    if(match) {
        return match[1];
    }

    return null;
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
    const formattedDate = `${day}${month}${year}`;

    const output = {
        filename: `BhavCopy_NSE_CM_0_0_0_${year}${month}${day}_F_0000.csv`,
        url: `https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_${year}${month}${day}_F_0000.csv.zip`,
        // url: `https://archives.nseindia.com/content/cm/${year}/${months[date.getMonth()]}/BhavCopy_NSE_CM_0_0_0_${year}${month}${day}_F_0000.csv.zip`,
        type: 'zip'
    };

    if (date >= new Date('2024-01-01')) {
        // BhavCopy_NSE_CM_0_0_0_20240101_F_0000.csv.zip
        return output;
    } else if (date >= new Date('2023-01-11') && date <= new Date('2023-12-31')) {
        // NSE_CM_bhavcopy_01012023.csv
        output.filename = `NSE_CM_bhavcopy_${formattedDate}.csv`;
        output.url = `https://archives.nseindia.com/content/historical/EQUITIES/${year}/${months[date.getMonth()]}/NSE_CM_bhavcopy_${formattedDate}.csv.zip`;
        output.type = 'zip';
    } else if (date >= new Date('2022-10-07') && date <= new Date('2023-01-10')) {
        // NSE_CM_bhavcopy_06OCT2022.csv
        output.filename = `NSE_CM_bhavcopy_${day}${months[date.getMonth()]}${year}.csv`;
        output.url = `https://archives.nseindia.com/content/historical/EQUITIES/${year}/${months[date.getMonth()]}/${output.filename}.zip`;
        output.type = 'zip';
    } else if (date >= new Date('2011-06-22') && date <= new Date('2022-10-06')) {
        // cm22JUN2011bhav.csv
        output.filename = `cm${day}${months[date.getMonth()]}${year}bhav.csv`;
        output.url = `https://archives.nseindia.com/content/historical/EQUITIES/${year}/${months[date.getMonth()]}/${output.filename}.zip`;
        output.type = 'zip';
    }

    return output;
}

/**
 * Download closing report
 * @param {Date} date - Date
 * @param {object} options - Options
 * @param {object} [options.callback] - Callbacks
 * @param {RowMapCallback} [options.callback.row] - Row map callback
 * 
 * @returns {Promise<import('./types').ClosingReport>}
 */
async function downloadClosingReport(date, options = {}) {
    const { url: closingReportUrl, filename, type: fileType } = await getClosingReportURL(date);
    const fileBuffer = await downloadFileFromURL(closingReportUrl);
    const buffer = fileType === 'csv' ? fileBuffer : await extractFileFromZip(fileBuffer, filename);
    const workbook = xlsx.read(buffer);
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    const data = rows.map(row => {
        const mapped = {
            isin: row.ISIN,
            symbol: row.SYMBOL ?? row.TckrSymb ?? row.SYMBOL,
            series: row.SctySrs ?? row['SERIES/SCRIP GROUP'] ?? row['SERIES'],
            open: row.OPEN ?? row.OpnPric ?? row['OPEN PRICE'],
            high: row.HIGH ?? row.HghPric ?? row['HIGH PRICE'],
            low: row.LOW ?? row.LwPric ?? row['LOW PRICE'],
            close: row.CLOSE ?? row.ClsPric ?? row['CLOSING PRICE'],
            last: row.LAST ?? row.LastPric ?? row['LAST TRADED PRICE'],
            prev_close: row.PREVCLOSE ?? row.PrvsClsgPric ?? row['PREVIOUS CLOSE PRICE'],
            total_trading_volume: row.TOTTRDQTY ?? row.TtlTradgVol ?? row['TRADED QUANTITY'],
            total_trading_value: row.TOTTRDVAL ?? row.TtlTrfVal ?? row['TRADED VALUE'],
            total_no_of_tx_executed: row.TOTALTRADES ?? row.TtlNbOfTxsExctd ?? row['NUMBER OF TRADES']
        };

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
 * Download company details
 * @param {object} options - Options
 * @param {boolean} options.invalidate_cache - Ignore cache and fetch fresh data
 * 
 * @returns {Promise<Company[]>}
 */
async function getCompaniesDetails(options = {}) {
    let companies = null;
    let refetch = !!options.invalidate_cache;

    if (!refetch) {
        try {
            const cachedCompanies = await fs.readFile(companiesCacheFile);
            const data = JSON.parse(cachedCompanies.toString());

            if ((new Date(data.meta.cached_at)).getDate() < new Date().getDate()) {
                refetch = true;
            }

            companies = data.companies;
        } catch(e) {
            refetch = true;
        }
    }

    if (refetch) {
        const url = await getCompaniesDetailReportURL();
        const buffer = await downloadFileFromURL(url);
        const workbook = xlsx.read(buffer);
        const _companies = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        const data = {
            meta: {
                cached_at: new Date()
            },
            companies: {}
        };

        for (const company of _companies) {
            if (!company['Company Name']) {
                continue;
            }

            data.companies[company['Symbol']] = {
                name: company['Company Name'],
                symbol: company['Symbol'],
            };
        }

        await fs.writeFile(companiesCacheFile, JSON.stringify(data));

        companies = data.companies;
    }

    return companies;
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
            exchange: 'NSE',
            report_url: url
        });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer, 'binary');

    return buffer;
}

/**
 * Extract file from zip
 * @param {Buffer} zipBuffer - zip buffer
 * @param {string} filename - Filename to extract
 * 
 * @returns {Promise<Buffer>}
 */
async function extractFileFromZip(zipBuffer, filename) {
    const zip = new AdmZip(zipBuffer);
    const content = zip.readAsText(filename);
    const buffer = Buffer.from(content, 'utf-8');

    return buffer;
}

module.exports = {
    getCompaniesDetails,
    extractFileFromZip,
    getClosingData
};
