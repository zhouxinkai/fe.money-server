import { Context } from 'koa';
import { route } from './decorator';
import MenuService from '../services/menu';

export default class MenuController {
  /**
   * 获取推荐菜品
   */
  @route('get', '/api/menu/recommend')
  async getRecommend(ctx: Context) {
    return await MenuService.getRecommend(ctx);
  }
  /**
   * 获取菜单
   */
  @route('get', '/api/menu')
  async getMenu(ctx: Context) {
    ctx.set('Cache-Control', 'no-cache');
    return await MenuService.getMenu(ctx);
  }

  @route('get', '/api/cart')
  async getCart(ctx: Context) {
    ctx.set('Cache-Control', 'no-cache');
    return await MenuService.getCart(ctx);
  }

  @route('post', '/api/cart/modification')
  async updateCart(ctx: Context) {
    return await MenuService.updateCart(ctx);
  }

  @route('post', '/api/cart/clean')
  async clearCart(ctx: Context) {
    return await MenuService.clearCart(ctx);
  }


  /**
   * 获取推送的token
   */
  @route('get', '/api/push/token')
  async getPushToken(ctx: Context) {
    return await MenuService.getPushToken(ctx);
  }

  /**
   * 上报推送的token
   */
  @route('put', '/api/push/token')
  async reportPushToken(ctx: Context) {
    return await MenuService.reportPushToken(ctx);
  }

  @route('put', '/api/push/ack')
  async reportAck(ctx: Context) {
    return await MenuService.reportAck(ctx);
  }

  @route('put', '/api/report/heart')
  async reportHeartBeat(ctx: Context) {
    return await MenuService.reportHeartBeat(ctx);
  }

  @route('get', '/api/getCartDish')
  async getCartDish(ctx: Context) {
    return await MenuService.getCartDish(ctx);
  }
}
