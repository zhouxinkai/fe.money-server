import { Context } from 'koa';
import { route } from './decorator';

export class NotSupport {
  @route('get', '/notSupport')
  async notSupoort(ctx: Context, next: Function) {
    ctx.body = makeTpl('请您使用微信或支付宝扫一扫功能进行点餐');
    await next();
  }

  @route('get', '/noTable')
  async noTable(ctx: Context, next: Function) {
    ctx.body = makeTpl('此二维码暂不支持自助点餐，请联系服务员点餐');
    await next();
  }
}

function makeTpl(content: string) {
  return `<html>
      <head>
        <title></title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <style type="text/css">
          body {
            display: table;
            height: 100%;
            margin: 0 auto;
          }
          .content {
            text-align: center;
            font-size: 16px;
            line-height: 24px;
            font-weight: normal;

            display: table-cell;
            vertical-align: middle;
          }
        </style>
      </head>
      <body>
        <div class="content">${content}</div>
      </body>
    </html>`
}
