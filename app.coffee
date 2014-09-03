color = require 'cli-color'
irc   = require './lib/irc'
rx    = require './lib/rx'

module.exports = (nick) ->

    (tcpIn, userIn) ->
        nickAndUser = rx.fromArray [
            { command: 'NICK', params: [nick] },
            { command: 'USER', params: [nick, '()', '*', nick] }
        ]

        ircIn       = tcpIn.map(irc.parse)

        notices     = ircIn.filter (msg) -> msg.command == 'NOTICE'
                           .map (msg) ->
                              color.magenta "<#{msg.server}>: #{msg.params.join ' '}"

        tcpOut      = nickAndUser.map(irc.unparse)

        userOut     = notices
    
        logs        = tcpIn.map (line) -> '<-- ' + line
                      .merge tcpOut.map (line) -> '--> ' + line

        [tcpOut, userOut, logs]
