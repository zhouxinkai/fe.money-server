import { Context } from 'koa';
import ExecThrift, { OrderAccessThriftService, Model } from '../thrift';
import { assertThriftSuccess } from '../lib/error';
import { getUserInfo, getTenantInfo } from '../helpers/state';

const execThrift = ExecThrift(assertThriftSuccess);

class OrderService {
  async submitOrder(ctx: Context) {
    const body: {
      poiBaseTO: PoiBaseTO,
      dcOrderFormTO: DiancanOrderFormTOV2,
    } = ctx.request.body;
    const {
      poiBaseTO,
      dcOrderFormTO
    } = body;
    const userBaseTO = new Model.UserBaseTO(dcOrderFormTO.userBaseTO);
    // dishes mock数据和thrift定义数据不符合会报错
    const orderForm = new Model.DiancanOrderFormTOV2(Object.assign({}, dcOrderFormTO, {
      dishes: dcOrderFormTO.dishes ? dcOrderFormTO.dishes.map(d => {
        const odi = Object.assign({}, d, {
          skues: d.skues.map(s => {
            return new Model.DiancanOrderDishTO(s);
          }),
        }) as Model.DiancanOrderDishItemTO;
        odi.userInfoTO = new Model.UserInfoTO(odi.userInfoTO);
        return new Model.DiancanOrderDishItemTO(odi);
      }) : undefined,
      userBaseTO,
    }));

    const poiTO = new Model.PoiBaseTO(poiBaseTO);

    const ret = await execThrift(OrderAccessThriftService, 'submitDcOrderV2')(poiTO, orderForm);
    return ret;
  }

  async getOrderDetailById(ctx: Context) {
    const query: {
      tenantId: string,
      poiId: string,
      orderId: string,
      userId: string,
      userType: string,
    } = ctx.request.query;
    const {
      tenantId,
      poiId,
      orderId,
      userId,
      userType,
    } = query;
    const ret = await execThrift(OrderAccessThriftService, 'getDcOrderByIdV3')(new Model.PoiBaseTO({
      tenantId: Number(tenantId),
      poiId: Number(poiId),
    }), orderId, new Model.UserBaseTO({
      userId,
      userType: Number(userType),
    }));
    return ret
  }

  async getOrderStatusById(ctx: Context) {
    const query: {
      poiBaseTO: string,
      orderId: string,
      userBaseTO: string
    } = ctx.request.query;
    const {
      poiBaseTO,
      orderId,
      userBaseTO
    } = query;
    const ret = await execThrift(OrderAccessThriftService, 'getDcOrderStatusV2')(new Model.PoiBaseTO(JSON.parse(poiBaseTO)), orderId, new Model.UserBaseTO(JSON.parse(userBaseTO)));

    return ret
  }

  async getOrderList(ctx: Context) {
    const body: {
      poiBaseTO: PoiBaseTO,
      req: DiancanUserOrderReqV2
    } = ctx.request.body;
    const {
      poiBaseTO,
      req
    } = body;
    const poiTo = new Model.PoiBaseTO(poiBaseTO);
    const userInfo = getUserInfo(ctx);
    if (!userInfo) {
      throw new Error('用户尚未登录');
    }
    const orderReq = new Model.DiancanUserOrderReqV2(Object.assign({}, req, {
      userBaseTO: new Model.UserBaseTO({
        userId: userInfo.userId,
        userType: userInfo.userType
      })
    }));
    const ret = await execThrift(OrderAccessThriftService, 'getDcOrdersByUserV2')(poiTo, orderReq);

    return ret
  }

  async getRecentOrder(ctx: Context) {
    const tenantInfo = getTenantInfo(ctx);
    const userInfo = getUserInfo(ctx);

    if (!tenantInfo || !userInfo) {
      throw new Error('租户、用户、信息设置不全');
    }

    const poiBase = new Model.PoiBaseTO(tenantInfo);
    const userBase = new Model.UserBaseTO({
      userId: userInfo.userId,
      userType: userInfo.userType,
    });

    return await execThrift(OrderAccessThriftService, 'getRecentDcOrder')(poiBase, userBase, 2);
  }
}

export default new OrderService();
