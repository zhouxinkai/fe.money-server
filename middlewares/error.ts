import { Context } from 'koa';
import ServerError from '../lib/error';
import raven = require('raven');
import config = require('config');

const client = new raven.Client(config.get('sentry.server.DSN'));

function renderErrorHtml(e: ServerError) {
  const isDev = config.get('isDev');
  return `
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta charset=“utf-8”>
      <title></title>
    </head>
    <body>
      <h3>${e.message}</h3>
      ${isDev && e.code ? `<p>CODE:${e.code}</p>` : ''}
      ${isDev ? `<pre>${e.stack}</pre>` : ''}
    </body>
  </html>
  `;
}

export default async (ctx: Context, next: Function) => {
  try {
    await next();
  } catch (e) {
    const err: ServerError = e;
    if (!err.ignore && !config.get('isDev')) {
      client.captureException(e, {
        extra: Object.assign({}, e.data, {
          user: ctx.cookies.get('openid'),
          tenantId: ctx.cookies.get('tenantId'),
          poiId: ctx.cookies.get('poiId'),
        }),
      });
    }

    if (ctx.accepts('html')) {
      ctx.body = renderErrorHtml(err);
    } else if (ctx.accepts('json')) {
      const body: {
        message: string,
        code: number,
        stack?: string,
        show?: boolean
      } = {
        message: err.message,
        code: err.code,
        show: err.show
      };

      if (config.get('isDev')) {
        body.stack = err.stack;
      }
      ctx.body = body;
    } else {
      ctx.body = err.message;
    }

    if (!ctx.status) {
      // 这里因为线上 nginx 会拦截 500，改为返回 status 200
      ctx.status = err.status || 200;
    }

    if (e instanceof Error) {
      console.error('ERROR', e);
    } else {
      console.error('ERROR', JSON.stringify(e));
    }
  }
}
