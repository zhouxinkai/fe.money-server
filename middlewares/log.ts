import koa = require('koa');
import moment = require('moment');
import { getTenantInfo, getUserInfo } from '../helpers/state';
import LoggerService from '../services/logger';

const dateformat = 'YYYY-MM-DD HH:mm:ss.SSS';

export default async (ctx: koa.Context, next: Function) => {
  const start: moment.Moment = moment();
  await next();
  const end: moment.Moment = moment();
  // 注意这里经过后续中间件的处理，能取到 tenant 和 user
  const tenantInfo = getTenantInfo(ctx);
  const userInfo = getUserInfo(ctx);
  LoggerService.log(ctx.status >= 400 ? 'error' : 'info', 'request log', {
    path: ctx.path,
    method: ctx.method,
    query: JSON.stringify(ctx.query),
    body: JSON.stringify(ctx.request.body),
    tenantId: tenantInfo && tenantInfo.tenantId,
    poiId: tenantInfo && tenantInfo.poiId,
    userId: userInfo && userInfo.userId,
    status: ctx.status,
    response: JSON.stringify(ctx.body),
    start: start.format(dateformat),
    end: end.format(dateformat),
    spend: end.valueOf() - start.valueOf(),
  });
}
