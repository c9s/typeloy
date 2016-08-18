import {SummaryMap} from "./SummaryMap";
import {Deployment} from "./Deployment";
import {GitRevInfo} from "./collectors";

var _ = require('underscore');


interface SlackAttachmentField {
  title? : string;
  value? : string;
  short? : boolean;
}

interface SlackAttachment {
  title : string;
  author_name? : string;
  text? : string;
  fields? : Array<SlackAttachmentField>;

  mrkdwn_in ?: Array<string>;
  fallback? : string;
}

class SlackMessage {

  public static createDeploymentReportAttachment(deployment : Deployment) : SlackAttachment {
    const revInfo = deployment.revInfo;
    const lastCommit = revInfo.commits ? revInfo.commits[0] : null; // the latest commit after the tag.

    const fields = [];

    if (lastCommit) {
      fields.push({
        "title": "Commit",
        "value": lastCommit.hash,
        "short": true });

      fields.push({
        "title": "Author",
        "value": lastCommit.author.name,
        "short": true });

      fields.push({
        "title": "Committed Date",
        "value": lastCommit.date,
        "short": true });

      fields.push({
          "title": "Latest Tag",
          "value": revInfo.latestTag,
          "short": true,
      });
    }

    const attachment = {
      "title" : "Deployment Report",
      // "text": latestCommit.message,
      "fields": fields,
      "mrkdwn_in": ["text","fields"],
    } as SlackAttachment;

    return attachment;
  }
}

export class SummaryMapSlackFormatter {

  public static format(summaryMap : SummaryMap) {

    const checkMark = "\u2714";
    const crossMark = "\u2718";
    let tab : string = "  ";
    let output = "";
    for (let host in summaryMap) {
      let summaryResult = summaryMap[host];
      let errored = summaryResult.error ? true : false;

      if (errored) {
        // output += colorize("red", crossMark + ` Host ${host}`) + "\n";
      } else {
        // output += colorize("green", checkMark + ` Host ${host}`) + "\n";
      }
      for (let taskResult of summaryResult.history) {
        switch (taskResult['status']) {
          case "SUCCESS":
            // output += colorize('green', tab + `${checkMark} ${taskResult.task}`) + "\n";
            break;
          case "FAILED":
            // output += colorize('red', tab + `${crossMark} ${taskResult.task}`) + "\n";
            if (typeof taskResult['error'] === "string") {
              let lines = taskResult['error'].split( /\r?\n/ );
              lines = _.map(lines, (line) => { return tab + tab + line; });
              // output += colorize("red", lines.join("\n") + "\n");
            }
            break;
        }
      }
    }
    return output;
  }
}
