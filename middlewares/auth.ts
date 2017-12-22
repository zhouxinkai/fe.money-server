import {
  Context
} from 'koa';
import ServerError from '../lib/error';
import URL = require('url');
import config = require('config');
import ExecThrift, { OrderAccessThriftService } from '../thrift';
import {
  assertThriftSuccess,
} from '../lib/error';

// import uuid = require('uuid');
import { UserType } from '../../declarations/constants';
import {
  setUserInfo,
  getProtocol
} from '../helpers/state';

// function guid() {
//   return uuid.v4().replace(/-/g, '');
// }


const execThrift = ExecThrift(assertThriftSuccess);

const whiteList = [
  '/api/console/debug',
  '/api/auth',
  '/api/monitor/alive',
  '/MP_verify_cUVsxx21j35wyPby.txt',
  '/notSupport',
  '/test',
  '/favicon.ico'
];

export default async (ctx: Context, next: Function) => {
  if (config.get('isMock')) {
    ctx.cookies.set('poiId', '8444', { httpOnly: false });
    ctx.cookies.set('tenantId', '23423', { httpOnly: false });
    ctx.cookies.set('token', '123d23112eqwqw34432123423', { httpOnly: false });
    ctx.cookies.set('userType', '-1', { httpOnly: false });
    ctx.cookies.set('uuid', '12d12d2213123rrr', { httpOnly: false });
  }

  if (whiteList.includes(ctx.path)) return next();

  const ua = ctx.request.get('User-Agent').toLowerCase();
  let userType: UserType | null = Number(ctx.cookies.get('userType')) || null;
  if (!userType) {
    if (/micromessenger/g.test(ua)) {
      userType = UserType.MT;
    } else if (/alipay/g.test(ua)) {
      userType = UserType.ALIPAY;
    } else {
      ctx.redirect('/notSupport');
      return next();
    }
  }
  ctx.cookies.set('userType', String(userType || ''), {
    httpOnly: false
  });

  let token: string = ctx.cookies.get('token');
  let isAuthSuccess: boolean = false;
  if (token) {
    try {
      const ret = await execThrift(OrderAccessThriftService, 'getUserInfoV2')(token, userType);
      isAuthSuccess = true;
      setUserInfo(ctx, ret.userInfo);

      if (ret.token) {
        ctx.cookies.set('token', ret.token);
      }

    } catch (e) {
      console.error(e)
      if (e.code === 21030) {
        // 21030 为token过期需要重新授权拿code
        console.error('TOKEN OUTDATE:', token);
      } else {
        throw e;
      }
    }
  }

  if (isAuthSuccess) {
    await next();
  } else if (ctx.accepts('html') && ctx.method === 'GET') {
    const href = URL.parse(ctx.href);
    if (config.get('isProd')) {
      href.protocol = getProtocol(ctx);
    }

    let cont: string = URL.format(href);

    if (!config.get('isProd')) {
      cont = URL.format({
        host: ctx.host,
        protocol: href.protocol,
        pathname: '/api/auth',
        query: {
          _: String(Math.round(Math.random() * 100000)),
          continue: ctx.href,
        },
      })
    }

    const redirectUri = URL.format({
      protocol: 'https:',
      host: 'diancan.meituan.com',
      pathname: '/api/auth',
      query: {
        continue: cont,
      },
    });

    let authPageUrl = '';
    if (userType === UserType.MT) {
      // const protocol = config.get('mtAuth.protocol') as string;
      // const host = config.get('mtAuth.host') as string;
      // const uuid = ctx.cookies.get('uuid') ? ctx.cookies.get('uuid') : guid();
      // ctx.cookies.set('uuid', uuid);
      authPageUrl = URL.format({
        // protocol,
        // host,
        // pathname: '/thirdlogin/auth',
        // query: {
        //   thirdType: 1,
        //   officialAccount: 4,
        //   uuid,
        //   callbackUrl: redirectUri
        // }
        protocol: 'https:',
        host: 'open.weixin.qq.com',
        pathname: '/connect/oauth2/authorize',
        query: {
          appid: config.get('weixin.appid') as string,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: 'snsapi_userinfo',
          state: 'state'
        },
        hash: '#wechat_redirect'
      });
    } else if (userType === UserType.ALIPAY) {
      authPageUrl = URL.format({
        protocol: 'https:',
        host: 'openauth.alipay.com',
        pathname: '/oauth2/publicAppAuthorize.htm',
        query: {
          app_id: config.get('alipay.appid') as string,
          scope: 'auth_user',
          redirect_uri: redirectUri,
          state: 'state'
        }
      });
    }

    ctx.redirect(authPageUrl);
    // 尤其注意：由于授权操作安全等级较高，所以在发起授权请求时，微信会对授权链接做正则强匹配校验，如果链接的参数顺序不对，授权页面将无法正常访问
  } else {
    throw new ServerError({
      message: '请重新授权',
      ignore: true,
      status: 401,
    });
  }
};

