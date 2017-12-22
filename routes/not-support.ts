import { route } from './decorator';

export class NotSupport {
  @route('get', '/noTable')
  async noTable() {
    return makeTpl('此二维码暂不支持自助点餐，请联系服务员点餐');
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
    </html>`;
}
