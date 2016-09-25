require('./global').init(__dirname);

var app     = require('pm').createMaster({
    'pidfile' : PATH.join('/var/run/', (process.env.NODE_ENV ? process.env.NODE_ENV : ''), 'app.pid')
});
var app_file= PATH.join(ROOT_PATH, '/index.js');
app.register('app', app_file, {
    listen  : CONFIG.servers.port,
    children: CONFIG.servers.num
});

app.on('giveup', function (name, num, pause) {
    console.log('giveup', name, num, pause);
});

app.dispatch();