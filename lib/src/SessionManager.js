"use strict";
var fs = require('fs');
var nodemiral = require('nodemiral');
var path = require('path');
var SessionManager = (function () {
    function SessionManager() {
    }
    SessionManager.create = function (server) {
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
        var nodemiralOptions = {
            ssh: server.sshOptions,
            keepAlive: true
        };
        var session = nodemiral.session(host, auth, nodemiralOptions);
        session._serverConfig = server;
        return session;
    };
    return SessionManager;
}());
exports.SessionManager = SessionManager;
//# sourceMappingURL=SessionManager.js.map