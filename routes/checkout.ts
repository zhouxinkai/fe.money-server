import { Context } from 'koa';
import { route } from './decorator';
import CheckoutService from '../services/checkout';

export default class CheckoutController {
  @route('get', '/api/unpaid')
  async getUnpaid(ctx: Context) {
    return await CheckoutService.getUnpaid(ctx);
  }
}
