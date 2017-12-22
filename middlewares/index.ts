import compose = require('koa-compose');
import error from './error';
import log from './log';

export default compose([log, error]);
