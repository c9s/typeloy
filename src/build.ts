var spawn = require('child_process').spawn;
var archiver = require('archiver');
var fs = require('fs');
var pathResolve = require('path').resolve;

import _ = require('underscore');
import {Config} from './Config';

export type BuildCallback = (err:Error) => void;

export type BuildMeteorAppCallback = (code:number) => void;

/**
 * @param {Function(err)} callback
 */
export function buildApp(config : Config, appPath:string, buildLocation:string, bundlePath:string,
                         start,
                         done:BuildCallback) {

  start = _.once(start);
  done = _.once(done);
  bundlePath = bundlePath || pathResolve(buildLocation, 'bundle.tar.gz');
  if (fs.existsSync(bundlePath)) {
    console.log("Found existing bundle file: " + bundlePath);
    return done(null);
  }
  let meteorBinary = config.meteor.binary || 'meteor';
  start();
  buildMeteorApp(appPath, meteorBinary, buildLocation, config, (code:number) => {
    if (code == 0) {
      // Success
      console.log("Build succeed. Archiving the files...");
      archiveIt(buildLocation, bundlePath, done);
    } else {
      console.error("\n=> Build Error. Check the logs printed above.");
      done(new Error("Build error. Please check the console log output."));
    }
  });
}

export function buildMeteorApp(appPath:string, executable:string, buildLocation:string, config : Config, done:BuildMeteorAppCallback) {
  var args : Array<string> = [
    "build",
    "--directory", buildLocation, 
    "--server", (config.meteor.server || "http://localhost:3000"),
  ];
  
  var isWin = /^win/.test(process.platform);
  if (isWin) {
    // Sometimes cmd.exe not available in the path
    // See: http://goo.gl/ADmzoD
    executable = process.env.comspec || "cmd.exe";
    args = ["/c", "meteor"].concat(args);
  }

  let options = {"cwd": pathResolve(appPath) };
  if (config.meteor.env) {
    options['env'] = _.extend(process.env, config.meteor.env);
  }
  console.log("Building Meteor App");
  console.log("  ", executable, args.join(' '), options);

  var meteor = spawn(executable, args, options);
  var stdout = "";
  var stderr = "";
  meteor.stdout.pipe(process.stdout, {end: false});
  meteor.stderr.pipe(process.stderr, {end: false});
  meteor.on('close', done);
};

function archiveIt(buildLocation:string, bundlePath:string, callback) {
  let sourceDir = pathResolve(buildLocation, 'bundle');
  bundlePath = bundlePath || pathResolve(buildLocation, 'bundle.tar.gz');
  callback = _.once(callback);

  console.log("Creating tar bundle: " + bundlePath);
  console.log("Bundle source: " + sourceDir);

  var output  = fs.createWriteStream(bundlePath);
  var archive = archiver('tar', {
    gzip: true,
    gzipOptions: {
      level: 6
    }
  });

  archive.pipe(output);
  output.once('close', callback);

  archive.once('error', (err) => {
    console.log("=> Archiving failed:", err.message);
    callback(err);
  });
  archive.directory(sourceDir, 'bundle').finalize();
}
