var fs    = require('fs'),
    net   = require('net'),
    irc   = require('./lib/irc'),
    rx    = require('./lib/rx');

var host   = 'chat.freenode.net',
    port   = 8000,
    nick   = 'rx' + Math.floor(Math.random() * 256),
    socket = net.connect({host: host, port: port}),
    log    = fs.createWriteStream('./debug.log'),
    app    = require('./app')(nick);

rx.bind([socket, process.stdin], [socket, process.stdout, log], app);
