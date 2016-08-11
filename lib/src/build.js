"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var spawn = require('child_process').spawn;
var archiver = require('archiver');
var fs = require('fs');
var pathResolve = require('path').resolve;
var _ = require('underscore');
var events_1 = require('events');
var MeteorBuilder = (function (_super) {
    __extends(MeteorBuilder, _super);
    function MeteorBuilder(config) {
        _super.call(this);
        this.config = config;
    }
    MeteorBuilder.prototype.buildApp = function (appPath, buildLocation, bundlePath, start) {
        var _this = this;
        var buildFinish = new Promise(function (resolve, reject) {
            start = _.once(start);
            bundlePath = bundlePath || pathResolve(buildLocation, 'bundle.tar.gz');
            if (fs.existsSync(bundlePath)) {
                _this.log("Found existing bundle file: " + bundlePath);
                return resolve(0);
            }
            var appName = _this.config.app.name;
            var meteorBinary = _this.config.meteor.binary || 'meteor';
            _this.emit('build.started', { message: 'Build started', bundlePath: bundlePath, buildLocation: buildLocation });
            _this.log("Building started: " + appName);
            if (meteorBinary !== 'meteor') {
                _this.log("Using meteor: " + meteorBinary);
            }
            start();
            _this.buildMeteorApp(appPath, meteorBinary, buildLocation)
                .then(function (code) {
                _this.log("Builder returns: " + code);
                if (code == 0) {
                    resolve(code);
                }
                else {
                    reject(code);
                }
            });
        });
        buildFinish.catch(function (code) {
            console.error("\n=> Build Error. Check the logs printed above.");
            _this.emit('fail', "Build error, please check the console log output.");
            throw new Error("Build error. Please check the console log output.");
        });
        return buildFinish.then(function (code) {
            // 0 = success
            _this.log("Build succeed.");
            _this.emit('build.finished', { message: 'Build succeed', bundlePath: bundlePath, buildLocation: buildLocation });
            return _this.archiveIt(buildLocation, bundlePath, {
                level: 6,
            });
        });
    };
    MeteorBuilder.prototype.log = function (message) {
        this.emit('log', message);
        console.log(message);
    };
    MeteorBuilder.prototype.archiveIt = function (buildLocation, bundlePath, gzipOptions) {
        var _this = this;
        var sourceDir = pathResolve(buildLocation, 'bundle');
        bundlePath = bundlePath || pathResolve(buildLocation, 'bundle.tar.gz');
        this.emit('archive.started', { message: "Archiving the files...", bundlePath: bundlePath, buildLocation: buildLocation });
        this.log('Archiving the files...');
        this.log("Creating tar bundle at: " + bundlePath);
        this.log("Bundle source: " + sourceDir);
        return new Promise(function (resolve, reject) {
            var output = fs.createWriteStream(bundlePath);
            var archive = archiver('tar', {
                gzip: true,
                gzipOptions: gzipOptions
            });
            archive.pipe(output);
            output.once('close', function () {
                _this.emit('archive.finished', { message: "Bundle file is archived.", bundlePath: bundlePath, buildLocation: buildLocation });
                _this.emit('finished', { message: "Build finished", bundlePath: bundlePath, buildLocation: buildLocation });
                resolve();
            });
            archive.once('error', function (err) {
                console.log("=> Archiving failed:", err.message);
                _this.emit('fail', { message: err.message, error: err, bundlePath: bundlePath, buildLocation: buildLocation });
                reject(err);
            });
            archive.directory(sourceDir, 'bundle').finalize();
        });
    };
    MeteorBuilder.prototype.buildMeteorApp = function (appPath, executable, buildLocation) {
        var args = [
            "build",
            "--directory", buildLocation,
            "--server", (this.config.meteor.server || "http://localhost:3000"),
        ];
        var isWin = /^win/.test(process.platform);
        if (isWin) {
            // Sometimes cmd.exe not available in the path
            // See: http://goo.gl/ADmzoD
            executable = process.env.comspec || "cmd.exe";
            args = ["/c", "meteor"].concat(args);
        }
        var options = {
            "cwd": pathResolve(appPath),
        };
        options['env'] = process.env;
        if (this.config.meteor.env) {
            options['env'] = _.extend(options['env'], this.config.meteor.env);
        }
        options['env']['BUILD_LOCATION'] = buildLocation;
        this.log("Building: " + executable + " " + args.join(' ') + " " + options);
        return new Promise(function (resolve, reject) {
            var meteor = spawn(executable, args, options);
            var stdout = "";
            var stderr = "";
            meteor.stdout.pipe(process.stdout, { end: false });
            meteor.stderr.pipe(process.stderr, { end: false });
            meteor.on('close', function (code) {
                if (code != 0) {
                    return reject(code);
                }
                resolve(code);
            });
        });
    };
    return MeteorBuilder;
}(events_1.EventEmitter));
exports.MeteorBuilder = MeteorBuilder;
//# sourceMappingURL=build.js.map