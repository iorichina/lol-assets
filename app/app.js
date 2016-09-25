/**
 * parse url with flag "/??", without "/??", we will replace the last "/" with "/??", if empty string after "/??", "index.js" would be the default string.
 * @param  {string} root js/css resource root path
 * @param  {string} url  user url
 * @return {object}      {mime: resource mime, pathnames: resource files' path base on /}
 */
function parseURL(root, url) {
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

// 挨个读取文件内容到内存，并合并返回给回调函数
function combineFiles(urlInfo, callback) {
    var pathnames   = urlInfo.pathnames;
    var fs          = require('fs'),
        output      = [];
    (function next(i, len) {
        if (i < len) {
            fs.readFile(pathnames[i], function(err, data) {
                if (err) {
                    callback(err);
                }else{
                    output.push(data);
                    next(i+1, len);
                }
            });
        }else{
            callback(null, Buffer.contact(output, -1!==urlInfo.mime.indexOf('javascript')?';':''));
        }
    })(0, pathnames.length);
}

function run(argv, request, response) {
    var urlInfo     = parseURL(RESOURCE_PATH, request.url);

    combineFiles(urlInfo, function(err, data) {
        if (err) {
            response.writeHead(404);
            response.end(err.message);
        }else{
            response.writeHead(200, {
                'Content-Type'  : urlInfo.mime
            });
            response.end(data);
        }
    });
}

module.exports  = {
    parseURL    : parseURL,
    run         : run
};