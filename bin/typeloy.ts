#!/usr/bin/env node
import path = require('path');
import fs = require('fs');
const _ = require('underscore');

import {readConfig, Config} from '../src/config';
import {
  get_ssh_login_command,
  get_ssh_rsync_command,
  get_ssh_config
} from "../src/utils";

import {
    BaseAction,
    DeployAction,
    SetupAction,
    StartAction,
    RestartAction,
    StopAction,
    MongoDumpAction,
    MongoRestoreAction,
    MongoGetAction,
    ReconfigAction,
    LogsAction
} from '../src/actions';
import {CmdDeployOptions} from '../src/options';
import {SessionManager, SessionGroup, SessionsMap} from '../src/SessionManager';
import {SummaryMap,SummaryMapResult, SummaryMapHistory, haveSummaryMapsErrors, hasSummaryMapErrors} from "../src/SummaryMap";
import {SummaryMapConsoleFormatter} from "../src/SummaryMapConsoleFormatter";
import {SummaryMapSlackFormatter} from "../src/SummaryMapSlackFormatter";

import {Deployment} from '../src/Deployment';
import debug from '../src/Debug';

require('colors');

var prog = require('commander');

const version = '2.0.0';
const cwd = process.cwd();

prog.version(version);
prog.usage('[options] <subcommand> ...');
prog.option('-v, --verbose', 'verbose mode');
prog.option('-c, --config <file>', 'config file');




prog.command('browse [site]')
  .description('open site in a browser')
  .action((site : string, options) => {
    const config = readConfig(prog.config);
    const siteConfig = config.sites[site];
    if (!siteConfig) {
        console.error(`${site} config not found.`);
        return;
    }
    const child_process = require('child_process');
    const url = siteConfig.env['ROOT_URL'];
    child_process.spawn("open", [url], { detached : true });
  });


prog.command('get-url [site]')
  .description('get the url of a site')
  .action((site : string, options) => {
    const config = readConfig(prog.config);
    const siteConfig = config.sites[site];
    if (!siteConfig) {
        console.error(`${site} config not found.`);
        return;
    }
    console.log(siteConfig.env['ROOT_URL']);
  });

prog.command('get-ssh-rsync [site] [srcPath] [dstPath]')
  .description('get the command of ssh + rsync')
  .action((srcSite : string, srcPath : string, dstPath : string, options) => {
    const config = readConfig(prog.config);
    const siteConfig = config.sites[srcSite];
    if (!siteConfig) {
        console.error(`${srcSite} config not found.`);
        return;
    }
    const cmds = _.map(siteConfig.servers, (server) => {
        const cmd = get_ssh_rsync_command(server, srcPath, dstPath);
        console.log(cmd);
        return cmd;
    });
  });


prog.command('get-ssh-login [site]')
  .description('get the command of ssh login')
  .action((site : string, options) => {
    const config = readConfig(prog.config);
    const siteConfig = config.sites[site];
    if (!siteConfig) {
        console.error(`${site} config not found.`);
        return;
    }
    const cmds = _.map(siteConfig.servers, (server) => {
        const cmd = get_ssh_login_command(server);
        console.log(cmd);
        return cmd;
    });
  })
  ;

prog.command('get-ssh-config [site]')
  .description('get config for .ssh/config')
  .action((site : string, remotePath : string, options) => {
    const config = readConfig(prog.config);
    const siteConfig = config.sites[site];
    if (!siteConfig) {
        console.error(`${site} config not found.`);
        return;
    }
    const cmds = _.map(siteConfig.servers, (server) => {
        const cmd = get_ssh_config(site, siteConfig, server);
        console.log(cmd);
        return cmd;
    });
  });


prog.command('deploy [sites...]')
  .description('set the deployment tag and start deploying.')
  .option("-d, --dryrun", 'do not really deploy it.')
  .option("--bundle-file <file>", 'the bundle file you have already built with meteor build.')
  .option("--build-dir <dir>", 'the meteor build directory.')
  .option("--tag <tag>", 'deployment tag')
  .option("-C, --no-clean", 'whether to clean up the bundle files.')
  .action((sites : Array<string>, options : CmdDeployOptions) => {
    let config = readConfig(prog.config);
    let deployment = Deployment.create(config, options.tag);

    const a = new DeployAction(config);
    const done = a.run(deployment, sites, options);
    done.then((mapResult : SummaryMap) => {
      console.log(SummaryMapConsoleFormatter.format(mapResult));
      const errorCode = haveSummaryMapsErrors(mapResult) ? 1 : 0;
    });
    done.catch(res => {
        console.log(res);
      // console.log(SummaryMapConsoleFormatter.format(mapResult));
      console.error("Catch Error: ", res);
    });
  })
  ;

prog.command('setup [sites...]')
  .description('setup the requirements on the target server.')
  .option("-t, --tasks <tasks>", 'tasks')
  .action((sites : Array<string>, options) => {
    const config = readConfig(prog.config);
    const a = new SetupAction(config);
    const deployment = Deployment.create(config, config.app.root || cwd);
    const done = a.run(deployment, sites, options.tasks ? options.tasks.split(/,/) : null);
    done.then((mapResult : SummaryMap) => {
      console.log(SummaryMapConsoleFormatter.format(mapResult));
      const errorCode = haveSummaryMapsErrors(mapResult) ? 1 : 0;
    });
    done.catch( (res) => {
      console.error(res);
    });
  })
  ;

prog.command('logs [sites...]')
  .description('tail the logs')
  .option("-f, --tail", 'tail')
  .option("--init <init>", 'init type, could be "systemd".')
  .action((sites, options) => {
    let config = readConfig(prog.config);
    let a = new LogsAction(config);
    let deployment = Deployment.create(config, config.app.root || cwd);
    a.run(deployment, sites, options);
  });

prog.command('start [sites...]')
  .description('start the app.')
  .action( (sites, options) => {
    let config = readConfig(prog.config);
    let actions = new StartAction(config);

    let deployment = Deployment.create(config, config.app.root || cwd);
    let done = actions.run(deployment, sites);
    done.then((mapResult) => {
      console.log(SummaryMapConsoleFormatter.format(mapResult));
      const errorCode = haveSummaryMapsErrors(mapResult) ? 1 : 0;
    }).catch((err) => {
      console.error(err);
    });
    
  });
  ;

prog.command('stop [sites...]')
  .description('stop the app.')
  .action((sites, options) => {
    let config = readConfig(prog.config);
    let actions = new StopAction(config);

    let deployment = Deployment.create(config, config.app.root || cwd);
    let done = actions.run(deployment, sites);
    done.then((mapResult) => {
      console.log(SummaryMapConsoleFormatter.format(mapResult));
      const errorCode = haveSummaryMapsErrors(mapResult) ? 1 : 0;
    }).catch((err) => {
      console.error(err);
    });
  });
  ;

prog.command('reconfig [sites...]')
  .description('reconfig the app.')
  .action((sites, options) => {
    let config = readConfig(prog.config);
    let actions = new ReconfigAction(config);
    let deployment = Deployment.create(config, config.app.root || cwd);
    let afterSetup = actions.run(deployment, sites);
    afterSetup.then((mapResult) => {
      console.log(SummaryMapConsoleFormatter.format(mapResult));
      // console.log(JSON.stringify(mapResult, null, "  "));
      const errorCode = haveSummaryMapsErrors(mapResult) ? 1 : 0;
    }).catch((err) => {
      console.error(err);
    });
  });
  ;

prog.command('restart [sites...]')
  .description('restart the app.')
  .action((sites, options) => {
    let config = readConfig(prog.config);
    let actions = new RestartAction(config);
    let deployment = Deployment.create(config, config.app.root || cwd);
    let afterSetup = actions.run(deployment, sites);
    afterSetup.then((mapResult) => {
      console.log(SummaryMapConsoleFormatter.format(mapResult));
      const errorCode = haveSummaryMapsErrors(mapResult) ? 1 : 0;
    }).catch((err) => {
      console.error(err);
    });
  });
  ;


prog.command('mongo:dump [sites...]')
  .description('dump mongodb on servers')
  .action((sites, options) => {
    let config = readConfig(prog.config);
    let actions = new MongoDumpAction(config);
    let deployment = Deployment.create(config, config.app.root || cwd);
    let afterSetup = actions.run(deployment, sites);
    afterSetup.then((mapResult) => {
      console.log(SummaryMapConsoleFormatter.format(mapResult));
      const errorCode = haveSummaryMapsErrors(mapResult) ? 1 : 0;
    }).catch((err) => {
      console.error(err);
    });
  });
  ;

prog.command('mongo:get [site] [file]')
  .description('get mongodb archive from servers')
  .action((site, file, options) => {
    let config = readConfig(prog.config);
    let actions = new MongoGetAction(config);
    let deployment = Deployment.create(config, config.app.root || cwd);
    let afterSetup = actions.run(deployment, site, file);
    afterSetup.then((mapResult) => {
      console.log(SummaryMapConsoleFormatter.format(mapResult));
      const errorCode = haveSummaryMapsErrors(mapResult) ? 1 : 0;
    }).catch((err) => {
      console.error(err);
    });
  });
  ;

prog.command('mongo:restore [site] [file]')
  .description('restore mongodb from a local archive')
  .action((site, file, options) => {
    let config = readConfig(prog.config);
    let a = new MongoRestoreAction(config);
    let deployment = Deployment.create(config, config.app.root || cwd);
    let afterSetup = a.run(deployment, site, file);
    afterSetup.then((mapResult) => {
      console.log(SummaryMapConsoleFormatter.format(mapResult));
      const errorCode = haveSummaryMapsErrors(mapResult) ? 1 : 0;
    }).catch((err) => {
      console.error(err);
    });
  });
  ;




prog.command('init')
  .description('init the typeloy.json config.')
  .action( (env, options) => {
    let config = readConfig(prog.config);
    let actions = new BaseAction(config);
    actions.init();
  });


/*
// handling undefined command
prog.command('*')
  .action(function(env){
    console.log('deploying "%s"', env);
  });
*/

prog.on('--help', function(){
  /*
  console.log('  Examples:');
  console.log('');
  console.log('    $ custom-help --help');
  console.log('    $ custom-help -h');
  console.log('');
  */
});
prog.parse(process.argv);

// vim:sw=2:ts=2:sts=2:et:filetype=typescript:
