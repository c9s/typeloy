"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var actions_1 = require('../actions');
var LogsAction = (function (_super) {
    __extends(LogsAction, _super);
    function LogsAction() {
        _super.apply(this, arguments);
    }
    LogsAction.prototype.run = function (options) {
        var self = this;
        var tailOptions = [];
        if (options.tail) {
            tailOptions.push('-f');
        }
        function tailCommand(os, config, tailOptions) {
            if (os == 'linux') {
                return 'sudo tail ' + tailOptions.join(' ') + ' /var/log/upstart/' + config.appName + '.log';
            }
            else if (os == 'sunos') {
                return 'sudo tail ' + tailOptions.join(' ') +
                    ' /var/svc/log/site-' + config.appName + '\\:default.log';
            }
            else {
                throw new Error("Unsupported OS.");
            }
        }
        var sessionsMap = this.createSiteSessionsMap(this.config, null);
        var _loop_1 = function(os) {
            var sessionsInfo = sessionsMap[os];
            sessionsInfo.sessions.forEach(function (session) {
                var hostPrefix = '[' + session._host + '] ';
                var command = tailCommand(os, this.config, tailOptions);
                session.execute(command, {
                    "onStdout": function (data) {
                        process.stdout.write(hostPrefix + data.toString());
                    },
                    "onStderr": function (data) {
                        process.stderr.write(hostPrefix + data.toString());
                    }
                });
            });
        };
        for (var os in sessionsMap) {
            _loop_1(os);
        }
    };
    return LogsAction;
}(actions_1.Actions));
exports.LogsAction = LogsAction;
//# sourceMappingURL=LogsAction.js.map