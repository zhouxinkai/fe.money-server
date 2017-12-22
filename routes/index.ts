import Router = require('koa-router');
import { setRouter } from './decorator'
import './menu'
import './poi'
import './auth'
import './consoleDebug'
import './entry'
import './order'
import './user'
import './pay'
import './alive'
import './not-support'
import './checkout'

const router = new Router();

setRouter(router);
export default router.routes();
