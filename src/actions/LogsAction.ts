import {BaseAction} from './BaseAction';
import {Config} from '../config';
import {Deployment} from '../Deployment';
import {Session} from '../Session';
import {SessionManager, SessionManagerConfig, SessionGroup, SessionsMap} from '../SessionManager';

var _ = require('underscore');

export interface LogsOptions {
  tail?: boolean;
  init?: string;
}

export class LogsAction extends BaseAction {

  public run(deployment : Deployment, sites : Array<string>, options : LogsOptions) {

    const self = this;
    let tailOptions = [];
    if (options.tail) {
      tailOptions.push('-f');
    }
    const tailOptionArgs = tailOptions.join(' ');

    function journalctl(config : Config, tailOptions) {
      return `sudo journalctl -u ${config.app.name}.service --since today ${tailOptions.join(' ')}`;
    }

    function tailCommand(os : string, config : Config, tailOptions) {
      if (os == 'linux') {
        return 'sudo tail ' + tailOptions.join(' ') + ' /var/log/upstart/' + config.app.name + '.log';
      } else if (os == 'sunos') {
        return 'sudo tail ' + tailOptions.join(' ') +
          ' /var/svc/log/site-' + config.app.name + '\\:default.log';
      } else {
        throw new Error("Unsupported OS.");
      }
    }

    _.map(sites, (site : string) => {
      let siteConfig = this.getSiteConfig(site);
      let sessionsMap = this.createSiteSessionsMap(siteConfig);
      for (let os in sessionsMap) {
        let sessionGroup : SessionGroup = sessionsMap[os];
        sessionGroup.sessions.forEach((session : Session) => {
          let hostPrefix = '[' + session._host + '] ';
          let serverConfig = session._serverConfig;
          let isSystemd = serverConfig.init === "systemd" || siteConfig.init === "systemd" || options.init === "systemd";
          let command = isSystemd
              ? journalctl(this.config, tailOptions)
              : tailCommand(os, this.config, tailOptions)
              ;
          session.execute(command, {
            "onStdout": (data) => {
              process.stdout.write(hostPrefix + data.toString());
            },
            "onStderr": (data) => {
              process.stderr.write(hostPrefix + data.toString());
            }
          });
        });
      }
    });

  }
}
