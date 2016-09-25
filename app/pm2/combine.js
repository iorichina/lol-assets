var fs          = require('fs'),
    CombineReids= INCLUDE('/model/combine/CombineRedis');

module.exports  = {
    run : mfunc_run
};

/**
 * 检查文件是否有效
 * 检查文件最后修改的时间戳，并以所有文件的路径的md5值作为key存入redis
 */
var mfunc_validateFiles   = function (pathnames, callback) {
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

var mfunc_isModified      = function (request, etag, lastModified) {
    var noneMatch       = request.headers['if-none-match'],
        modifiedSince   = request.headers['if-modified-since'];

    // check If-None-Match include etag or not
    if (noneMatch) noneMatch = noneMatch.split(/ *, */);
    if (!noneMatch || !etag || -1===noneMatch.indexOf(etag)) {
        return true;
    }

    // check If-Modified-Since
    if (!modifiedSince || !lastModified ) {
        return true;
    }
    modifiedSince   = new Date(modifiedSince);
    // Ignore invalid dates
    if (isNaN(modifiedSince.getTime()) || isNaN((new Date(lastModified)).getTime()) || lastModified > modifiedSince) {
        return true;
    }

    return false;
}

/**
 * parse url with flag "/??", without "/??", we will replace the last "/" with "/??", if empty string after "/??", "index.js" would be the default string.
 * @param  {string} root js/css resource root path
 * @param  {string} url  user url
 * @return {object}      {mime: resource mime, pathnames: resource files' path base on /}
 */
function mfunc_parseURL(root, url) {
    var MIME    = CONFIG.MIME,
        base, pathnames, parts;

    if (-1 === url.indexOf(CONFIG.URI_SEPARATOR)) {
        url     = url.replace(new RegExp('/([^/]*$)'), CONFIG.URI_SEPARATOR+'$1');
    }
    parts       = url.split(CONFIG.URI_SEPARATOR);
    base        = parts[0]+'/';
    parts[1]    = (parts[1] || 'index.js').split('&')[0];
    pathnames   = parts[1].split(',').filter(function(value) {
        return ''!==value.trim();
    }).map(function(value, index, data) {
        return PATH.join(root, base, value);
    });
    // pathnames.sort();

    return {
        mime        : MIME[PATH.extname(pathnames[0])] || 'text/plain',
        pathnames   : pathnames
    };
}

// 挨个输出文件内容
function mfunc_outputFiles(urlInfo, response) {
    var pathnames = urlInfo.pathnames;
    (function next(i, len) {
        if (i < len) {
            var reader = fs.createReadStream(pathnames[i]);
            response.write('/*'+PATH.basename(pathnames[i])+'*/');
            reader.pipe(response, {end: false});
            reader.on('end', function() {
                response.write('\r\n');
                if (-1!==urlInfo.mime.indexOf('javascript')) {
                    response.write(';');
                };
                setTimeout(function(x, len){
                    next(x, len);
                }, 2000, i+1, len);
                // next(i+1, len);
            });
        }else{
            response.end();
        }
    })(0, pathnames.length);
}

function mfunc_run(argv, request, response) {
    var urlInfo     = mfunc_parseURL(RESOURCE_PATH, request.url),
        etag        = CombineReids.getUriMd5(request.url);

    // 取redis 状态
    CombineReids.getEtagLastModified(etag, function(err, lastModified_time){
        // not modified
        if (!err && !mfunc_isModified(request, etag, lastModified_time)) {
            response.writeHead(304, {
                // 'rr'     : lastModified_time,
                'RCache' : lastModified_time ? (new Date(lastModified_time)).toUTCString() : 'none',
            });
            response.end();
            // return;
        };

        mfunc_validateFiles(urlInfo.pathnames, function(err, data, lastModified) {
            if (err) {
                response.writeHead(404);
                response.end(err.message);
            }else{
                // not modified
                if (!mfunc_isModified(request, etag, lastModified)) {
                    CombineReids.setEtagLastModified(etag, lastModified, function(err, res) {
                        response.writeHead(304);
                        response.end();
                    });
                }else{
                    lastModified    = lastModified || new Date();
                    // 存入redis
                    CombineReids.setEtagLastModified(etag, lastModified, function(err, res) {
                        var expire      = new Date();
                        expire.setSeconds('+'+8640000);
                        var headers     = {
                            'Cache-Control' : 'public, max-age='+8640000,
                            'Expires'       : expire.toUTCString(),
                            'Content-Type'  : urlInfo.mime,
                            'Etag'          : etag,
                            'Last-Modified' : lastModified.toUTCString()
                        };
                        response.writeHead(200, headers);
                        mfunc_outputFiles(urlInfo, response);
                    });
                }
            }
        });

    });
};