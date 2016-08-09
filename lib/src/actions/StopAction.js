"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var actions_1 = require('../actions');
var StopAction = (function (_super) {
    __extends(StopAction, _super);
    function StopAction() {
        _super.apply(this, arguments);
    }
    StopAction.prototype.run = function (deployment) {
        return this._executePararell("stop", deployment, [this.config.appName]);
    };
    ;
    return StopAction;
}(actions_1.Actions));
exports.StopAction = StopAction;
//# sourceMappingURL=StopAction.js.map