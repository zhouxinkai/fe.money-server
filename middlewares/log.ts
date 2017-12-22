import koa = require('koa');
import moment = require('moment');

const dateformat = 'YYYY-MM-DD HH:mm:ss.SSS';

export default async (ctx: koa.Context, next: Function) => {
  const start: moment.Moment = moment();
  await next();
  const end: moment.Moment = moment();
  // 注意这里经过后续中间件的处理，能取到 tenant 和 user
  const log = {
    path: ctx.path,
    method: ctx.method,
    query: ctx.query,
    body: ctx.request.body,
    status: ctx.status,
    response: ctx.body,
    start: start.format(dateformat),
    end: end.format(dateformat),
    spend: end.valueOf() - start.valueOf(),
  };
  console.log(`request log: ${JSON.stringify(log, null, 2)}`);
};
