
import {colorize} from "./colorize";
import {SummaryMap} from "./SummaryMap";

var _ = require('underscore');

export class SummaryMapConsoleFormatter {

  public static format(summaryMap : SummaryMap) {

    const checkMark = "\u2714";
    const crossMark = "\u2718";
    let tab : string = "  ";
    let output = "";
    for (let host in summaryMap) {
      let summaryResult = summaryMap[host];
      let errored = summaryResult.error ? true : false;

      if (errored) {
        output += colorize("red", crossMark + ` Host ${host}`) + "\n";
      } else {
        output += colorize("green", checkMark + ` Host ${host}`) + "\n";
      }
      for (let taskResult of summaryResult.history) {
        switch (taskResult['status']) {
          case "SUCCESS":
            output += colorize('green', tab + `${checkMark} ${taskResult.task}`) + "\n";
            break;
          case "FAILED":
            output += colorize('red', tab + `${crossMark} ${taskResult.task}`) + "\n";
            if (typeof taskResult['error'] === "string") {
              let lines = taskResult['error'].split( /\r?\n/ );
              lines = _.map(lines, (line) => { return tab + tab + line; });
              output += colorize("red", lines.join("\n") + "\n");
            }
            break;
        }
      }
    }
    return output;
  }
}
