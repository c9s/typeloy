import {BaseAction} from './BaseAction';
import {Config} from '../config';
import {Deployment} from '../Deployment';
import {SessionManager, SessionManagerConfig, SessionGroup, SessionsMap} from '../SessionManager';

export interface LogsOptions {
  tail?: boolean;
}

export class LogsAction extends BaseAction {

  public run(deployment : Deployment, site : string, options : LogsOptions) {
    var self = this;
    var tailOptions = [];
    if (options.tail) {
      tailOptions.push('-f');
    }

    function tailCommand(os : string, config : Config, tailOptions) {
      if (os == 'linux') {
        return 'sudo tail ' + tailOptions.join(' ') + ' /var/log/upstart/' + config.appName + '.log';
      } else if (os == 'sunos') {
        return 'sudo tail ' + tailOptions.join(' ') +
          ' /var/svc/log/site-' + config.appName + '\\:default.log';
      } else {
        throw new Error("Unsupported OS.");
      }
    }

    let siteConfig = this.getSiteConfig(site);
    let sessionsMap = this.createSiteSessionsMap(siteConfig);
    for (let os in sessionsMap) {
      let sessionGroup : SessionGroup = sessionsMap[os];
      sessionGroup.sessions.forEach(function(session) {
        let hostPrefix = '[' + session._host + '] ';
        let command = tailCommand(os, this.config, tailOptions);
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
  }
}
