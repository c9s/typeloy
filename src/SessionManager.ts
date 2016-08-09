var _ = require('underscore');
var fs = require('fs');
var nodemiral = require('nodemiral');
var path = require('path');

import {Config, AppConfig, ServerConfig} from './config';
import Deployment from "./Deployment";
import LinuxTaskBuilder from "./TaskBuilder/LinuxTaskBuilder";
import SunOSTaskBuilder from "./TaskBuilder/SunOSTaskBuilder";
import {TaskBuilder} from "./TaskBuilder/BaseTaskBuilder";
import {Session} from "./Session";

import {SummaryMap,SummaryMapResult, SummaryMapHistory, haveSummaryMapsErrors, hasSummaryMapErrors} from "./SummaryMap";

/**
 * Return the task builder by operating system name.
 */
function getTaskBuilderByOs(os:string) : TaskBuilder {
  switch (os) {
    case "linux":
      return new LinuxTaskBuilder;
    case "sunos":
      return new SunOSTaskBuilder;
    default:
      throw new Error("Unsupported operating system.");
  }
}


export interface SessionsInfo {
  os: string;
  sessions: Array<any>;
  taskListsBuilder: TaskBuilder;
}

export interface SshAuthOptions {
  username: string;
  pem?: string;
  password?: string;
}

export interface SessionsMap {
  [os:string]: SessionsInfo;
}



export interface SessionManagerConfig {
  ssh? : any;
  keepAlive? : boolean;
}

export class SessionManager {

  protected config : SessionManagerConfig;

  /**
   * @param config session config
   */
  constructor(config : SessionManagerConfig) {
    this.config = config;
  }

  public create(server : ServerConfig) : Session {
    const host = server.host;

    /// The auth object is used for nodemiral to connect ssh servers.
    let auth:SshAuthOptions = {
      username: server.username
    };
    if (server.pem) {
      auth.pem = fs.readFileSync(path.resolve(server.pem), 'utf8');
    } else {
      auth.password = server.password;
    }

    // create options for nodemiral
    const nodemiralOptions = _.extend(this.config, { });

    if (server.sshOptions) {
      nodemiralOptions['ssh'] = _.extend(this.config.ssh || {}, server.sshOptions);
    }

    let session : Session = nodemiral.session(host, auth, nodemiralOptions);
    session._serverConfig = server;
    return session;
  }

  public createOsMap(servers : Array<ServerConfig>) : SessionsMap {
    let sessionsMap : SessionsMap = {} as SessionsMap;
    _.each(servers, (server : ServerConfig) => {
      let session = this.create(server);

      // Create os => taskListBuilder map
      if (!sessionsMap[server.os]) {
        sessionsMap[server.os] = {
          "os": server.os,
          "sessions": [],
          "taskListsBuilder": getTaskBuilderByOs(server.os)
        } as SessionsInfo;
      }
      sessionsMap[server.os].sessions.push(session);
    });
    return sessionsMap;
  }
}
