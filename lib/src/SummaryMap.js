"use strict";
var _ = require('underscore');
function mergeSummaryMap(summaryMaps) {
    return _.flatten(summaryMaps).reduce(function (cur, _summaryMap) {
        return _.extend(cur, _summaryMap);
    });
}
exports.mergeSummaryMap = mergeSummaryMap;
function haveSummaryMapsErrors(summaryMaps) {
    return _.some(summaryMaps, hasSummaryMapErrors);
}
exports.haveSummaryMapsErrors = haveSummaryMapsErrors;
function hasSummaryMapErrors(summaryMap) {
    return _.some(summaryMap, function (summary) {
        return summary && summary.error;
    });
}
exports.hasSummaryMapErrors = hasSummaryMapErrors;
//# sourceMappingURL=SummaryMap.js.map