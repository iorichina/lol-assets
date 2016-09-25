var app_parent  = INCLUDE('/app/app'),
    fs          = require('fs');

// 挨个输出文件内容
function outputFiles(urlInfo, writer) {
    var pathnames = urlInfo.pathnames;
    (function next(i, len) {
        if (i < len) {
            var reader = fs.createReadStream(pathnames[i]);
            writer.write('/*'+PATH.basename(pathnames[i])+'*/');
            reader.pipe(writer, {end: false});
            reader.on('end', function() {
                if (-1!==urlInfo.mime.indexOf('javascript')) {
                    writer.write(';');
                };
                next(i+1, len);
            });
        }else{
            writer.end();
        }
    })(0, pathnames.length);
}
// 检查文件是否有效
function validateFiles(pathnames, callback) {
    (function next(i, len) {
        if (i < len) {
            fs.stat(pathnames[i], function (err, stats) {
                if (err) {
                    callback(err);
                }else if (!stats.isFile()) {
                    callback(new Error());
                }else{
                    next(i+1, len);
                }
            });
        }else{
            callback(null, pathnames);
        }
    })(0, pathnames.length);
}

function run(argv, request, response) {
    process.env.NODE_ENV = "82test";
    
    var urlInfo     = app_parent.parseURL(RESOURCE_PATH, request.url);

    validateFiles(urlInfo.pathnames, function(err, data) {
        if (err) {
            response.writeHead(404);
            response.end(err.message);
        }else{
            response.writeHead(200, {
                'Content-Type'  : urlInfo.mime
            });
            outputFiles(urlInfo, response);
        }
    });
}

module.exports  = {
    run     : run, 
    // validateFiles: validateFiles, 
    outputFiles: outputFiles, 
    parseURL: app_parent.parseURL
};