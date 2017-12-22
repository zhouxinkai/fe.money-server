import ExecThrift, { OrderAccessThriftService } from '../thrift';
import ServerError, { assertThriftSuccess } from '../lib/error';
import { Context } from 'koa';
import URL = require('url');
import { UserType } from '../../declarations/constants';

const execThrift = ExecThrift(assertThriftSuccess);

class AuthService {
  async auth(ctx: Context) {
    const query = ctx.query;

    const type = ctx.cookies.get('userType') || '';
    const userType = type ? <UserType>Number(type) : UserType.MT;
    const authCode = String(query.code || query.auth_code || '');

    const setCookie = async () => {
      const ret = await execThrift(OrderAccessThriftService, 'getTokenInfoV2')(authCode, userType);
      if (ret.token) {
        ctx.cookies.set('token', ret.token);
        console.info('SET TOKEN', ret.token);
        return true;
      }
      return false;
    }

    let cont = ctx.query.continue ? URL.parse(ctx.query.continue, true) : null;
    if (cont) {
      if (!cont.hostname || cont.hostname === ctx.hostname) {
        cont = cont.query.continue ? URL.parse(cont.query.continue, true) : cont;
        if (authCode) {
          if (await setCookie()) {
            ctx.redirect(URL.format(cont));
            return;
          };
        }
      } else {
        ctx.redirect(URL.format(Object.assign({}, cont, {
          search: undefined,
          query: Object.assign({}, cont.query, {
            code: authCode,
          }),
        })));
        return;
      }
    } else {
      if (await setCookie()) {
        ctx.redirect('/restaurant');
        return;
      }
    }

    throw new ServerError({
      message: '用户未授权',
      status: 401,
    });
  }
}

export default new AuthService();
