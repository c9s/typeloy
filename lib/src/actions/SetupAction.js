"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BaseAction_1 = require('./BaseAction');
var SetupAction = (function (_super) {
    __extends(SetupAction, _super);
    function SetupAction() {
        _super.apply(this, arguments);
    }
    SetupAction.prototype.run = function (deployment, sites) {
        this._showKadiraLink();
        return this.executePararell("setup", deployment, sites, [this.config]);
    };
    return SetupAction;
}(BaseAction_1.BaseAction));
exports.SetupAction = SetupAction;
//# sourceMappingURL=SetupAction.js.map