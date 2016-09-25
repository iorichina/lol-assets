var redis               = require('redis'),
    poolModule          = require('generic-pool'),
    mvar_pool           = null;

module.exports  = {
    getRedisClient     : mfunc_getRedisClient
};

function mfunc_getRedisClient(options, callback) {
    mvar_pool = mvar_pool || (function(){

        var host = options.host,
            port = options.port;

        var pool = poolModule.Pool({
            name     : 'redis',
            create   : function(cb) {
                var client  = redis.createClient(port, host, options);
                cb(null, client);
            },
            destroy  : function(client) { 
                client.quit(); 
            },
            max      : 10,
            // optional. if you set this, make sure to drain() (see step 3)
            // min      : 2, 
            // specifies how long a resource can stay idle in pool before being removed
            idleTimeoutMillis : 30000,
             // if true, logs via console.log - can also be a function
            // log : true 
        });

        return pool;
    })();
    
    mvar_pool && mvar_pool.acquire(function(err, client){
        if (err) {
            callback.call(null, err);
            return;
        };
        callback.call(null, err, client, function(){
            mvar_pool.release(client);
        });
    });
}