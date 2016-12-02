var _ = require('underscore');
var fs = require('fs');
var nodemiral = require('nodemiral');
var path = require('path');

import {Config, AppConfig, ServerConfig, SiteConfig} from './config';
import {Deployment} from "./Deployment";
import {Session} from "./Session";

import {SummaryMap,SummaryMapResult, SummaryMapHistory, haveSummaryMapsErrors, hasSummaryMapErrors} from "./SummaryMap";

export interface SessionGroup {
  os: string;
  sessions: Array<any>;
  _siteConfig?: SiteConfig;
}

export interface SshAuthOptions {
  username: string;
  pem?: string;
  password?: string;
}

export interface SessionsMap {
  [os:string]: SessionGroup;
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
    let auth : SshAuthOptions = {
      username: server.username
    };
    if (server.pem) {
      auth.pem = fs.readFileSync(path.resolve(server.pem), 'utf8');
    } else {
      auth.password = server.password;
    }

    console.log(`Connecting ${host}...`);

    // create options for nodemiral
    const nodemiralOptions = _.extend(this.config, { });

    if (server.sshOptions) {
      nodemiralOptions['ssh'] = _.extend(this.config.ssh || {}, server.sshOptions);
    }

    const session : Session = nodemiral.session(host, auth, nodemiralOptions);
    session._serverConfig = server;
    return session;
  }

  public createSiteConnections(siteConfig : SiteConfig) : SessionsMap {
    let servers : Array<ServerConfig> = siteConfig.servers;
    let sessionsMap : SessionsMap = {} as SessionsMap;
    _.each(servers, (server : ServerConfig) => {
      let session = this.create(server);

      // Create os => taskListBuilder map
      if (!sessionsMap[server.os]) {
        sessionsMap[server.os] = {
          "os": server.os,
          "sessions": [],
          "_siteConfig": siteConfig,
        } as SessionGroup;
      }
      sessionsMap[server.os].sessions.push(session);
    });
    return sessionsMap;
  }
}
