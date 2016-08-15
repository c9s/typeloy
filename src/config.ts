var cjson = require('cjson');
var format = require('util').format;
import path = require('path');
import fs = require('fs');
import 'colors';
var _ = require('underscore');

export interface Env {
  [key:string]: string
}

export interface SshOptions {
  agent?: string;
  port?: number;
}


export interface SiteConfig {
  servers : Array<ServerConfig>;
  init? : string;
  env? : Env;
}


export interface SiteMapConfig {
  [name:string] : SiteConfig;
}

export interface ServerConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  app?: string;
  os?: string; // linux or sunos
  pem?: string;
  env?: Env;
  sshOptions: SshOptions;
  init? : string; // systemd or upstart
}

export interface SslConfig {
  backendPort: number;
  pem: string;
}

export type MeteorSettings = any;

export interface AppConfig {
  // name is required
  name: string;

  // the root directory of the app, the default value can be "."
  directory?: string;

  // the root of the repository
  root?: string;

  settings?: string|MeteorSettings;
}

export interface MeteorConfig {
  // originally config.meteorBinary
  binary: string;

  env?: Env;

  server?: string; // server option for --server http://localhost:3000
}

export interface SetupConfig {
  node?: boolean;
  nodeVersion?: string;
  phantom?: boolean;
  mongo?: boolean;
}

export interface DeployConfig {
  checkDelay?: number;
  exposeSiteName?: boolean;
  exposeVersionInfo?: boolean;
  arch?: string; // --architecture os.linux.x86_64
}


export interface LegacyConfig {
  // common options
  servers?: Array<ServerConfig>;
  env: Env;
  ssl?: SslConfig;
  enableUploadProgressBar: boolean;

  // legacy options
  app: string; // path to the app
  appName: string; // the name of the app
  meteorBinary: string;
  deployCheckWaitTime?: number;

  setupNode: boolean;
  setupPhantom: boolean;
  setupMongo: boolean;
  nodeVersion?: string;
}

export interface Config {
  setup?: SetupConfig;
  deploy?: DeployConfig;

  // We will convert servers into "default" => servers => [ .... ]
  sites: SiteMapConfig;

  app: AppConfig;
  meteor: MeteorConfig;

  enableUploadProgressBar: boolean;
  env: Env;
  ssl?: SslConfig;
  deployCheckWaitTime?: number;
  plugins: Array<any>;

  dirname ?: string;
}



function expandPath(loc:string) : string {
  if (/^win/.test(process.platform)) {
    return loc.replace('~', process.env.USERPROFILE);
  }
  return loc.replace('~', process.env.HOME);
}

function fatal(message:string) {
  const errorMessage = 'Invalid json config file: ' + message;
  console.error(errorMessage);
  process.exit(1);
}

function canonicalizePath(loc : string) : string {
  const localDir : string = path.resolve(__dirname, loc);
  if (fs.existsSync(localDir)) {
    return localDir;
  }
  return path.resolve(expandPath(loc));
}

export class ConfigParser {

  public static parse(configPath : string) : Config {
    var config : LegacyConfig;
    if (configPath.match(/\.json$/)) {
      config = cjson.load(configPath);
    } else if (configPath.match(/\.js$/)) {
      config = require(configPath);
    } else {
      // fallback to json parsing
      config = cjson.load(configPath);
    }

    let newconfig = this.preprocess(config);
    this.validate(newconfig);

    newconfig.dirname = path.dirname(configPath);
    if (!loadMeteorSettings(newconfig)) {
      console.error("**WARNING**: settings.json not found.");
    }
    return newconfig;
  }

  public static convertLegacyConfig(config:Config, _config:LegacyConfig) : Config {
    // Convert legacy setup configs to new SetupConfig
    if (typeof _config.setupNode !== "undefined") {
      config.setup.node = _config.setupNode || true;
    }
    if (typeof _config.nodeVersion !== "undefined") {
      config.setup.nodeVersion = _config.nodeVersion || '4.4.7';
    }
    if (typeof _config.setupPhantom !== "undefined") {
      config.setup.phantom = true;
    }
    if (typeof _config.setupMongo !== "undefined") {
      config.setup.mongo = true;
    }
    if (typeof _config.deployCheckWaitTime !== "undefined") {
      config.deploy.checkDelay = config.deployCheckWaitTime;
    }

    // app was a string in legacy config format
    if (typeof config.app === "undefined" || typeof config.app === "string") {
      config.app = {} as AppConfig;
    }

    if (typeof _config.app === "string") {
      config.app.directory = _config.app;
    }

    if (typeof _config.appName === "string") {
      config.app.name = _config.appName;
    }
    if (typeof _config.meteorBinary === "string") {
      config.meteor.binary = _config.meteorBinary;
    }

    // Transfer the default servers to "default" site If site name is not
    // defined, we will use default as the default site list.
    if (typeof _config.servers !== "undefined") {
      config.sites["default"] = {
        "servers": _config.servers
      };
    }
    return config;
  }

  public static preprocess(_config) : Config {
    // cast legacy config to typeloy config
    let config = <Config>_.extend({}, _config);

    config.env = config.env || {};
    config.setup = config.setup || {} as SetupConfig;
    config.deploy = config.deploy || {
      // most servers are using linux x86_64,
      // users may override this from config.
      'arch': 'os.linux.x86_64'
    } as DeployConfig;
    config.sites = config.sites || {} as SiteMapConfig;
    config.meteor = config.meteor || {} as MeteorConfig;
    config.app = config.app || {} as AppConfig;
    config = this.convertLegacyConfig(config, _config);

    config.meteor.binary = (config.meteor.binary) ? canonicalizePath(config.meteor.binary) : 'meteor';
    if (typeof config.app.name === "undefined") {
      config.app.name = "meteor";
    }
    if (typeof config.app.directory === "undefined") {
      config.app.directory = ".";
    }

    if (typeof config.enableUploadProgressBar === "undefined") {
      config.enableUploadProgressBar = true;
    }

    _.each(config.sites, (siteConfig, siteName) => {
      _.each(siteConfig.servers, (server:ServerConfig) => {
        let sshAgentExists = false;
        let sshAgent:string = process.env.SSH_AUTH_SOCK;
        if (sshAgent) {
          sshAgentExists = fs.existsSync(sshAgent);
          server.sshOptions = server.sshOptions || {};
          server.sshOptions.agent = sshAgent;
        }
        server.os = server.os || "linux";
        if (server.pem) {
          server.pem = expandPath(server.pem);
        }

        server.env = server.env || {};
        var defaultEndpointUrl : string =
          format("http://%s:%s", server.host, config.env['PORT'] || 80);
        server.env['CLUSTER_ENDPOINT_URL'] =
          server.env['CLUSTER_ENDPOINT_URL'] || defaultEndpointUrl;
      });
    });

    // rewrite ~ with $HOME
    config.app.directory = expandPath(config.app.directory);
    if (config.ssl) {
      config.ssl.backendPort = config.ssl.backendPort || 80;
      config.ssl.pem = path.resolve(expandPath(config.ssl.pem));
    }
    return config;
  }

  public static validate(config:Config) {

    function validateServerConfig(server:ServerConfig, sshAgentExists: boolean) : boolean {
      if (!server.host) {
        fatal('Server host does not exist');
      }
      if (!server.username) {
        fatal('Server username does not exist');
      }
      if (!server.password && !server.pem && !sshAgentExists) {
        fatal('Server password, pem or a ssh agent does not exist');
      }
      return true;
    }

    // validating server config
    if (!config.sites) {
      fatal("Config 'sites' or 'servers' is not defined.");
    }
    if (_.isEmpty(config.sites)) {
      fatal("Config 'servers' or 'sites' is empty.");
    }


    var sshAgentExists:boolean = false;
    var sshAgent:string = process.env.SSH_AUTH_SOCK;
    if (sshAgent) {
      sshAgentExists = fs.existsSync(sshAgent);
    }
    _.each(config.sites, (siteConfig, siteName) => {
      _.each(siteConfig.servers, (server:ServerConfig) => {
        validateServerConfig(server, sshAgentExists);
      });
    });

    if (!config.app.directory) {
      fatal('Path to app does not exist');
    }
    if (config.ssl) {
      if (!fs.existsSync(config.ssl.pem)) {
        fatal('SSL pem file does not exist');
      }
    }
  }
}

export function readConfig(configPath : string) : Config {
  if (configPath) {
    let filepath : string = path.resolve(configPath);
    if (fs.existsSync(filepath)) {
      return ConfigParser.parse(filepath);
    }
  }
  let possibleConfigFiles:Array<string> = ['typeloy.js', 'typeloy.json', 'typeloy.config.json', 'mup.json'];
  for (var i = 0; i < possibleConfigFiles.length ; i++) {
    let fn = possibleConfigFiles[i];
    let filepath : string = path.resolve(fn);
    if (fs.existsSync(filepath)) {
      return ConfigParser.parse(filepath);
    }
  }
  console.error('config file does not exist! possible config filenames: [' + possibleConfigFiles.join(',') + ']');
  // helpers.printHelp();
  process.exit(1);
};


function loadMeteorSettings(config : Config) {
  if (typeof config.app === "undefined") {
    config.app = {} as AppConfig;
  }
  if (typeof config.app.settings === "object") {
    return config.app.settings;
  }
  let settingsFilename = config.app.settings;
  if (typeof settingsFilename === "string") {
    let dir;
    let settingsFile;

    if (dir = config.dirname) {
      settingsFile = path.resolve(dir, settingsFilename);
      if (fs.existsSync(settingsFile)) {
        console.log(`Found ${settingsFile}`);
        return config.app.settings = require(settingsFile);
      }
    }
    if (dir = config.app.directory) {
      settingsFile = path.resolve(dir, settingsFilename);
      if (fs.existsSync(settingsFile)) {
        console.log(`Found ${settingsFile}`);
        return config.app.settings = require(settingsFile);
      }
    }
    if (dir = config.app.root) {
      settingsFile = path.resolve(dir, settingsFilename);
      if (fs.existsSync(settingsFile)) {
        console.log(`Found ${settingsFile}`);
        return config.app.settings = require(settingsFile);
      }
    }
    if (fs.existsSync(settingsFilename)) {
      console.log(`Found ${settingsFilename}`);
      return config.app.settings = require(settingsFilename);
    }
  }
}
