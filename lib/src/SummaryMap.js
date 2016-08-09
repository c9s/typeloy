"use strict";
function haveSummaryMapsErrors(summaryMaps) {
    return _.some(summaryMaps, hasSummaryMapErrors);
}
exports.haveSummaryMapsErrors = haveSummaryMapsErrors;
function hasSummaryMapErrors(summaryMap) {
    return _.some(summaryMap, function (summary) {
        return summary.error;
    });
}
exports.hasSummaryMapErrors = hasSummaryMapErrors;
//# sourceMappingURL=SummaryMap.js.map