import ExecThrift, { OrderAccessThriftService, Model } from '../thrift';
import { Context } from 'koa';
import { assertThriftSuccess } from '../lib/error';
const execThrift = ExecThrift(assertThriftSuccess);
import { getTenantInfo, getUserInfo, getTableId } from '../helpers/state';

class PoiService {
  async getPoiInfo(ctx: Context) {
    const query: {
      tenantId: number,
      poiId: number
    } = ctx.request.query;
    const {
    tenantId,
      poiId
  } = query;
    return await execThrift(OrderAccessThriftService, 'getPoiInfo')(tenantId, poiId);
  }

  async checkOnline(ctx: Context) {
    const body: ShopInfo = ctx.request.body;
    const ret = await execThrift(OrderAccessThriftService, 'checkOnline')(
      body.tenantId || 0,
      body.poiId || 0,
      body.tableId || 0
    );
    return ret;
  }

  async getGlobalInfo(ctx: Context) {
    const userInfo = getUserInfo(ctx);
    const tenantInfo = getTenantInfo(ctx);

    if (!userInfo || !tenantInfo) {
      throw new Error('用户尚未登录');
    }
    const tableId = getTableId(ctx);
    const p1 = execThrift(OrderAccessThriftService, 'checkOnline')(tenantInfo.tenantId, tenantInfo.poiId, tableId || 0);
    const p2 = execThrift(OrderAccessThriftService, 'getPoiInfo')(tenantInfo.tenantId, tenantInfo.poiId);
    const p3 = execThrift(OrderAccessThriftService, 'isTabShow')(tenantInfo.tenantId, tenantInfo.poiId);
    const values = await Promise.all([p1, p2, p3]);

    return {
      userInfo,
      isOnline: values[0].isOnline || false,
      poiInfo: {
        tenantId: tenantInfo.tenantId,
        poiId: tenantInfo.poiId,
        poiName: values[1].poiName,
      },
      isCallWaiterShow: values[2].isShow || false,
    }
  }

  async callWaiter(ctx: Context) {
    const userInfo = getUserInfo(ctx);
    const tenantInfo = getTenantInfo(ctx);
    const tableId = getTableId(ctx);
    if (!userInfo || !tenantInfo) {
      throw new Error('用户尚未登录');
    }
    const req = new Model.CallWaiterReq({
      tableId: tableId || 0,
      userType: userInfo.userType,
      userId: userInfo.userId
    });
    const ret = await execThrift(OrderAccessThriftService, 'callWaiter')(tenantInfo.tenantId, tenantInfo.poiId, req);
    return ret;
  }

  async getPoiDetail(ctx: Context) {
    const tenantInfo = getTenantInfo(ctx);
    if (!tenantInfo) {
      throw new Error('用户尚未登录');
    }

    const ret = await execThrift(OrderAccessThriftService, 'getPoiDetailInfo')(tenantInfo.tenantId, tenantInfo.poiId);
    return ret;
  }
}

export default new PoiService();
