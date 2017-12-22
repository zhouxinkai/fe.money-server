import { Context } from 'koa';
import url = require('url');
import mta from '../lib/mta';

const getSpendTime = (date: Date) => {
  const endDate = new Date();
  return endDate.getTime() - date.getTime();
}

export default async (ctx: Context, next: Function) => {
  let err = null;
  const startDate = new Date();
  const tags = {
    endpoint: url.parse(ctx.request.url).pathname
  };
  mta.increment('network.responseCount', 1, tags);
  try {
    await next();
  } catch (e) {
    err = e;
    mta.timing('network.responseTime', getSpendTime(startDate), tags);
    mta.increment('network.errorCount', 1, tags);
    throw err;
  }

  mta.timing('network.responseTime', getSpendTime(startDate), tags);
}
