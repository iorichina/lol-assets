var redis       = INCLUDE('/lib/redis/RedisClients'),
    config      = CONFIG.redis.combine.connect,
    RestUtils   = INCLUDE('/lib/RestUtils'),
    etagListKey = CONFIG.redis.combine.etagListKey,
    timeout     = CONFIG.redis.combine.timeout;
module.exports  = {
    getEtagLastModified : function(etag, callback) {
        mfunc_run(function(err, client, release_client) {
            if (err) {
                callback.call(null, 'redis client error');
                return;
            };
            client.get(mfunc_genEtagListKey(etag), function(){
                callback.apply(null, arguments);
                release_client();
            });
        });
    },
    setEtagLastModified : function(etag, lastModified, callback) {
        mfunc_run(function(err, client, release_client) {
            if (err) {
                callback.call(null, 'redis client error');
                return;
            };
            client.setex(mfunc_genEtagListKey(etag), timeout, lastModified, function(){
                callback.apply(null, arguments);
                release_client();
            });
        });
    },
    delEtagLastModified : function(etag, callback) {
        mfunc_run(function(err, client, release_client) {
            if (err) {
                callback.call(null, 'redis client error');
                return;
            };
            client.del(mfunc_genEtagListKey(etag), function(){
                callback.apply(null, arguments);
                release_client();
            });
        });
    },
    getUriMd5 : function (data, mtime) {
        if (data instanceof Array) {
            data = data.join(',');
        };
        return RestUtils.md5( data + (mtime ? '|' + mtime.toUTCString() : ''));
    },
    genEtagListKey        : mfunc_genEtagListKey

};
function mfunc_run(callback) {
    redis.getRedisClient(config, callback);
}
function mfunc_genEtagListKey(etag) {
    return 'combine:'+RestUtils.md5(etagListKey+'/'+etag);
}