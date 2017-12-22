import ExecThrift, { OrderAccessThriftService } from '../thrift';
import { Context } from 'koa';
import ServerError, { assertThriftSuccess } from '../lib/error';
import { getTenantInfo } from '../helpers/state';

const execThrift = ExecThrift(assertThriftSuccess);

class UserService {
  getUsers(ctx: Context) {
    const userRefs = ctx.request.body as UserRef[];
    const tenantInfo = getTenantInfo(ctx);
    if (!Array.isArray(userRefs)) {
      throw new ServerError({
        message: '请求格式不正确',
        ignore: true,
        status: 400,
      });
    }
    if (!tenantInfo) {
      throw new Error('用户尚未登录');
    }

    return Promise.all(userRefs.map(u => execThrift(OrderAccessThriftService, 'getUserInfoById')(tenantInfo.tenantId, u.id, u.userType)))
  }
}

export default new UserService();
