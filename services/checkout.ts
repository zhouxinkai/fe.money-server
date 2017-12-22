import ExecThrift, { OrderAccessThriftService, Model } from '../thrift';
import { assertThriftSuccess } from '../lib/error';
import { Context } from 'koa';

import {
  getTableId,
  getTenantInfo,
  getUserInfo,
} from '../helpers/state';

const execThrift = ExecThrift(assertThriftSuccess);

class CheckoutService {
  async getUnpaid(ctx: Context) {

    const tableId = getTableId(ctx);
    const tenantInfo = getTenantInfo(ctx);
    const userInfo = getUserInfo(ctx);
    if (!tenantInfo || !userInfo || !tableId) {
      throw new Error('租户、用户、桌台信息设置不全');
    }
    const poiBaseTO = new Model.PoiBaseTO(tenantInfo);

    const tableOrderReq = new Model.TableOrderReq({
      userBaseTO: new Model.UserBaseTO({
        userId: userInfo.userId,
        userType: userInfo.userType,
      }),
      tableId,
      pageNo: 1,
      pageSize: -1
    })
    return await execThrift(OrderAccessThriftService, 'getUnpaidOrderFromPos')(poiBaseTO, tableOrderReq)
  }
}

export default new CheckoutService();
