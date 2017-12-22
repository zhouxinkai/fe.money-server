import config = require('config');
import http = require('http');

// hot load for node.js
http.createServer(function(req, res) {
  Object.keys(require.cache).forEach((module) => {
    if (!module.match(/node_modules/)) {
      delete require.cache[module];
    }
  });
  require('./app').default.callback()(req, res);
}).listen(config.get('port'), () => {
  console.log('dev server is listen on port:', config.get('port'));
});
