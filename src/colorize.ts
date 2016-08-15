const util = require('util')
export function colorize (color : string, text : string) : string {
  const codes = util.inspect.colors[color]
  return `\x1b[${codes[0]}m${text}\x1b[${codes[1]}m`
}
