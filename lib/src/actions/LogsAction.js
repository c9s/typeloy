"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BaseAction_1 = require('./BaseAction');
var _ = require('underscore');
var LogsAction = (function (_super) {
    __extends(LogsAction, _super);
    function LogsAction() {
        _super.apply(this, arguments);
    }
    LogsAction.prototype.run = function (deployment, sites, options) {
        var _this = this;
        var self = this;
        var sitesPromise = Promise.resolve({});
        var _loop_1 = function(i) {
            var site = sites[i];
            sitesPromise = sitesPromise.then(function () {
                var siteConfig = _this.getSiteConfig(site);
                var sessionsMap = _this.createSiteSessionsMap(siteConfig);
                var taskPromises = _.map(sessionsMap, function (sessionGroup, os) {
                    var sessionPromises = sessionGroup.sessions.map(function (session) {
                        return new Promise(function (resolve) {
                            var hostPrefix = "(" + site + ") [" + session._host + "] ";
                            var taskListsBuilder = _this.createTaskBuilderByOs(sessionGroup);
                            var taskList = taskListsBuilder.logs(_this.config, hostPrefix, options);
                            _this.propagateTaskEvents(taskList);
                            taskList.run(sessionGroup.sessions, function (summaryMap) {
                                resolve(summaryMap);
                            });
                        });
                    });
                    return Promise.all(sessionPromises);
                });
                return Promise.all(taskPromises);
            });
        };
        for (var i = 0; i < sites.length; i++) {
            _loop_1(i);
        }
        return sitesPromise;
    };
    return LogsAction;
}(BaseAction_1.BaseAction));
exports.LogsAction = LogsAction;
//# sourceMappingURL=LogsAction.js.map