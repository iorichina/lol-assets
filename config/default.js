
var connect     = {
    host: '172.19.51.112',
    port: 6380
};
module.exports  = {
    MIME        : {
        '.css'  : 'text/css;charset=utf-8',
        '.js'   : 'text/javascript;charset=utf-8',//application/javascript'
    },
    resource_path   : './../assets-static',
    URI_SEPARATOR   : '/assets?',
    redis       : {
        combine : {
            connect     : mfunc_combineConfig(connect, {db:2}),
            etagListKey : 'assets/combine/etags/hlist',
            timeout     : 43200
        }
    },
    // for pm
    servers     : {
        num     : 2,
        port    : [8290]
    }
};

function mfunc_combineConfig() {
    var args = [].slice.call(arguments);
    if (args.length <= 1) {
        return args.length == 1 ? args[0] : {};
    }
    var res  = {},
        index= 0;
    for (var i = 0; i < args.length; i++) {
        if (typeof args[i] === 'object') {
            for (var p in args[i]) {
                res[p]  = args[i][p];
            }
        }else{
            res[index++]    = args[i];
        }
    }
    return res;
}
