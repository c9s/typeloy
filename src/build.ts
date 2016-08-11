var spawn = require('child_process').spawn;
var archiver = require('archiver');
var fs = require('fs');
var pathResolve = require('path').resolve;

import _ = require('underscore');
import {Config} from './Config';

import {EventEmitter} from 'events';

export class MeteorBuilder extends EventEmitter {

  protected config : Config;

  constructor(config : Config) {
    super();
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
        this.log(`Found existing bundle file: ${bundlePath}`);
        return resolve(0);
      }

      const appName = this.config.app.name;
      const meteorBinary = this.config.meteor.binary || 'meteor';

      this.emit('build.started', { message: 'Build started', bundlePath, buildLocation });
      this.log(`Building started: ${appName}`);

      if (meteorBinary !== 'meteor') {
        this.log(`Using meteor: ${meteorBinary}`);
      }

      start();
      buildMeteorApp(appPath, meteorBinary, buildLocation, this.config)
        .then((code : number) => {

          this.log(`Builder returns: ${code}`);

          if (code == 0) {
            resolve(code);
          } else {
            reject(code);
          }
        });
    });
    buildFinish.catch((code : number) => {
      console.error("\n=> Build Error. Check the logs printed above.");

      this.emit('fail', `Build error, please check the console log output.`);

      throw new Error("Build error. Please check the console log output.");
    });
    return buildFinish.then((code : number) => {
      // 0 = success
      this.log("Build succeed.");
      this.emit('build.finished', { message: 'Build succeed', bundlePath, buildLocation });

      return this.archiveIt(buildLocation, bundlePath, { 
        level: 6,
        // memLevel : 
        // chunkSize
      });
    });
  }

  protected log(message) {
    this.emit('log', message);
    console.log(message);
  }

  public archiveIt(buildLocation : string, bundlePath : string, gzipOptions : any) : Promise<any> {
    let sourceDir = pathResolve(buildLocation, 'bundle');
    bundlePath = bundlePath || pathResolve(buildLocation, 'bundle.tar.gz');

    this.emit('archive.started', { message: "Archiving the files...", bundlePath, buildLocation });
    this.log('Archiving the files...');
    this.log("Creating tar bundle at: " + bundlePath);
    this.log("Bundle source: " + sourceDir);

    return new Promise<any>((resolve, reject) => {
      let output  = fs.createWriteStream(bundlePath);
      let archive = archiver('tar', {
        gzip: true,
        gzipOptions: gzipOptions
      });
      archive.pipe(output);
      output.once('close', () => {
        this.emit('archive.finished', { message: "Bundle file is archived.", bundlePath, buildLocation });
        this.emit('finished', { message: "Build finished", bundlePath, buildLocation });
        resolve();
      });
      archive.once('error', (err) => {
        console.log("=> Archiving failed:", err.message);
        this.emit('fail', { message: err.message, error: err, bundlePath, buildLocation });
        reject(err);
      });
      archive.directory(sourceDir, 'bundle').finalize();
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

