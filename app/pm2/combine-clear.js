var RestUtils   = INCLUDE('/lib/RestUtils'),
    CombineReids= INCLUDE('/model/combine/CombineRedis');

module.exports  = {
    run : mfunc_run
};

function mfunc_run(argv, request, response) {
    var etag        = CombineReids.getUriMd5(request.url.replace('&action=clear', ''));
    CombineReids.delEtagLastModified(etag, function(err){
        response.writeHead('200', {
            'action' : err ? 'failue' : 'done'
        });
        response.end();
    });
}