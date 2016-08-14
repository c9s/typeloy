"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BaseAction_1 = require('./BaseAction');
var RestartAction = (function (_super) {
    __extends(RestartAction, _super);
    function RestartAction() {
        _super.apply(this, arguments);
    }
    RestartAction.prototype.run = function (deployment, sites) {
        return this.executePararell("restart", deployment, sites, [this.config.app.name]);
    };
    return RestartAction;
}(BaseAction_1.BaseAction));
exports.RestartAction = RestartAction;
//# sourceMappingURL=RestartAction.js.map