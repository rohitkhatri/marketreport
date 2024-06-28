# MarketReport - NSE & BSE

## Overview

MarketReport is an npm package designed to simplify the process of downloading the Indian market closing report from the National Stock Exchange (NSE) and Bombay Stock Exchange (BSE). This package provides a convenient API to fetch the closing report for a specified date.

## Installation

You can install MarketReport using npm:

```bash
npm install marketreport
```

## Usage

Here's how you can use MarketReport in your Node.js application:

```js
const { getClosingReport } = require("marketreport");
```

## API Reference

### `getClosingReport(exchange, date)`

- `exchange`: String - The exchange from which to fetch the closing report ('NSE' for National Stock Exchange, 'BSE' for Bombay Stock Exchange).
- `date`: Date - The date for which to fetch the closing report.

Returns a Promise that resolves with the market data for the specified date and exchange.

## Example

```js
const { getClosingReport } = require("marketreport");

// Fetch BSE closing report for May 17, 2024
getClosingReport("BSE", new Date("2024-05-17"))
  .then((report) => {
    console.log(JSON.stringify(report, null, 2));
  })
  .catch((e) => {
    console.error(e);
  });
```

## Response

```json
{
  "data": [
    {
      "name": "ABB India Limited",
      "isin": "INE117A01022",
      "symbol": "ABB",
      "series": "A",
      "open": 4699,
      "high": 4715.7,
      "low": 4656,
      "close": 4678.55,
      "last": 4678.55,
      "prev_close": 4673.95,
      "total_trading_volume": 1787,
      "total_trading_value": 8375148,
      "total_no_of_tx_executed": 381
    },
    {
      "name": "AEGIS LOGISTICS LTD.",
      "isin": "INE208C01025",
      "symbol": "AEGISLOG",
      "series": "A",
      "open": 350.45,
      "high": 355.45,
      "low": 346.45,
      "close": 349.35,
      "last": 349.7,
      "prev_close": 352.35,
      "total_trading_volume": 36265,
      "total_trading_value": 12666745,
      "total_no_of_tx_executed": 1619
    },
    {},
    {},
    ...
  ],
  "report_url": "https://www.bseindia.com/download/BhavCopy/Equity/BhavCopy_BSE_CM_0_0_0_20240101_F_0000.csv"
}
```

## License

This package is licensed under the MIT License. Feel free to use and modify it as needed.

## Issues

If you encounter any issues or have suggestions for improvement, please [open an issue](https://github.com/rohitkhatri/marketreport/issues) on GitHub.

## Contribution

Contributions are welcome! Fork the repository, make your changes, and submit a pull request.
