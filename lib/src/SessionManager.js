"use strict";
var _ = require('underscore');
var fs = require('fs');
var nodemiral = require('nodemiral');
var path = require('path');
var SessionManager = (function () {
    /**
     * @param config session config
     */
    function SessionManager(config) {
        this.config = config;
    }
    SessionManager.prototype.create = function (server) {
        var host = server.host;
        /// The auth object is used for nodemiral to connect ssh servers.
        var auth = {
            username: server.username
        };
        if (server.pem) {
            auth.pem = fs.readFileSync(path.resolve(server.pem), 'utf8');
        }
        else {
            auth.password = server.password;
        }
        // create options for nodemiral
        var nodemiralOptions = _.extend(this.config, {});
        if (server.sshOptions) {
            nodemiralOptions['ssh'] = _.extend(this.config.ssh || {}, server.sshOptions);
        }
        var session = nodemiral.session(host, auth, nodemiralOptions);
        session._serverConfig = server;
        return session;
    };
    SessionManager.prototype.createSiteConnections = function (siteConfig) {
        var _this = this;
        var servers = siteConfig.servers;
        var sessionsMap = {};
        _.each(servers, function (server) {
            var session = _this.create(server);
            // Create os => taskListBuilder map
            if (!sessionsMap[server.os]) {
                sessionsMap[server.os] = {
                    "os": server.os,
                    "sessions": [],
                    "_siteConfig": siteConfig,
                };
            }
            sessionsMap[server.os].sessions.push(session);
        });
        return sessionsMap;
    };
    return SessionManager;
}());
exports.SessionManager = SessionManager;
//# sourceMappingURL=SessionManager.js.map