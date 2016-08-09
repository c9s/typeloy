"use strict";
var cjson = require('cjson');
var path = require('path');
var fs = require('fs');
var format = require('util').format;
var _ = require('underscore');
require('colors');
function expandPath(loc) {
    if (/^win/.test(process.platform)) {
        return loc.replace('~', process.env.USERPROFILE);
    }
    return loc.replace('~', process.env.HOME);
}
function fatal(message) {
    var errorMessage = 'Invalid json config file: ' + message;
    console.error(errorMessage);
    process.exit(1);
}
function canonicalizePath(loc) {
    var localDir = path.resolve(__dirname, loc);
    if (fs.existsSync(localDir)) {
        return localDir;
    }
    return path.resolve(expandPath(loc));
}
var ConfigParser = (function () {
    function ConfigParser() {
    }
    ConfigParser.parse = function (configPath) {
        var config;
        if (configPath.match(/\.json$/)) {
            config = cjson.load(configPath);
        }
        else if (configPath.match(/\.js$/)) {
            config = require(configPath);
        }
        else {
            // fallback to json parsing
            config = cjson.load(configPath);
        }
        var newconfig = this.preprocess(config);
        this.validate(newconfig);
        return newconfig;
    };
    ConfigParser.convertLegacyConfig = function (config, _config) {
        // Convert legacy setup configs to new SetupConfig
        if (typeof _config.setupNode !== "undefined") {
            config.setup.node = config.nodeVersion || true;
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
        if (typeof _config.app === "string") {
            var appDir = _config.app;
            config.app = {};
            config.app.directory = appDir;
        }
        if (typeof config.appName === "string") {
            config.app.name = config.appName;
        }
        if (typeof _config.meteorBinary === "string") {
            config.meteor.binary = _config.meteorBinary;
        }
        // Transfer the default servers to "default" site If site name is not
        // defined, we will use default as the default site list.
        if (typeof config.servers !== "undefined") {
            config.sites["default"] = {
                "servers": config.servers
            };
        }
        return config;
    };
    ConfigParser.preprocess = function (_config) {
        // cast legacy config to typeloy config
        var config = _config;
        config.env = config.env || {};
        config.setup = config.setup || {};
        config.deploy = config.deploy || {};
        config.sites = config.sites || {};
        config.meteor = config.meteor || {};
        config.app = config.app || {};
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
        _.each(config.sites, function (siteConfig, siteName) {
            _.each(siteConfig.servers, function (server) {
                var sshAgentExists = false;
                var sshAgent = process.env.SSH_AUTH_SOCK;
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
                var defaultEndpointUrl = format("http://%s:%s", server.host, config.env['PORT'] || 80);
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
    };
    ConfigParser.validate = function (config) {
        function validateServerConfig(server, sshAgentExists) {
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
        if (!config.servers && !config.sites) {
            fatal("Config 'sites' or 'servers' is not defined.");
        }
        if ((config.servers instanceof Array && config.servers.length == 0)
            || _.isEmpty(config.sites)) {
            fatal("Config 'servers' or 'sites' is empty.");
        }
        var sshAgentExists = false;
        var sshAgent = process.env.SSH_AUTH_SOCK;
        if (sshAgent) {
            sshAgentExists = fs.existsSync(sshAgent);
        }
        _.each(config.sites, function (siteConfig, siteName) {
            _.each(siteConfig.servers, function (server) {
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
    };
    return ConfigParser;
}());
exports.ConfigParser = ConfigParser;
function readConfig(configPath) {
    if (configPath) {
        var filepath = path.resolve(configPath);
        if (fs.existsSync(filepath)) {
            return ConfigParser.parse(filepath);
        }
    }
    var possibleConfigFiles = ['typeloy.js', 'typeloy.json', 'typeloy.config.json', 'mup.json'];
    for (var i = 0; i < possibleConfigFiles.length; i++) {
        var fn = possibleConfigFiles[i];
        var filepath = path.resolve(fn);
        if (fs.existsSync(filepath)) {
            return ConfigParser.parse(filepath);
        }
    }
    console.error('config file does not exist! possible config filenames: [' + possibleConfigFiles.join(',') + ']');
    // helpers.printHelp();
    process.exit(1);
}
exports.readConfig = readConfig;
;
//# sourceMappingURL=Config.js.map