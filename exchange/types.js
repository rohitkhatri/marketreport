/**
 * @typedef {'NSE' | 'BSE'} Exchange
 * @default 'NSE'
 */

/**
 * @typedef {Object} Company
 * @property {string} name - Company name
 * @property {string} symbol - Company market ticker symbol
 */

/**
 * @typedef {Object} Stock
 * @property {string} name - Company name
 * @property {string} isin - Company ISIN code
 * @property {string} symbol - Company market ticker symbol
 * @property {string} series - Stock instrument group or series
 * @property {number} open - Open price
 * @property {number} high - High price
 * @property {number} low - Low price
 * @property {number} close - Closing price
 * @property {number} last - Last price
 * @property {number} prev_close - Previous closing price
 * @property {number} total_trading_volume - Total trading volume
 * @property {number} total_trading_value - Total trading value in crore
 * @property {number} total_no_of_tx_executed - Total number of transactions executed
 */

/**
 * @typedef {Object} ClosingReport
 * @property {Stock[]} data - Array of stocks
 * @property {string} report_url - Stock exchange report URL from which the report is downloaded
 */

/**
 * Row callback which is executed while serializing each row
 * @callback RowCallback
 * @param {Stock} stockEntity - The stock entity to process
 * @returns {void}
 */