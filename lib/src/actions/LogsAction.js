"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BaseAction_1 = require('./BaseAction');
var LogsAction = (function (_super) {
    __extends(LogsAction, _super);
    function LogsAction() {
        _super.apply(this, arguments);
    }
    LogsAction.prototype.run = function (deployment, site, options) {
        var _this = this;
        var self = this;
        var tailOptions = [];
        if (options.tail) {
            tailOptions.push('-f');
        }
        var tailOptionArgs = tailOptions.join(' ');
        function journalctl(config, tailOptions) {
            return "sudo journalctl -u " + config.app.name + ".service --since today " + tailOptions.join(' ');
        }
        function tailCommand(os, config, tailOptions) {
            if (os == 'linux') {
                return 'sudo tail ' + tailOptions.join(' ') + ' /var/log/upstart/' + config.app.name + '.log';
            }
            else if (os == 'sunos') {
                return 'sudo tail ' + tailOptions.join(' ') +
                    ' /var/svc/log/site-' + config.app.name + '\\:default.log';
            }
            else {
                throw new Error("Unsupported OS.");
            }
        }
        var siteConfig = this.getSiteConfig(site);
        var sessionsMap = this.createSiteSessionsMap(siteConfig);
        var _loop_1 = function(os) {
            var sessionGroup = sessionsMap[os];
            sessionGroup.sessions.forEach(function (session) {
                var hostPrefix = '[' + session._host + '] ';
                var serverConfig = session._serverConfig;
                var isSystemd = serverConfig.init === "systemd" || siteConfig.init === "systemd" || options.init === "systemd";
                var command = isSystemd
                    ? journalctl(_this.config, tailOptions)
                    : tailCommand(os, _this.config, tailOptions);
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
}(BaseAction_1.BaseAction));
exports.LogsAction = LogsAction;
//# sourceMappingURL=LogsAction.js.map