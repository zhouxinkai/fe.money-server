import { Context } from 'koa';
import config = require('config');

type ContextState = {
  user?: UserInfoTO,
  tenant?: {
    tenantId: number,
    poiId: number
  },
  tableId?: number,
}
/**
 * 取tableId的时候，前端页面一定要在query里面加上tableId，不是连续的中间件，ctx.state是不一样的
 * 因为tenantInfo可以设置在cookie上，userInfo每次都会从后端接口中拿，
 */

export function getTableId(ctx: Context) {
  const state = ctx.state as ContextState;
  let tableId = undefined;
  if (ctx.query.tableId || ctx.query['amp;tableId']) {
    tableId = Number(ctx.query.tableId || ctx.query['amp;tableId']);
    setTableId(ctx, tableId);
  } else if (state.tableId) {
    tableId = state.tableId;
  }
  return tableId || null;
}

export function setTableId(ctx: Context, tableId?: number) {
  if (!tableId) return;
  const state = ctx.state as ContextState;
  state.tableId = tableId;
}

export function mustGetTenantInfo(ctx: Context) {
  const tenant = getTenantInfo(ctx);
  if (!tenant) {
    throw new Error('没有租户信息');
  }
  return tenant;
}


export function getTenantInfo(ctx: Context) {
  const state = ctx.state as ContextState;
  if (!state.tenant) return null;
  return state.tenant;
}

export function setTenantInfo(ctx: Context, tenantInfo?: {
  tenantId: number,
  poiId: number
} | null) {
  let tenantId = 0;
  let poiId = 0;
  const state = ctx.state as ContextState;
  if (tenantInfo) {
    tenantId = tenantInfo.tenantId;
    poiId = tenantInfo.poiId;
  } else {
    tenantId = Number(ctx.query.tenantId || ctx.query['amp;tenantId'] || ctx.cookies.get('tenantId'));
    poiId = Number(ctx.query.poiId || ctx.query['amp;poiId'] || ctx.cookies.get('poiId'));
  }

  if (tenantId && poiId) {
    ctx.cookies.set('tenantId', String(tenantId), {
      httpOnly: false,
    });
    ctx.cookies.set('poiId', String(poiId), {
      httpOnly: false,
    });
    state.tenant = {
      tenantId,
      poiId,
    };
  }
}

export function mustGetUserInfo(ctx: Context) {
  const user = getUserInfo(ctx);
  if (!user) {
    throw new Error('用户尚未登录');
  }
  return user;
}

export function getUserInfo(ctx: Context) {
  const state = ctx.state as ContextState;
  if (!state.user) return null;
  return state.user;
}

export function setUserInfo(ctx: Context, userInfo?: UserInfoTO) {
  if (!userInfo) return;
  const state = ctx.state as ContextState;
  state.user = userInfo;
}

export function getProtocol(ctx: Context) {
  return config.get('isProd') ? 'https' : ctx.protocol;
}
