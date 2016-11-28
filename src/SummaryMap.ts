const _ = require('underscore');

export interface SummaryMap {
  // summaryMap[session._host] = {error: err, history: history};
  [host: string] : SummaryMapResult
}

export interface SummaryMapResult {
  error: boolean;
  history: Array<SummaryMapHistory>;
}

export interface SummaryMapHistory {
  "task"? : any;
  "error" : any;
  "status"? : any; // SUCCESS or FAILED

  "code"? : any;
  "context"? : any;
}

export function mergeSummaryMap(summaryMaps) : SummaryMap {
  return <SummaryMap>_.flatten(summaryMaps).reduce((cur, _summaryMap) => {
    return _.extend(cur, _summaryMap);
  })
}

export function haveSummaryMapsErrors(summaryMaps) : boolean {
  return _.some(summaryMaps, hasSummaryMapErrors);
}

export function hasSummaryMapErrors(summaryMap : SummaryMap) : boolean {
  return _.some(summaryMap, (summary : SummaryMapResult) => {
    return summary && summary.error;
  });
}
