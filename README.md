MarketReport - NSE & BSE
=========================================================

Overview
--------

MarketReport is an npm package designed to simplify the process of downloading the Indian market closing report from the National Stock Exchange (NSE) and Bombay Stock Exchange (BSE). This package provides a convenient API to fetch the closing report for a specified date.

Installation
------------

You can install MarketReport using npm:

```bash
npm install marketreport
```

Usage
-----

Here's how you can use MarketReport in your Node.js application:

```js
const { getClosingReport } = require('marketreport');
```

API Reference
-------------

### `getClosingReport(exchange, date)`

-   `exchange`: String - The exchange from which to fetch the closing report ('NSE' for National Stock Exchange, 'BSE' for Bombay Stock Exchange).
-   `date`: Date - The date for which to fetch the closing report.

Returns a Promise that resolves with the market data for the specified date and exchange.

Example
-------

```js
const { getClosingReport } = require('marketreport');

// Fetch BSE closing report for May 17, 2024
getClosingReport('BSE', new Date('2024-05-17')).then(marketData => {
    console.log(JSON.stringify(marketData, null, 2));
}).catch(e => {
    console.error(e);
});
```

License
-------

This package is licensed under the MIT License. Feel free to use and modify it as needed.

Issues
------

If you encounter any issues or have suggestions for improvement, please [open an issue](https://github.com/rohitkhatri/marketreport/issues) on GitHub.

Contribution
------------

Contributions are welcome! Fork the repository, make your changes, and submit a pull request.
