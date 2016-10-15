
import {Config} from "../config";
import {SessionGroup} from "../SessionManager";

export abstract class BaseTaskBuilder {

  protected sessionGroup : SessionGroup;

  constructor(sessionGroup : SessionGroup) {
    this.sessionGroup = sessionGroup;
  }

  abstract setup(config:Config, taskNames : Array<string>);

  abstract deploy(config:Config, bundlePath : string, env);

  abstract reconfig(env, config:Config);

  abstract start(config:Config);

  abstract restart(config:Config);

  abstract stop(config:Config);

  abstract logs(config:Config, hostPrefix : string);
}
