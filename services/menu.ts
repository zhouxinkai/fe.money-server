import { Context } from 'koa';
import {
  mustGetTenantInfo,
  mustGetUserInfo,
} from '../helpers/state';

import ExecThrift, {
  OrderAccessThriftService,
  Model
} from '../thrift';
import CartExecThrift, {
  DcCartThriftService,
  CartModel
} from '../thrift/cart';
import {
  assertThriftSuccess,
} from '../lib/error';

const cartExecThrift = CartExecThrift(assertThriftSuccess);
const execThrift = ExecThrift(assertThriftSuccess);

class MenuService {
  async getRecommend(ctx: Context) {
    const tenant = mustGetTenantInfo(ctx);
    const user = mustGetUserInfo(ctx);
    const MenuType = Model.MenuType;
    const ps = [
      MenuType.ORDERED,
      MenuType.RECOMMEND,
      MenuType.SALELIST
    ].map(type => {
      const req = new Model.DianCanRecomendMenuReq({
        menuType: type,
        userId: user.userId,
        userType: user.userType,
      });
      return execThrift(OrderAccessThriftService, 'getRecommendMenu')(tenant.tenantId, tenant.poiId, req);
    })
    const result = await Promise.all(ps);
    return {
      ordered: result[0].dianCanRecommendMenuTO || [],
      recommend: result[1].dianCanRecommendMenuTO || [],
      salelist: result[2].dianCanRecommendMenuTO || [],
    }
  }

  async getMenu(ctx: Context) {
    const tenantInfo = mustGetTenantInfo(ctx);
    const request = new Model.DiancanGetMenuReq({
      source: 1
    });
    return await execThrift(OrderAccessThriftService, 'getMenu')(
      tenantInfo.tenantId,
      tenantInfo.poiId,
      request
    );
  }

  async getCart(ctx: Context) {
    const { tenantId, poiId, userId, userType, tableId } = ctx.query
    return await cartExecThrift(DcCartThriftService, 'getAllDcCartDishV2')(new CartModel.DcCartFormV2TO({
      tenantId,
      poiId,
      userId,
      userType,
      tableId,
    }));
  }

  async updateCart(ctx: Context) {
    const { tenantId, poiId, userId, userType, list, tableId } = ctx.request.body
    const from = new CartModel.DcCartFormV2TO({
      tenantId,
      poiId,
      userId,
      userType,
      tableId,
    })
    const cart: CartModel.DiancanCartV2TO[] = []

    if (Array.isArray(list) && list.length) {
      list.forEach((i: DiancanCartV2TO) => {
        i.cartUserInfoTO = new CartModel.CartUserInfoTO(i.cartUserInfoTO);
        const userInfo = new CartModel.DiancanCartV2TO(i);
        cart.push(userInfo);
      })
    } else {
      console.error('modified cart list must be array & at least one')
    }
    return await cartExecThrift(DcCartThriftService, 'updateOrInsertDcCartDishV2')(from, cart)
  }

  async clearCart(ctx: Context) {
    const { tenantId, poiId, userId, userType, tableId, isOrdered, orderId } = ctx.request.body

    return await cartExecThrift(DcCartThriftService, 'clearDcCartDishV2')(new CartModel.DcCartFormV2TO({
      tenantId,
      poiId,
      userId,
      userType,
      tableId,
      orderId,
    }), isOrdered);
  }

  async getPushToken(ctx: Context) {
    const {
      tenantId,
      poiId,
      userId,
      userType,
      tableId,
    } = ctx.request.query;

    const dcCartBase = new CartModel.DcCartFormV2TO({
      tenantId,
      poiId,
      userType,
      userId,
      tableId,
    });

    return await cartExecThrift(DcCartThriftService, 'getPushToken')(dcCartBase);
  }

  async reportPushToken(ctx: Context) {
    const {
      tenantId,
      poiId,
      userId,
      userType,
      tableId,
      token,
    } = ctx.request.body;

    const dcCartBase = new CartModel.DcCartFormV2TO({
      tenantId,
      poiId,
      userType,
      userId,
      tableId,
    });
    return await cartExecThrift(DcCartThriftService, 'reportToken')(dcCartBase, token);
  }

  async reportHeartBeat(ctx: Context) {
    const {
      tenantId,
      poiId,
      userId,
      userType,
      tableId,
    } = ctx.request.body;

    const dcCartBase = new CartModel.DcCartFormV2TO({
      tenantId,
      poiId,
      userType,
      userId,
      tableId,
    });

    return await cartExecThrift(DcCartThriftService, 'reportHeartBeat')(dcCartBase);
  }

  async reportAck(ctx: Context) {
    const {
      tenantId,
      poiId,
      userId,
      userType,
      tableId,
      uniqueId,
    } = ctx.request.body;

    const dcCartBase = new CartModel.DcCartFormV2TO({
      tenantId,
      poiId,
      userType,
      userId,
      tableId,
    });

    return await cartExecThrift(DcCartThriftService, 'ackDianCanMessage')(dcCartBase, uniqueId);
  }

  async getCartDish(ctx: Context) {
    const {
      tenantId,
      poiId,
      userId,
      userType,
      tableId,
      itemId,
    } = ctx.request.query;

    const dcCartBase = new CartModel.DcCartFormV2TO({
      tenantId,
      poiId,
      userType,
      userId,
      tableId,
    });

    return await cartExecThrift(DcCartThriftService, 'getDcCartDishV2')(dcCartBase, itemId);
  }
}

export default new MenuService();
