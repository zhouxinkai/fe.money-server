import * as config from 'config';
if (config.get('isDev')) {
  require('./dev-server');
} else {
  const hlb = require('@mtfe/hlb');
  const port = config.get('port');
  require('./app').default.listen(port, () => {
    console.log('server is listen on port:', port);
    hlb.registerService({
      appkey: config.get('octoKey'),
      port,
    }).then(() => {
      console.log('hlb registed');
    }, (err: Error) => {
      console.error(err);
    });
  });
}
