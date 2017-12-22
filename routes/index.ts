import Router = require('koa-router');
import { setRouter } from './decorator';
import './not-support';
import './voice';

const router = new Router();

setRouter(router);
export default router.routes();
