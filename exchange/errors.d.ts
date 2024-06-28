import { Exchange } from "./types";

interface Meta {
  report_url: string;
  exchange: Exchange;
}

export class ReportNotFoundError extends Error {
  public meta: Meta;

  constructor(message: string, meta: Meta);
}
