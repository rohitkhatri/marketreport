/**
 * @default 'NSE'
 */
export type Exchange = "NSE" | "BSE";

export interface Stock {
  /**
   * Company name
   */
  name: string;
  /**
   * Company ISIN code
   */
  isin: string;
  /**
   * Company market ticker symbol
   */
  symbol: string;
  /**
   * Open price
   */
  open: number;
  /**
   * High price
   */
  high: number;
  /**
   * Low price
   */
  low: number;
  /**
   * Closing price
   */
  close: number;
  /**
   * Last price
   */
  last: number;
  /**
   * Prevous closing price
   */
  prev_close: number;
  /**
   * Total trading volume
   */
  total_trading_volume: number;
  /**
   * Total trading value in crore
   */
  total_trading_value: number;
  /**
   * Total number of transactions executed
   */
  total_no_of_tx_executed: number;
}

export interface Company {
  /**
   * Company name
   */
  name: string;
  /**
   * Company market ticker symbol
   */
  symbol: string;
}

/**
 * Row callback which is executed while serializing each row
 */
export type RowCallback = (stockEntity: Stock) => void;
