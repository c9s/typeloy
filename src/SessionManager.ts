
import {Config, AppConfig, ServerConfig} from './config';
import {TaskBuilder} from "./TaskBuilder/BaseTaskBuilder";

var fs = require('fs');
var nodemiral = require('nodemiral');
var path = require('path');

export interface SessionsInfo {
  sessions: Array<any>;
  taskListsBuilder: TaskBuilder;
}

export interface SshAuthOptions {
  username: string;
  pem?: string;
  password?: string;
}

export class SessionManager {
  public static create(server : ServerConfig) {
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
    const nodemiralOptions = {
      ssh: server.sshOptions,
      keepAlive: true
    };
    let session = nodemiral.session(host, auth, nodemiralOptions);
    session._serverConfig = server;
    return session;
  }
}
