import { Exchange, Stock } from "./types";
import { ReportNotFoundError } from "./errors";

/**
 * Get closing report for NSE & BSE
 * @param {Exchange} exchangeType - Exchange
 * @param {Date} [date] - Date for which the report has to be downloaded
 *
 * @throws {ReportNotFoundError}
 */
export function getClosingReport(
  exchangeType: Exchange,
  date?: Date
): Promise<Stock[]>;
