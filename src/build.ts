var spawn = require('child_process').spawn;
var archiver = require('archiver');
var fs = require('fs');
var pathResolve = require('path').resolve;

import _ = require('underscore');
import {Config} from './Config';

export class MeteorBuilder {

  protected config : Config;

  constructor(config : Config) {
    this.config = config;
  }

  /**
  * @param {Function(err)} callback
  */
  public buildApp(appPath : string, buildLocation : string, bundlePath : string, start) : Promise<any> {
    const buildFinish = new Promise<number>((resolve, reject) => {
      start = _.once(start);
      bundlePath = bundlePath || pathResolve(buildLocation, 'bundle.tar.gz');
      if (fs.existsSync(bundlePath)) {
        console.log("Found existing bundle file: " + bundlePath);
        return resolve(0);
      }

      let meteorBinary = this.config.meteor.binary || 'meteor';
      start();
      buildMeteorApp(appPath, meteorBinary, buildLocation, this.config)
        .then((code : number) => {
          if (code == 0) {
            resolve(code);
          } else {
            reject(code);
          }
        });
    });
    buildFinish.catch((code : number) => {
      console.error("\n=> Build Error. Check the logs printed above.");
      throw new Error("Build error. Please check the console log output.");
    });
    return buildFinish.then((code : number) => {
      // 0 = success
      console.log("Build succeed.");
      return archiveIt(buildLocation, bundlePath, { 
        level: 6,
        // memLevel : 
        // chunkSize
      });
    });
  }
}

export function buildMeteorApp(appPath:string, executable:string, buildLocation:string, config : Config) : Promise<number> {
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

  return new Promise<number>((resolve, reject) => {
    let meteor = spawn(executable, args, options);
    let stdout = "";
    let stderr = "";
    meteor.stdout.pipe(process.stdout, {end: false});
    meteor.stderr.pipe(process.stderr, {end: false});
    meteor.on('close', (code : number) => {
      if (code != 0) {
        return reject(code);
      }
      resolve(code);
    });
  });
};

function archiveIt(buildLocation : string, bundlePath : string, gzipOptions : any) : Promise<any> {
  let sourceDir = pathResolve(buildLocation, 'bundle');
  bundlePath = bundlePath || pathResolve(buildLocation, 'bundle.tar.gz');

  console.log('Archiving the files...');
  console.log("Creating tar bundle at: " + bundlePath);
  console.log("Bundle source: " + sourceDir);

  return new Promise<any>((resolve, reject) => {
    let output  = fs.createWriteStream(bundlePath);
    let archive = archiver('tar', {
      gzip: true,
      gzipOptions: gzipOptions
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
