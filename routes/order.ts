import { Context } from 'koa';
import { route } from './decorator';
import OrderService from '../services/order';

export default class OrderController {
  @route('post', '/api/submitOrder')
  async submitOrder(ctx: Context) {
    return await OrderService.submitOrder(ctx);
  }

  @route('get', '/api/orderDetail')
  async getOrderDetailById(ctx: Context) {
    return await OrderService.getOrderDetailById(ctx);
  }

  @route('get', '/api/orderStatus')
  async getOrderStatusById(ctx: Context) {
    return await OrderService.getOrderStatusById(ctx);
  }

  @route('post', '/api/orderList')
  async getOrderList(ctx: Context) {
    return await OrderService.getOrderList(ctx);
  }

  @route('get', '/api/order/recent')
  async getRecentOrder(ctx: Context) {
    ctx.set('Cache-Control', 'no-cache');
    return await OrderService.getRecentOrder(ctx);
  }
}
