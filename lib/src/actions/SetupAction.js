"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var actions_1 = require('../actions');
var SetupAction = (function (_super) {
    __extends(SetupAction, _super);
    function SetupAction() {
        _super.apply(this, arguments);
    }
    SetupAction.prototype.run = function (deployment) {
        this._showKadiraLink();
        return this._executePararell("setup", deployment, [this.config]);
    };
    return SetupAction;
}(actions_1.Actions));
exports.SetupAction = SetupAction;
//# sourceMappingURL=SetupAction.js.map