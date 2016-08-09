


export interface SummaryMap {
  // summaryMap[session._host] = {error: err, history: history};
  [host: string] : SummaryMapResult
}

export interface SummaryMapResult {
  error: any;
  history: Array<SummaryMapHistory>;
}

export interface SummaryMapHistory {
  "task" : string;
  "status" : string; // SUCCESS or FAILED
  "error"? : string;
}

export function haveSummaryMapsErrors(summaryMaps : Array<SummaryMap>) : boolean {
  return _.some(summaryMaps, hasSummaryMapErrors);
}

export function hasSummaryMapErrors(summaryMap : SummaryMap) : boolean {
  return _.some(summaryMap, (summary : SummaryMapResult) => {
    return summary.error;
  });
}
