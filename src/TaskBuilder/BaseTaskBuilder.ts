
import {Config} from "../Config";

export interface TaskBuilder {

  setup(config:Config);

  deploy(config:Config, bundlePath:string, env, checkDelay, appName);

  reconfig(env, appName);

  restart(appName);

  stop(appName);
}