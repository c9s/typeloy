/// <reference path="../typings/globals/mocha/index.d.ts" />
/// <reference path="../typings/globals/chai/index.d.ts" />
import chai = require('chai');
var expect = chai.expect;

import {ConfigParser} from "../src/config";
import {SummaryMap} from "../src/SummaryMap";
import {SummaryMapConsoleFormatter} from "../src/SummaryMapConsoleFormatter";


let summaryMap : any = {
  "100.100.100.12": {
    "error": true,
    "history": [
      {
        "task": "Uploading bundle: /tmp/shaka-v1.1.1-35-g7485088/bundle.tar.gz",
        "status": "SUCCESS"
      },
      {
        "task": "Setting up environment variable file for bash",
        "status": "SUCCESS"
      },
      {
        "task": "Setting up environment variable file",
        "status": "SUCCESS"
      },
      {
        "task": "Creating build.sh",
        "status": "SUCCESS"
      },
      {
        "task": "Invoking deployment process",
        "status": "FAILED",
        "error": "\n-----------------------------------STDERR-----------------------------------\n-q upstart\n+ echo 'Restarting the app'\n+ [[ 0 == 1 ]]\n+ sudo systemctl restart shaka.service\n+ echo 'Waiting for 10 seconds while app is booting up'\n+ sleep 10\n+ echo 'Checking is app booted or not?'\n+ curl localhost:80\n  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current\n                                 Dload  Upload   Total   Spent    Left  Speed\n\r  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0curl: (7) Failed to connect to localhost port 80: Connection refused\n+ revert_app\n+ [[ -d old_app ]]\n+ sudo rm -rf app\n+ sudo mv old_app app\n+ sudo stop shaka\nstop: Unable to connect to Upstart: Failed to connect to socket /com/ubuntu/upstart: Connection refused\n+ :\n+ sudo start shaka\nstart: Unable to connect to Upstart: Failed to connect to socket /com/ubuntu/upstart: Connection refused\n+ :\n+ echo 'Latest deployment failed! Reverted back to the previous version.'\nLatest deployment failed! Reverted back to the previous version.\n+ exit 1\n-----------------------------------STDOUT-----------------------------------\nin `/opt/shaka/tmp/bundle/programs/server/node_modules/fibers/bin/linux-x64-v8-3.14/fibers.node`\nansi-regex@0.2.1 node_modules/ansi-regex\n\nchalk@0.5.1 node_modules/chalk\n\nansi-styles@1.1.0 node_modules/ansi-styles\n\nescape-string-regexp@1.0.5 node_modules/escape-string-regexp\n\nsupports-color@0.2.0 node_modules/supports-color\n\nstrip-ansi@0.3.0 node_modules/strip-ansi\n\nhas-ansi@0.1.0 node_modules/has-ansi\n\neachline@2.3.3 node_modules/eachline\n\ntype-of@2.0.1 node_modules/type-of\n\namdefine@1.0.0 node_modules/amdefine\n\nmeteor-promise@0.7.2 node_modules/meteor-promise\n\nasap@2.0.4 node_modules/asap\n\nunderscore@1.5.2 node_modules/underscore\n\nsource-map-support@0.3.2 node_modules/source-map-support\n\nsemver@4.1.0 node_modules/semver\n\npromise@7.1.1 node_modules/promise\n\nsource-map@0.1.32 node_modules/source-map\n\nfibers@1.0.13 node_modules/fibers\nWaiting for MongoDB to initialize. (5 minutes)\nconnected\nRestarting the app\nWaiting for 10 seconds while app is booting up\nChecking is app booted or not?\n----------------------------------------------------------------------------"
      }
    ]
  },
  "100.100.100.119": {
    "error": null,
    "history": [
      {
        "task": "Uploading bundle: /tmp/shaka-v1.1.1-35-g7485088/bundle.tar.gz",
        "status": "SUCCESS"
      },
      {
        "task": "Setting up environment variable file for bash",
        "status": "SUCCESS"
      },
      {
        "task": "Setting up environment variable file",
        "status": "SUCCESS"
      },
      {
        "task": "Creating build.sh",
        "status": "SUCCESS"
      },
      {
        "task": "Invoking deployment process",
        "status": "SUCCESS"
      }
    ]
  }
};

describe('SummaryMapFormatter', () => {
  describe('#format', () => {
    it('should format summary map into console text', () => {
      SummaryMapConsoleFormatter.format(summaryMap);
    });
  });
});

