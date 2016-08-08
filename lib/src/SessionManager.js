"use strict";
var fs = require('fs');
var nodemiral = require('nodemiral');
var path = require('path');
class SessionManager {
    static create(server) {
        const host = server.host;
        /// The auth object is used for nodemiral to connect ssh servers.
        let auth = {
            username: server.username
        };
        if (server.pem) {
            auth.pem = fs.readFileSync(path.resolve(server.pem), 'utf8');
        }
        else {
            auth.password = server.password;
        }
        // create options for nodemiral
        const nodemiralOptions = {
            ssh: server.sshOptions,
            keepAlive: true
        };
        let session = nodemiral.session(host, auth, nodemiralOptions);
        session._serverConfig = server;
        return session;
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=SessionManager.js.map