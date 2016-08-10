/// <reference path="../typings/globals/mocha/index.d.ts" />
/// <reference path="../typings/globals/chai/index.d.ts" />
import chai = require('chai');
var expect = chai.expect;

import {GitSync} from "../src/GitSync";

describe('GitSync', () => {

  describe('#describeAll', () => {
    it('should return ref name', () => {
      let git = new GitSync('./');
      let tag = git.describeAll();
      expect(tag).to.be.string;
    });
  });

  describe('#describeTags', () => {
    it('should return the closest tag name with abbrev = 0', () => {
      let git = new GitSync('./');
      let tag = git.describeTags(0);
      expect(tag).to.be.string;
    });
  });

  describe('#logOf', () => {
    it('should return a commit list', () => {
      let git = new GitSync('./');
      let commits = git.logOf('master', { maxCount: 3 });
      // console.log(commits);
      expect(commits.length).to.equal(3);
      expect(commits[0].author).to.be.not.null;
      expect(commits[0].date).to.be.not.null;
      expect(commits[0].hash).to.be.a('string');
    });
  });

  describe('#tags', () => {
    it('should return a tag list', () => {
      let git = new GitSync('./');
      let tags = git.tags();
      expect(tags).to.be.an('array');
    });
  });
});
