import ExecThrift, { OrderAccessThriftService, Model } from '../thrift';
import ServerError, { assertThriftSuccess } from '../lib/error';
import { getIpV4Address } from '../lib/ip';
import URL = require('url');
import { Context } from 'koa';
import config = require('config');
import { UserType, TradeType, PayType } from '../../declarations/constants';
import { getProtocol } from '../helpers/state';
import { OrderMode, OrderSource } from '../types';

const execThrift = ExecThrift(assertThriftSuccess);
import {
  getUserInfo,
  getTableId,
  getTenantInfo
} from '../helpers/state';

class PayService {
  async pay(ctx: Context) {
    const tenantInfo = getTenantInfo(ctx);
    const userInfo = getUserInfo(ctx);
    const tableId = getTableId(ctx);

    if (!tenantInfo || !userInfo) {
      throw new Error('用户尚未登录');
    }

    const _query: {
      orderId: string,
      payOrderId: string,
      openId: string,
      srcPathname: string,
      orderMode: string,
      orderSource: string
    } = ctx.request.query;

    const {
      orderId,
      payOrderId,
      openId,
      orderMode,
      orderSource,
    } = _query;
    if (!openId) {
      throw new ServerError({
        message: '金融中心授权未传回openId',
      });
    }

    const _getPayType = (userType: UserType) => {
      if (userType === UserType.MT) {
        return PayType.WEIXIN;
      } else if (userType === UserType.ALIPAY) {
        return PayType.ALIPAY;
      } else {
        return PayType.WEIXIN;
      }
    };
    const prePayReq: DiancanPrePayReqV2 = {
      clientIp: getIpV4Address(ctx.request.ip),
      orderId: payOrderId,
      payType: _getPayType(userInfo.userType),
      tradeType: TradeType.JS,
      payUserId: openId,
      userBaseTO: {
        userId: userInfo.userId,
        userType: userInfo.userType,
      }
    };
    const poiBaseTO: PoiBaseTO = {
      tenantId: tenantInfo.tenantId,
      poiId: tenantInfo.poiId,
    };

    console.info('prePay request: ', JSON.stringify({
      poiBaseTO,
      prePayReq,
      orderSource
    }), null, 2);
    const ret = await execThrift(OrderAccessThriftService, 'prePayV2')(
      new Model.PoiBaseTO(poiBaseTO),
      new Model.DiancanPrePayReqV2(Object.assign({}, prePayReq, {
        userBaseTO: prePayReq.userBaseTO ? new Model.UserBaseTO(prePayReq.userBaseTO) : undefined,
        orderMode: orderMode ? <OrderMode>Number(orderMode) : undefined,
        orderSource: orderSource ? <OrderSource>Number(orderSource) : undefined
      }))
    );
    console.info('prePay response: ', JSON.stringify(ret, null, 2));

    const userType = userInfo.userType;
    const bizId: string = config.get('pay.bizId');
    const redirect_query: { [key: string]: string } = {
      _: String(Math.round(Math.random() * 100000)),
      orderId,
      tenantId: String(tenantInfo.tenantId),
      poiId: String(tenantInfo.poiId),
      mode: orderMode,
    };
    if (tableId) {
      redirect_query.tableId = String(tableId);
    }
    const redirect_uri = {
      host: ctx.host,
      protocol: getProtocol(ctx),
      pathname: '/order-detail',
      query: redirect_query,
    };
    const query = {
      bizId,
      redirect_uri: URL.format(redirect_uri)
    };

    if (userType === UserType.MT) {
      /**
       * 跳转到金融H5支付页面
       */
      const appId = ret.appId;
      const timeStamp = (ret.timeStamp || '').toString();
      const nonceStr = ret.nonceStr;
      const signType = ret.signType;
      const paySign = ret.paySign;
      const prepay_id = ret.prepayId;

      Object.assign(query, {
        appId,
        timeStamp,
        nonceStr,
        prepay_id,
        signType,
        paySign
      });
    } else if (userType === UserType.ALIPAY) {
      const transactionId = ret.transactionId;
      Object.assign(query, {
        transactionId
      });
    }

    const payPageUrl = {
      protocol: config.get('pay.protocol') as string,
      host: config.get('pay.host') as string,
      pathname: '/pay/',
      query
    };

    console.info('payPageUrl: ', JSON.stringify(payPageUrl, null, 2));
    ctx.redirect(URL.format(payPageUrl));
  }

  async getMerchantId(ctx: Context) {
    const query: {
      tenantId: number,
      poiId: number
    } = ctx.request.query;
    const {
      tenantId,
      poiId
    } = query;
    const ret = await execThrift(OrderAccessThriftService, 'getMerchantId')(tenantId, poiId);

    return ret
  }

  async cancelPay(ctx: Context) {
    const tenantInfo = getTenantInfo(ctx);
    const userInfo = getUserInfo(ctx);
    if (!tenantInfo || !userInfo) {
      throw new Error('用户尚未登录');
    }
    const {
      orderId,
      billId
    }: {
      orderId: string,
      billId: string,
    } = ctx.request.body;
    const poiBase = new Model.PoiBaseTO(tenantInfo);
    const req = new Model.CancelBillReq({
      orderId,
      billId,
      user: new Model.UserInfoTO({
        userId: userInfo.userId,
        userType: userInfo.userType,
      })
    });
    return await execThrift(OrderAccessThriftService, 'cancelBill')(poiBase, req);
  }
}

export default new PayService();
