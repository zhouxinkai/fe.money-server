import compose = require('koa-compose');
import error from './error';
import performance from './performance';
import auth from './auth';
import log from './log';
import state from './state';

export default compose([log, error, performance, auth, state]);
