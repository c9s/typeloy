"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BaseAction_1 = require('./BaseAction');
var SummaryMap_1 = require("../SummaryMap");
var _ = require('underscore');
var ReconfigAction = (function (_super) {
    __extends(ReconfigAction, _super);
    function ReconfigAction() {
        _super.apply(this, arguments);
    }
    ReconfigAction.prototype.run = function (deployment, sites) {
        var _this = this;
        var self = this;
        var sessionInfoList = [];
        var sitesPromise = Promise.resolve({});
        var _loop_1 = function(i) {
            var site = sites[i];
            sitesPromise = sitesPromise.then(function (previousSummaryMap) {
                var siteConfig = _this.getSiteConfig(site);
                var sessionsMap = _this.createSiteSessionsMap(siteConfig);
                var _loop_2 = function(os) {
                    var sessionGroup = sessionsMap[os];
                    sessionGroup.sessions.forEach(function (session) {
                        var env = _.extend({}, _this.config.env || {}, siteConfig.env || {}, session._serverConfig.env || {});
                        var taskListsBuilder = _this.createTaskBuilderByOs(sessionGroup);
                        var taskList = taskListsBuilder.reconfig(env, _this.config);
                        sessionInfoList.push({
                            'taskList': taskList,
                            'session': session
                        });
                    });
                };
                for (var os in sessionsMap) {
                    _loop_2(os);
                }
                var sessionPromises = _.map(sessionInfoList, function (sessionInfo) {
                    return new Promise(function (resolve) {
                        sessionInfo.taskList.run(sessionInfo.session, function (summaryMap) {
                            resolve(summaryMap);
                        });
                    });
                });
                return Promise.all(sessionPromises).then(function (summaryMaps) {
                    return Promise.resolve(_.extend(previousSummaryMap, SummaryMap_1.mergeSummaryMap(summaryMaps)));
                });
            });
        };
        for (var i = 0; i < sites.length; i++) {
            _loop_1(i);
        }
        return sitesPromise.then(function (summaryMap) {
            _this.whenAfterCompleted(deployment, summaryMap);
            return Promise.resolve(summaryMap);
        });
    };
    return ReconfigAction;
}(BaseAction_1.BaseAction));
exports.ReconfigAction = ReconfigAction;
//# sourceMappingURL=ReconfigAction.js.map