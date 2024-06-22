const AdmZip = require('adm-zip');
const xlsx = require('xlsx');
const fs = require('fs/promises');

const { Stock, Company } = require('./types');
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
 * @returns {Promise<{url: string, filename: string}>}
 */
async function getClosingReportURL(date) {
    const day = date.getDate().toString().padStart('2', '0');
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart('2', '0');
    const formattedDate = `${day}${month}${year}`;

    const filename = `NSE_CM_bhavcopy_${formattedDate}.csv.zip`;
    return {
        filename: filename.replace('.zip', ''),
        url: `https://archives.nseindia.com/content/historical/EQUITIES/${year}/${months[date.getMonth()]}/${filename}`
    };
}

/**
 * Download closing report
 * @param {Date} date - Date
 * @param {object} options - Options
 * @param {object} [options.callback] - Callbacks
 * @param {RowMapCallback} [options.callback.row] - Row map callback
 * 
 * @returns {Promise<Stock[]>}
 */
async function downloadClosingReport(date, options = {}) {
    const { url: closingReportUrl, filename } = await getClosingReportURL(date);
    const closingReportZipBuffer = await downloadFileFromURL(closingReportUrl);
    const buffer = await extractFileFromZip(closingReportZipBuffer, filename);
    const workbook = xlsx.read(buffer);
    const json = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]).map(row => {
        const mapped = {
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

            if ((new Date(data.meta.cached_at)).getMonth() < new Date().getMonth()) {
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
        throw new ReportNotFoundError(`Cannot find report for the passed date, please verify the date!`);
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
    getClosingData
};
