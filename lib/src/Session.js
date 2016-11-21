"use strict";
function wrapSessionCallbackPromise(resolve, callback) {
    var _this = this;
    return function (err, code, logs) {
        if (callback) {
            callback.call(_this, err, code, logs);
        }
        resolve({ err: err, code: code, logs: logs });
    };
}
// session.copy(localFile, remoteFileLocation, options, callback)
function copy(session, localFile, remoteFile, options, callback) {
    return new Promise(function (resolve) {
        session.copy(localFile, remoteFile, options, wrapSessionCallbackPromise(callback));
    });
}
exports.copy = copy;
function execute(session, shellCommand, options, callback) {
    return new Promise(function (resolve) {
        session.execute(shellCommand, options, wrapSessionCallbackPromise(resolve, callback));
    });
}
exports.execute = execute;
/**
 * A promise compliant wrapper for executeScript method.
 */
function executeScript(session, script, vars, callback) {
    return new Promise(function (resolve) {
        session.executeScript(script, { 'vars': vars }, wrapSessionCallbackPromise(resolve, callback));
    });
}
exports.executeScript = executeScript;
//# sourceMappingURL=Session.js.map