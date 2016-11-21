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
function download(session, remoteFile, localFile, options, callback) {
    return new Promise(function (resolve) {
        session.download(remoteFile, localFile, options, wrapSessionCallbackPromise(callback));
    });
}
exports.download = download;
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