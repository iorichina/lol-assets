var path        = require('path');
var config      = require('config');
module.exports  = {
    init    : function(root_path) {
        root_path           = root_path || __dirname;

        global.CONFIG       = config;
        global.PATH         = path;
        global.ROOT_PATH    = root_path;
        global.RESOURCE_PATH= CONFIG.resource_path.indexOf('/')===0 ? CONFIG.resource_path : PATH.join(ROOT_PATH, CONFIG.resource_path);

        global.INCLUDE      = function(modulePath) {
            if (modulePath.indexOf('/') === 0)
                return require(PATH.join(ROOT_PATH, modulePath));
            return require(modulePath);
        };
    }
};