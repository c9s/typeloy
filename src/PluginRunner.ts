import {Config} from "./config";

import {GitRevCollector, GitRevInfo} from "./collectors";
import {Deployment} from "./Deployment";
import {Plugin} from "./Plugin";

export * from "./plugins/SlackPlugin";

var _ = require('underscore');

export class PluginRunner {

  protected config : Config;

  protected plugins : Array<Plugin> = [];

  constructor(config : Config) {
    this.config = config;
    this.plugins = [];
    if (this.config.plugins && this.config.plugins instanceof Array) {
      _.each(this.config.plugins, (pc) => {
        // pc == plugin config or plugin instance
        this.plugins.push(pc);
      });
    }
  }

  public whenBeforeBuilding(deployment : Deployment) {
    _.each(this.plugins, (p) => { p.whenBeforeBuilding(deployment); });
  }

  public whenBeforeDeploying(deployment : Deployment) {
    _.each(this.plugins, (p) => { p.whenBeforeDeploying(deployment); });
  }

  public whenSuccess(deployment : Deployment) : Promise<any> {
    let promises = _.compact(_.map(this.plugins, (p) => p.whenSuccess(deployment)));
    if (promises.length == 0) {
      return;
    }
    return Promise.all(promises);
  }

  public whenFailure(deployment:Deployment) : Promise<any> {
    let promises = _.compact(_.map(this.plugins, (p) => p.whenFailure(deployment)));
    if (promises.length == 0) {
      return;
    }
    return Promise.all(promises);
  }

  public whenAfterCompleted(deployment:Deployment) {
    _.each(this.plugins, (p) => { p.whenAfterCompleted(deployment); });
  }

  public whenAfterDeployed(deployment:Deployment) {
    _.each(this.plugins, (p) => { p.whenAfterDeployed(deployment); });
  }
}





