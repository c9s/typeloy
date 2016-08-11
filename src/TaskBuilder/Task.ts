

import {Config, AppConfig} from "../config";

export abstract class Task {

  protected config : Config;

  constructor(config : Config) {
    this.config = config;
  }

  public abstract describe();

  public abstract build(taskList);
}
