#!/usr/bin/env node
import path = require('path');
import {readConfig} from '../src/config';
import Actions from '../src/actions';
import {CmdDeployOptions} from '../src/options';
import {SessionManager, SessionsInfo, SessionsMap, SummaryMapResult, SummaryMap, ExecutedResult} from '../src/SessionManager';
import Deployment from '../src/Deployment';
import debug from '../src/Debug';
require('colors');

var prog = require('commander');

var version = '1.0.0';
var cwd = path.resolve('.');

prog.version(version);
prog.usage('[options] <subcommand> ...');
prog.option('-v, --verbose', 'verbose mode');
prog.option('-c, --config <file>', 'config file');

prog.command('deploy [tag] [sites...]')
  .description('set the deployment tag and start deploying.')
  .option("-d, --dryrun", 'do not really deploy it.')
  .option("--bundle-file <file>", 'the bundle file you have already built with meteor build.')
  .option("--build-dir <dir>", 'the meteor build directory.')
  .option("-C, --no-clean", 'whether to clean up the bundle files.')
  .action((deploymentTag : string, sites : Array<string>, options : CmdDeployOptions) => {
    let config = readConfig(prog.config);
    let actions = new Actions(config, cwd);
    if (!deploymentTag) {
      deploymentTag = "v" + (new Date).getTime();
    }
    let deployment = Deployment.create(config, cwd, deploymentTag);
    let afterDeploy = actions.deploy(deployment, sites, options);
    afterDeploy.then((res : ExecutedResult) => {
      console.log("After deploy", res);
    });
  })
  ;

prog.command('setup')
  .description('setup the requirements on the target server.')
  .action( (env, options) => {
    let config = readConfig(prog.config);
    let actions = new Actions(config, cwd);
    actions.setup(null);
  })
  ;

prog.command('logs')
  .description('init the mup.json config.')
  .option("-f, --tail", 'tail')
  .action((options) => {
    let config = readConfig(prog.config);
    let actions = new Actions(config, cwd);
    actions.logs(options);
  });

prog.command('init')
  .description('init the mup.json config.')
  .action( (env, options) => {
    let config = readConfig(prog.config);
    let actions = new Actions(config, cwd);
    actions.init();
  });

prog.command('start')
  .description('start the app.')
  .action( (env, options) => {
    let config = readConfig(prog.config);
    let actions = new Actions(config, cwd);
    actions.start(null);
  });
  ;

prog.command('stop')
  .description('stop the app.')
  .action( (env, options) => {
    let config = readConfig(prog.config);
    let actions = new Actions(config, cwd);
    actions.stop(null);
  });
  ;

prog.command('restart')
  .description('restart the app.')
  .action( (env, options) => {
    let config = readConfig(prog.config);
    let actions = new Actions(config, cwd);
    actions.restart(null);
  });
  ;

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
