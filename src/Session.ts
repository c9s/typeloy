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

type SessionCallback = (err, code, logs) => void;

interface SessionResult {
  err : any;
  code : any;
  logs : any;
}

export function executeScript(session : Session, script : string, vars : Object, cb? : SessionCallback) : Promise<SessionResult> {
  // XXX: fix me
  return Promise.resolve( {} as SessionResult );
}

