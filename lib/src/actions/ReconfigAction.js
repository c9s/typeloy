"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BaseAction_1 = require('./BaseAction');
var ReconfigAction = (function (_super) {
    __extends(ReconfigAction, _super);
    function ReconfigAction() {
        _super.apply(this, arguments);
    }
    ReconfigAction.prototype.run = function (deployment, site) {
        var _this = this;
        var self = this;
        var sessionInfoList = [];
        var siteConfig = this.getSiteConfig(site);
        var sessionsMap = this.createSiteSessionsMap(siteConfig);
        var _loop_1 = function(os) {
            var sessionGroup = sessionsMap[os];
            sessionGroup.sessions.forEach(function (session) {
                var env = _.extend({}, _this.config.env, session._serverConfig.env);
                var taskListsBuilder = _this.getTaskBuilderByOs(sessionGroup.os);
                var taskList = taskListsBuilder.reconfig(env, _this.config.appName);
                sessionInfoList.push({
                    'taskList': taskList,
                    'session': session
                });
            });
        };
        for (var os in sessionsMap) {
            _loop_1(os);
        }
        var promises = _.map(sessionInfoList, function (sessionInfo) {
            return new Promise(function (resolve) {
                sessionInfo.taskList.run(sessionInfo.session, function (summaryMap) {
                    resolve(summaryMap);
                });
            });
        });
        return Promise.all(promises).then(function (mapResult) {
            _this.whenAfterCompleted(deployment, mapResult);
        });
    };
    return ReconfigAction;
}(BaseAction_1.BaseAction));
exports.ReconfigAction = ReconfigAction;
//# sourceMappingURL=ReconfigAction.js.map