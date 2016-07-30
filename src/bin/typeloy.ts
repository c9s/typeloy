#!/usr/bin/env node
import path = require('path');
import {readConfig} from '../config';
import Actions from '../actions';
import {CmdDeployOptions} from '../options';
import Deployment from '../deployment';
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
  .action((deploymentTag:string, sites:Array<string>, options:CmdDeployOptions) => {
    let config = readConfig(prog.config);
    let actions = new Actions(config, cwd);
    if (!deploymentTag) {
      deploymentTag = "v" + (new Date).getTime();
    }
    Deployment.create(cwd, deploymentTag).then((deployment:Deployment) => {
      actions.deploy(deployment, sites, options);
    });
  })
  ;

prog.command('setup')
  .description('setup the requirements on the target server.')
  .action( (env, options) => {
    let config = readConfig(prog.config);
    let actions = new Actions(config, cwd);
    actions.setup();
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
    actions.start();
  });
  ;

prog.command('stop')
  .description('stop the app.')
  .action( (env, options) => {
    let config = readConfig(prog.config);
    let actions = new Actions(config, cwd);
    actions.stop();
  });
  ;

prog.command('restart')
  .description('restart the app.')
  .action( (env, options) => {
    let config = readConfig(prog.config);
    let actions = new Actions(config, cwd);
    actions.restart();
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
