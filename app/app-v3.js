var app_parent  = INCLUDE('/app/app-v2'),
    fs          = require('fs'),
    redis       = require('redis'),
    RestUtils   = INCLUDE('/lib/RestUtils');

/**
 * 检查文件是否有效
 * 检查文件最后修改的时间戳，并以所有文件的路径的md5值作为key存入redis
 */
var validateFiles   = function (pathnames, callback) {
    var lastModified= null,
        data        = [];
    (function next(i, len) {
        if (i < len) {
            fs.stat(pathnames[i], function (err, stats) {
                if (err) {
                    callback(err);
                }else if (!stats.isFile()) {
                    callback(new Error());
                }else{
                    if (!lastModified) {
                        lastModified = stats.mtime;
                    }else if (lastModified && stats.mtime > lastModified) {
                        lastModified = stats.mtime;
                    }
                    data.push(pathnames[i]);
                    next(i+1, len);
                }
            });
        }else{
            callback(null, data, lastModified);
        }
    })(0, pathnames.length);
}

var getUriMd5       = function (data, mtime) {
    if (data instanceof Array) {
        data = data.join(',');
    };
    return RestUtils.md5( data + (mtime ? '|' + mtime.toUTCString() : ''));
}

var isModified      = function (request, etag, lastModified) {
    var noneMatch       = request.headers['if-none-match'],
        modifiedSince   = request.headers['if-modified-since'];

    // check If-None-Match include etag or not
    if (noneMatch) noneMatch = noneMatch.split(/ *, */);
    if (!noneMatch || !etag || -1===noneMatch.indexOf(etag)) {
        return true;
    }

    // check If-Modified-Since
    if (!modifiedSince || !lastModified) {
        return true;
    }
    modifiedSince   = new Date(modifiedSince);
    // Ignore invalid dates
    if (isNaN(modifiedSince.getTime()) || lastModified > modifiedSince) {
        return true;
    }

    return false;
}

module.exports.run          = function (argv, request, response) {
    process.env.NODE_ENV    = "82test";
    
    var urlInfo     = app_parent.parseURL(RESOURCE_PATH, request.url),
        etag        = getUriMd5(request.url);

    validateFiles(urlInfo.pathnames, function(err, data, lastModified) {
        if (err) {
            response.writeHead(404);
            response.end(err.message);
        }else{
            lastModified    = lastModified || new Date();
            // var etag        = getUriMd5(data, lastModified);
            // not modified
            if (!isModified(request, etag, lastModified)) {
                response.writeHead(304);
                response.end();
            };

            // TODO:存入redis

            lastModified.setSeconds('+'+60);
            var headers     = {
                'Cache-Control' : 'public, max-age='+60,
                'Expires'       : lastModified.toUTCString(),
                'Content-Type'  : urlInfo.mime,
                'Etag'          : etag,
                'Last-Modified' : lastModified.toUTCString()
            };
            response.writeHead(200, headers);
            app_parent.outputFiles(urlInfo, response);
        }
    });
};