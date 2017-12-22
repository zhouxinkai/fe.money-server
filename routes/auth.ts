import { Context } from 'koa';
import { route } from './decorator';
import AuthService from '../services/auth';

export default class AuthController {
  @route('get', '/api/auth')
  async auth(ctx: Context) {
    return await AuthService.auth(ctx);
  }
}
