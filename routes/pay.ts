import { Context } from 'koa';
import { route } from './decorator'
import PayService from '../services/pay';

export default class PayController {
  @route('get', '/api/pay')
  async pay(ctx: Context) {
    return PayService.pay(ctx);
  }

  @route('get', '/api/merchantId')
  async getMerchantId(ctx: Context) {
    return await PayService.getMerchantId(ctx);
  }

  // 取消订单支付路由
  @route('post', '/api/pay/cancel')
  async cancelPay(ctx: Context) {
    return await PayService.cancelPay(ctx);
  }
}
