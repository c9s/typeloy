

import {Config, AppConfig} from "../config";

var path = require('path');

export abstract class Task {

  protected config : Config;

  protected appRoot : string;

  protected deployPrefix : string;

  constructor(config : Config) {
    this.config = config;
    this.deployPrefix = '/opt';
    this.appRoot = this.deployPrefix + '/' + this.config.app.name;
  }

  protected getAppRoot() : string {
    return path.join(this.deployPrefix, this.config.app.name);
  }

  public abstract describe();

  public abstract build(taskList);
}
