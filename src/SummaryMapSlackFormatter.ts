import {SummaryMap} from "./SummaryMap";
import {Deployment} from "./Deployment":

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

function createDeploymentReportAttachment(deployment : Deployment) : any {

}

    const attachment = {
      "title": "Commit Message",
      "author_name": process.env['USER'],
      "text": latestCommit.message,
      "fields": [{
          "title": "Commit",
          "value": this.linkCommitHref(revInfo.latestCommit().hash),
          "short": true
        }, {
          "title": "Author",
          "value": latestCommit.author.name,
          "short": true
        }, {
          "title": "Date",
          "value": latestCommit.date,
          "short": true
        }, {
          "title": "Latest Tag",
          "value": revInfo.latestTag,
          "short": true,
        }],
      "mrkdwn_in": ["text","fields"],
      "fallback": "The attachement isn't supported."
    };



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
