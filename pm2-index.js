require('./global').init(__dirname);

var http = require('http').createServer(function (req, res) {
    var urlinfo     = require('url').parse(req.url, true),
        queryinfo   = urlinfo.query || {},
        app         = null;
    require('util').log('[[[app action:'+(queryinfo.action?queryinfo.action:'default')+':'+req.url+']]]');
    switch(queryinfo.action) {
        case 'clear':
            app = INCLUDE('/app/pm2/combine-clear');
            break;

        default:
            app = INCLUDE('/app/pm2/combine');
    }
    // console.log(CONFIG);
    // console.log("request:"+req.url+"\n");
    app.run(queryinfo, req, res);
}).listen(process.env.NODE_PORT || 8190);
