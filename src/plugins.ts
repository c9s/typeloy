
import {Config} from "./config";
import _ from "underscore";

export class Plugin {

  /**
   * plugin config
   */
  protected config:any;

  constructor(config:Config) {
    this.config = config;
  }
}


export class PluginRunner {

  protected config:Config;

  protected cwd:string;

  protected plugins:Array<Plugin> = [];

  constructor(config:Config, cwd:string) {
    this.cwd = cwd;
    this.config = config;

    if (this.config.plugins instanceof Array) {
      _.each(this.config.plugins, (pc) => {
        // pc == plugin config or plugin instance
        this.plugins.push(pc);
      });
    }
  }

  public whenSuccess(deployment) {
  }

  public whenFailure(deployment) {

  }

  public whenAfterCompleted(deployment) {
  }

  public whenAfterDeployed(deployment) {

  }
}



var slack = require('node-slack');

/***
 * 
 */
export class SlackNotificationPlugin extends Plugin {


  protected api:any;

  constructor(config:any) {
    super(config);
    this.api = new slack(config.hookUrl, config.options);
  }

  // https://github.com/xoxco/node-slack
  send(msg) {
    this.api.send(msg);
  }
}
