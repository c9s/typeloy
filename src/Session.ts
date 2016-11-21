import {ServerConfig} from "./config";


/*
Session {
  _host: '...',
  _auth: { username: 'root', password: '...' },
  _options:
   { ssh: { agent: '....' },
     keepAlive: true },
  _keepAlive: true,
  _tasks: [],
  _callbacks: [],
  _debug: { [Function: disabled] enabled: false },
  _serverConfig:
   { host: '....',
     username: 'root',
     password: '...',
     env:
      { ROOT_URL: 'http://site.com',
        CLUSTER_ENDPOINT_URL: 'http://111.222.11.22:80' },
     sshOptions: { agent: '/tmp/ssh-RcgKVIGk8tfL/agent.4345' },
     os: 'linux' } }
*/
export interface Session {

  _serverConfig : ServerConfig;

  _host : string;

  _auth : any;

  _keepAlive : boolean;


  /**
   * copy data from src to dest
   */
  copy(src, dest, options, callback?)

  download(src, dest, options, callback?)

  /**
   * execute shell command on remote server
   */
  execute(shellCommand, options, callback?)

  /**
   * execute script on remote server
   */
  executeScript(scriptFile, options, callback?)


  /**
   * close the connection.
   */
  close()
}

export type SessionCallback = (err, code, logs) => void;

export interface SessionResultLogs {
  stdout : string;
  stderr : string;
}

export interface SessionResult {
  err : any;
  code : number;
  logs : SessionResultLogs;
}

export interface SessionDownloadOptions {
  progressBar? : boolean;
}

export interface SessionCopyOptions {
  progressBar? : boolean;
  vars? : any;
}

function wrapSessionCallbackPromise(resolve, callback? : SessionCallback) : SessionCallback {
  return (err, code, logs : SessionResultLogs) : void => {
    if (callback) {
      callback.call(this, err, code, logs);
    }
    resolve({ err, code, logs } as SessionResult);
  };
}


export function download(session : Session, remoteFile : string, localFile : string, options : SessionDownloadOptions, callback? : SessionCallback) : Promise<SessionResult> {
  return new Promise<SessionResult>(resolve => {
    session.download(remoteFile, localFile, options, wrapSessionCallbackPromise(callback));
  });
}

export function copy(session : Session, localFile : string, remoteFile : string, options : SessionCopyOptions, callback? : SessionCallback) : Promise<SessionResult> {
  return new Promise<SessionResult>(resolve => {
    session.copy(localFile, remoteFile, options, wrapSessionCallbackPromise(callback));
  });
}

export function execute(session : Session, shellCommand : string, options : Object, callback ?: SessionCallback) : Promise<SessionResult> {
  return new Promise<SessionResult>(resolve => {
    session.execute(shellCommand, options, wrapSessionCallbackPromise(resolve, callback));
  });
}

// a simple helper that catch thenable result to promise
export function run(t : Promise<SessionResult>) {
  return (s : SessionResult) => { return t };
}

export function sync(...tasks : Array<Promise<SessionResult>>) : Promise<SessionResult> {
  let t = Promise.resolve()
  for (let i = 0; i < tasks.length ; i++) {
    t = t.then(run(tasks[i]));
  }
  return t;
}


/**
 * A promise compliant wrapper for executeScript method.
 */
export function executeScript(session : Session, script : string, vars : Object, callback? : SessionCallback) : Promise<SessionResult> {
  return new Promise<SessionResult>(resolve => {
    session.executeScript(script, { 'vars': vars }, wrapSessionCallbackPromise(resolve, callback));
  });
}
