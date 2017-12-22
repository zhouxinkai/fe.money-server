import { Context } from 'koa';
import { route } from './decorator';
import UserService from '../services/user';

export default class UserController {
  @route('post', '/api/users')
  async getUsers(ctx: Context) {
    return await UserService.getUsers(ctx);
  }
}
