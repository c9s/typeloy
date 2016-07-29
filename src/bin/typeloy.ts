#!/usr/bin/env node
import path = require('path');
import {readConfig} from '../config';
import ActionsRegistry from '../actions';
require('colors');

var prog = require('commander');

var version = '1.0.0';
var cwd = path.resolve('.');

// read config and validate it
var config = readConfig();
var actionsRegistry = new ActionsRegistry(config, cwd);

prog.version(version);
prog.usage('[options] <subcommand> ...');
prog.option('-v, --verbose', 'verbose mode');

prog.command('deploy [version] [sites...]')
  .description('set the deployment version and start deploying.')
  .option("-d, --dryrun", 'do not really deploy it.')
  .action( (version, sites, options) => {
    actionsRegistry.deploy(options);
  })
  ;

prog.command('setup')
  .description('setup the requirements on the target server.')
  .action( (env, options) => {
    actionsRegistry.setup();
  })
  ;

prog.command('logs')
  .description('init the mup.json config.')
  .option("-f, --tail", 'tail')
  .action((options) => {
    actionsRegistry.logs(options);
  });

prog.command('init')
  .description('init the mup.json config.')
  .action( (env, options) => {
    actionsRegistry.init();
  });

prog.command('start')
  .description('start the app.')
  .action( (env, options) => {
    actionsRegistry.start();
  });
  ;

prog.command('stop')
  .description('stop the app.')
  .action( (env, options) => {
    actionsRegistry.stop();
  });
  ;

prog.command('restart')
  .description('restart the app.')
  .action( (env, options) => {
    actionsRegistry.restart();
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
