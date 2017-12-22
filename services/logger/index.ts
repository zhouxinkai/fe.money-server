import winston = require('winston');
import config = require('config');
import ScribeTransport from './scribe';

const appkey: string = config.get('octoKey');
const transports: winston.TransportInstance[] = [];

if (!config.get('isDev')) {
  transports.push(new ScribeTransport({ name: appkey, appkey }));
}
if (!config.get('isProd')) {
  transports.push(new winston.transports.Console({
    level: 'info',
    handleExceptions: true,
    humanReadableUnhandledException: true,
    json: false,
    colorize: true,
  }));
}

winston.configure({
  transports,
  exitOnError: false,
});

export default winston;