"use strict";
var Plugin = (function () {
    function Plugin() {
    }
    Plugin.prototype.whenSuccess = function (deployment) { };
    Plugin.prototype.whenFailure = function (deployment) { };
    Plugin.prototype.whenBeforeBuilding = function (deployment) { };
    Plugin.prototype.whenBeforeDeploying = function (deployment) { };
    Plugin.prototype.whenAfterCompleted = function (deployment) { };
    Plugin.prototype.whenAfterDeployed = function (deployment) { };
    return Plugin;
}());
exports.Plugin = Plugin;
//# sourceMappingURL=Plugin.js.map