"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var actions_1 = require('../actions');
var RestartAction = (function (_super) {
    __extends(RestartAction, _super);
    function RestartAction() {
        _super.apply(this, arguments);
    }
    RestartAction.prototype.run = function (deployment) {
        return this._executePararell("restart", deployment, [this.config.appName]);
    };
    return RestartAction;
}(actions_1.Actions));
exports.RestartAction = RestartAction;
//# sourceMappingURL=RestartAction.js.map