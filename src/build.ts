var spawn = require('child_process').spawn;
var archiver = require('archiver');
var fs = require('fs');
var pathResolve = require('path').resolve;

import _ = require('underscore');
import {Config} from './Config';

export type BuildCallback = (err : Error) => void;

export type BuildMeteorAppCallback = (code : number) => void;

/**
 * @param {Function(err)} callback
 */
export function buildApp(config : Config, appPath : string, buildLocation : string, bundlePath : string, start)
{
  return new Promise<any>((resolve, reject) => {
    start = _.once(start);
    bundlePath = bundlePath || pathResolve(buildLocation, 'bundle.tar.gz');
    if (fs.existsSync(bundlePath)) {
      console.log("Found existing bundle file: " + bundlePath);
      return resolve();
    }
    let meteorBinary = config.meteor.binary || 'meteor';
    start();
    return buildMeteorApp(appPath, meteorBinary, buildLocation, config)
      .then((code:number) => {
        // 0 = success
        if (code == 0) {
          console.log("Build succeed. Archiving the files...");
          return archiveIt(buildLocation, bundlePath);
        }
        console.error("\n=> Build Error. Check the logs printed above.");
        return reject(new Error("Build error. Please check the console log output."));
      });
  });
}

export function buildMeteorApp(appPath:string, executable:string, buildLocation:string, config : Config) {
  let args : Array<string> = [
    "build",
    "--directory", buildLocation, 
    "--server", (config.meteor.server || "http://localhost:3000"),
  ];
  
  let isWin = /^win/.test(process.platform);
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

  return new Promise<number>(resolve => {
    let meteor = spawn(executable, args, options);
    let stdout = "";
    let stderr = "";
    meteor.stdout.pipe(process.stdout, {end: false});
    meteor.stderr.pipe(process.stderr, {end: false});
    meteor.on('close', (code : number) => {
      resolve(code);
    });
  });
};

function archiveIt(buildLocation : string, bundlePath : string) : Promise<any> {
  let sourceDir = pathResolve(buildLocation, 'bundle');
  bundlePath = bundlePath || pathResolve(buildLocation, 'bundle.tar.gz');
  console.log("Creating tar bundle: " + bundlePath);
  console.log("Bundle source: " + sourceDir);

  return new Promise<any>((resolve, reject) => {
    let output  = fs.createWriteStream(bundlePath);
    let archive = archiver('tar', {
      gzip: true,
      gzipOptions: {
        level: 6
      }
    });
    archive.pipe(output);
    output.once('close', () => {
      resolve();
    });
    archive.once('error', (err) => {
      console.log("=> Archiving failed:", err.message);
      reject(err);
    });
    archive.directory(sourceDir, 'bundle').finalize();
  });

}
