color = require 'cli-color'
irc   = require './lib/irc'
rx    = require './lib/rx'

module.exports = (nick) ->
    initState = { room: null }

    (tcpIn, userIn) ->
        nickAndUser = rx.fromArray [
            { command: 'NICK', params: [nick] },
            { command: 'USER', params: [nick, '()', '*', nick] }
        ]

        ircIn       = tcpIn.map(irc.parse)

        joins       = userIn.filter (line) -> line.match /^\/join +(\S+)/
                            .map    (line) -> line.split(/[ ]+/)[1]

        joinCmd     = joins.map (channel) ->
                          { command: 'JOIN', params: [channel] }

        state       = joins.scan initState, (s, channel) -> { room: channel }
        messages    = userIn.filter (line) -> not line.match /^\/|^ *$/

        msgCmd      = messages.zip state.sampledBy(messages), (msg, state) ->
                          { command: 'PRIVMSG', params: [state.room, msg] }

        msgIn       = ircIn.filter (msg) -> msg.command == 'PRIVMSG'
        msgInRoom   = state.sampledBy msgIn, (state, msg) -> irc.equal msg.params[0], state.room
        roomMsg     = msgIn.filter msgInRoom.toProperty()

        displayMsg  = roomMsg.merge(msgCmd).map (msg) ->
                          color.yellow(msg.params[0]) + ' ' +
                          color.green(msg.nick || nick) + ': ' +
                          msg.params[1]

        notices     = ircIn.filter (msg) -> msg.command == 'NOTICE'
                           .map (msg) ->
                              color.magenta "<#{msg.server}>: #{msg.params.join ' '}"

        pongs       = ircIn.filter (msg) -> msg.command == 'PING'
                           .map    (msg) -> { command: 'PONG', params: msg.params }

        tcpOut      = nickAndUser.merge(joinCmd).merge(msgCmd).merge(pongs)
                      .map(irc.unparse)

        userOut     = displayMsg.merge(notices)
    
        logs        = tcpIn.map (line) -> '<-- ' + line
                      .merge tcpOut.map (line) -> '--> ' + line

        [tcpOut, userOut, logs]
