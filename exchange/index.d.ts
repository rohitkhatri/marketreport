import { Exchange, Stock } from "./types";

/**
 * Get closing report for NSE & BSE
 * @param {Exchange} exchangeType - Exchange
 * @param {Date} [date] - Date for which the report has to be downloaded
 */
export function getClosingReport(
  exchangeType: Exchange,
  date?: Date
): Promise<Stock[]>;
