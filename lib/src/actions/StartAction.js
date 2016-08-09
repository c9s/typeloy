"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var actions_1 = require('../actions');
var StartAction = (function (_super) {
    __extends(StartAction, _super);
    function StartAction() {
        _super.apply(this, arguments);
    }
    StartAction.prototype.run = function (deployment) {
        return this._executePararell("start", deployment, [this.config.appName]);
    };
    return StartAction;
}(actions_1.Actions));
exports.StartAction = StartAction;
//# sourceMappingURL=StartAction.js.map