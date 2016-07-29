var cjson = require('cjson');
var path = require('path');
var fs = require('fs');
var format = require('util').format;

import _ = require('underscore');
import 'colors';

interface Env {
  [key:string]: string
}

interface SshOptions {
  agent?: string;
}

interface Server {
  host: string;
  port: number;
  username: string;
  password: string;
  app?: string;
  os?: string;
  pem?: string;
  env: Env;
  sshOptions: SshOptions;
}

interface SslConfig {
  backendPort: number;
  pem: string;
}

interface Config {
  setupNode: boolean;
  setupPhantom: boolean;
  enableUploadProgressBar: boolean;
  appName: string;
  env: Env;
  meteorBinary?: string;
  servers: Array<Server>;
  app: string;
  ssl?: SslConfig;
  deployCheckWaitTime?: number;
}

export class ConfigParser {

  public static parse(mupJsonPath:string) : Config {
    var config:Config = this.preprocess(cjson.load(mupJsonPath));
    this.validate(config);
    return config;
  }

  public static preprocess(config:Config) : Config {
    config.env = config.env || {};

    if (typeof config.setupNode === "undefined") {
      config.setupNode = true;
    }
    if (typeof config.setupPhantom === "undefined") {
      config.setupPhantom = true;
    }
    config.meteorBinary = (config.meteorBinary) ? getCanonicalPath(config.meteorBinary) : 'meteor';
    if (typeof config.appName === "undefined") {
      config.appName = "meteor";
    }
    if (typeof config.enableUploadProgressBar === "undefined") {
      config.enableUploadProgressBar = true;
    }
    
    _.each(config.servers, (server:Server) => {
      var sshAgentExists = false;
      var sshAgent:string = process.env.SSH_AUTH_SOCK;
      if (sshAgent) {
        sshAgentExists = fs.existsSync(sshAgent);
        server.sshOptions = server.sshOptions || {};
        server.sshOptions.agent = sshAgent;
      }
      server.os = server.os || "linux";
      if (server.pem) {
        server.pem = rewriteHome(server.pem);
      }

      server.env = server.env || {};
      var defaultEndpointUrl : string =
        format("http://%s:%s", server.host, config.env['PORT'] || 80);
      server.env['CLUSTER_ENDPOINT_URL'] =
        server.env['CLUSTER_ENDPOINT_URL'] || defaultEndpointUrl;
    });

    // rewrite ~ with $HOME
    config.app = rewriteHome(config.app);

    if (config.ssl) {
      config.ssl.backendPort = config.ssl.backendPort || 80;
      config.ssl.pem = path.resolve(rewriteHome(config.ssl.pem));
    }
    return config;
  }

  public static validate(config:Config) {
    // validating server config
    if (typeof config.servers === "undefined") {
      mupErrorLog("Config 'servers' is not defined.");
    }
    if (config.servers instanceof Array && config.servers.length == 0) {
      mupErrorLog("Config 'servers' is empty.");
    }

    _.each(config.servers, (server:Server) => {
      var sshAgentExists:boolean = false;
      var sshAgent:string = process.env.SSH_AUTH_SOCK;
      if (sshAgent) {
        sshAgentExists = fs.existsSync(sshAgent);
      }

      if (!server.host) {
        mupErrorLog('Server host does not exist');
      }
      if (!server.username) {
        mupErrorLog('Server username does not exist');
      }
      if (!server.password && !server.pem && !sshAgentExists) {
        mupErrorLog('Server password, pem or a ssh agent does not exist');
      }
      if (!config.app) {
        mupErrorLog('Path to app does not exist');
      }
    });
    if (config.ssl) {
      if (!fs.existsSync(config.ssl.pem)) {
        mupErrorLog('SSL pem file does not exist');
      }
    }
  }

}

export function read() : Config {
  var filepath : string = path.resolve('mup.json');
  if (fs.existsSync(filepath)) {
    return ConfigParser.parse(filepath);
  } else {
    console.error('mup.json file does not exist!'.red.bold);
    // helpers.printHelp();
    process.exit(1);
  }
};

function rewriteHome(loc:string) : string {
  if (/^win/.test(process.platform)) {
    return loc.replace('~', process.env.USERPROFILE);
  }
  return loc.replace('~', process.env.HOME);
}

function mupErrorLog(message:string) {
  var errorMessage = 'Invalid mup.json file: ' + message;
  console.error(errorMessage.red.bold);
  process.exit(1);
}

function getCanonicalPath(loc:string) : string {
  var localDir : string = path.resolve(__dirname, loc);
  if (fs.existsSync(localDir)) {
    return localDir;
  }
  return path.resolve(rewriteHome(loc));
}
