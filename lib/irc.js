var r = function(regexp) { return regexp.source };

// http://tools.ietf.org/html/rfc1459#section-2.3.1
// http://tools.ietf.org/html/rfc2812#section-2.3.1

var SPECIAL    = /[\[\]\\`\-_\^\{\|\}]/
    NUMBER     = /[0-9]/,
    LETTER     = /[a-zA-Z]/,
    CHSTRING   = /[^ \7\0\r\n,]+/,

    USER       = /[^ @\0\r\n]+/,
    MASK       = new RegExp('[#\\$]' + r(CHSTRING)),
    NICK       = new RegExp('(?:' + r(LETTER) + '|' + r(SPECIAL) + ')(?:' + r(LETTER) + '|' + r(NUMBER) + '|' + r(SPECIAL) + ')*'),
    HNAME      = /[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?/,
    HOSTNAME   = new RegExp(r(HNAME) + '(?:\\.' + r(HNAME) + ')*\.?(?:\/[^ \0\r\n]*)?'),
    SERVERNAME = HOSTNAME,
    IPV4ADDR   = /[0-9]{1,3}(?:\.[0-9]{1,3}){3}/,
    IPV6ADDR   = new RegExp('(?:(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4})?::?(?:[0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4})*)?|::(?:ffff|FFFF):' + r(IPV4ADDR)),
    HOST       = new RegExp('(?:' + r(HOSTNAME) + '|' + r(IPV4ADDR) + '|' + r(IPV6ADDR) + ')'),
    CHANNEL    = new RegExp('[#&]' + r(CHSTRING)),
    TO         = new RegExp('(' + r(CHANNEL) + '|' + r(USER) + '@' + r(SERVERNAME) + '|' + r(NICK) + '|' + r(MASK) + ')'),
    TARGET     = new RegExp(r(TO) + '(?:,' + r(TO) + ')*'),

    PARAM      = /[^ \0\r\n:][^ \0\r\n]*/g,
    PARAMS     = new RegExp('((?: +' + r(PARAM) + ')*)(?: +:([^\\0\\r\\n]*))?'),
    COMMAND    = /[a-zA-Z]+|[0-9]{3}/,
    PREFIX     = new RegExp('(' + r(SERVERNAME) + ')|(' + r(NICK) + ')(?:!(' + r(USER) + '))?(?:@(' + r(HOST) + '))?'),
    MESSAGE    = new RegExp('^(:(' + r(PREFIX) + ') +)?(' + r(COMMAND) + ')(' + r(PARAMS) + ')$');

var NUMERICS = {
  '001': 'RPL_WELCOME',
  '002': 'RPL_YOURHOST',
  '003': 'RPL_CREATED',
  '004': 'RPL_MYINFO',
  '005': 'RPL_BOUNCE',
  '250': 'RPL_STATSDLINE',
  '251': 'RPL_LUSERCLIENT',
  '252': 'RPL_LUSEROP',
  '253': 'RPL_LUSERUNKNOWN',
  '254': 'RPL_LUSERCHANNELS',
  '255': 'RPL_LUSERME',
  '375': 'RPL_MOTDSTART',
  '372': 'RPL_MOTD',
  '376': 'RPL_ENDOFMOTD',
  '332': 'RPL_TOPIC',
  '353': 'RPL_NAMREPLY',
  '366': 'RPL_ENDOFNAMES'
};

var parse = function(line) {
  try {
    var m        = line.match(MESSAGE),
        prefix   = m[2] || '',
        command  = m[7],
        params   = m[9],
        trailing = m[10];

    command = NUMERICS[command] || command;

    params = (params.match(PARAM) || []).slice();
    if (trailing) params = params.concat(trailing);

    var message = { raw: line, prefix: prefix, cmd: m[7], command: command, params: params };

    if (m = prefix.match(new RegExp('^(?:' + r(PREFIX) + ')$'))) {
      message.server = m[1];
      message.nick   = m[2];
      message.user   = m[3];
      message.host   = m[4];
    }
    return message;
  } catch (e) {
    console.log(line);
    throw e;
  }
};

var unparse = function(message) {
  var prefix  = message.prefix,
      command = message.command,
      params  = message.params.slice(),
      line    = '',
      last    = params.pop();

  if (prefix) line += ':' + prefix + ' ';
  line += command;

  params.forEach(function(p) { line += ' ' + p });
  if (last) {
    if (last.match(/ /)) line += ' :' + last;
    else                 line += ' ' + last;
  }
  return line;
};

module.exports = {
  parse:   parse,
  unparse: unparse
};
