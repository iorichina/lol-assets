require('./global').init();

var http = require('http').createServer(function (req, res) {
    // var app = INCLUDE('/app/app-v2');
    var app = INCLUDE('/app/app-v3');
    app.run(process.argv.slice(2), req, res);
});

require('pm').createWorker().ready(function (socket, port) {
    http.emit('connection', socket);
});