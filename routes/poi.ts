import { Context } from 'koa';
import { route } from './decorator';
import PoiService from '../services/poi';

export default class PoiController {
  @route('get', '/api/poiInfo')
  async getPoiInfo(ctx: Context) {
    return await PoiService.getPoiInfo(ctx);
  }

  @route('post', '/api/checkOnline')
  async checkOnline(ctx: Context) {
    return await PoiService.checkOnline(ctx);
  }

  @route('get', '/api/global/info')
  async getGlobalInfo(ctx: Context) {
    return await PoiService.getGlobalInfo(ctx);
  }

  @route('get', '/api/callWaiter')
  async callWaiter(ctx: Context) {
    return await PoiService.callWaiter(ctx);
  }

  @route('get', '/api/poiDetail')
  async getPoiDetail(ctx: Context) {
    return await PoiService.getPoiDetail(ctx);
  }
}
