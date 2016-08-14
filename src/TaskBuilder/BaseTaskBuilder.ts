
import {Config} from "../config";
import {SessionGroup} from "../SessionManager";

export abstract class BaseTaskBuilder {

  protected sessionGroup : SessionGroup;

  constructor(sessionGroup : SessionGroup) {
    this.sessionGroup = sessionGroup;
  }

  abstract setup(config:Config);

  abstract deploy(config:Config, bundlePath:string, env, checkDelay);

  abstract reconfig(env, config:Config);

  abstract start(config:Config);

  abstract restart(config:Config);

  abstract stop(config:Config);
}
