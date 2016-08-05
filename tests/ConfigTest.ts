/// <reference path="../typings/globals/mocha/index.d.ts" />
/// <reference path="../typings/globals/chai/index.d.ts" />
import chai = require('chai');
var expect = chai.expect;

import {ConfigParser} from "../src/Config";

describe('Config', () => {
  describe('#parse', () => {

    it('should parse new sites config', () => {
      let config = ConfigParser.parse('tests/data/typeloy-sites.json');
      console.log(config);
    });

    it('should parse legacy mup.json', () => {
      let config = ConfigParser.parse('tests/data/mup.json');
      expect(config.sites['_default_']).to.be.ok;
      expect(config.deploy.checkDelay).to.equal(120);
      expect(config.setup.node).to.equal('0.10.44');
      expect(config.setup.phantom).to.be.true;
      expect(config.setup.mongo).to.be.true;
    });
  });
});