import { Context } from 'koa';
import config = require('config');
import path = require('path');
import { assertThriftSuccess } from '../lib/error';
import { RouteConfig, Page } from '../../declarations/page';
import { Entry } from '../../declarations/constants';
import MenuService from '../services/menu';
import PoiService from '../services/poi';
import ExecThrift, { OrderAccessThriftService, Model } from '../thrift';
import { getTenantInfo, setTenantInfo, setTableId } from '../helpers/state';
import { OrderMode } from '../types';

type RouteMap = {
  [path: string]: RouteConfig,
};

const RestaurantPath = '/restaurant';
const CheckoutPath = '/checkout-entry';

const execThrift = ExecThrift(assertThriftSuccess);
/**
 * 前端页面路由信息
 */
const routes: RouteConfig[] = require(path.join(config.get('root') as string, 'src/client/routes.json'));
const routeMap: RouteMap = routes.reduce((m: RouteMap, r: RouteConfig) => { m[r.path] = r; return m; }, {});

/**
 * 中间件白名单
 */
const whiteList = [
  '/api/console/debug',
  '/api/auth',
  '/api/monitor/alive',
  '/MP_verify_cUVsxx21j35wyPby.txt',
  '/notSupport',
  '/test',
  '/favicon.ico'
];

export const extraStateHandlers = {
  async [RestaurantPath](ctx: Context) {
    const values = await Promise.all([
      MenuService.getMenu(ctx),
      MenuService.getRecommend(ctx),
    ]);

    return {
      menu: values[0].posMenuList || [],
      recommendMenu: values[1],
    };
  }
} as {[k: string]: Function}
/*
 * 此中间件负责处理 uuid、tenantInfo、tableInfo、页面 state 数据
 */
export default async (ctx: Context, next: Function) => {
  if (whiteList.includes(ctx.path)) return await next();

  const { tenantId, poiId, tableId, uuid } = ctx.query;

  let tenantInfo: {
    tenantId: number,
    poiId: number,
  } | null = null;

  let table: TableTO | null = null;

  /* get tenantInfo from query */
  if (uuid) {
    const entry = Number(ctx.query.entry) || Entry.TABLE;

    if (entry === Entry.TABLE) {
      const tableResp: TableResp = await execThrift(OrderAccessThriftService, 'getTableByQRCode')(uuid);
      if (!tableResp.table) {
        ctx.redirect('/noTable');
        return;
      }
      table = tableResp.table;
      tenantInfo = { tenantId: table.tenantId, poiId: table.poiId };
    }
  }

  if (tenantId && poiId) {
    tenantInfo = {
      tenantId: Number(tenantId),
      poiId: Number(poiId)
    };
  }
  /* get tenantInfo from query */

  // set tenantInfo
  setTenantInfo(ctx, tenantInfo);

  // get tenantInfo from cookies if not existed
  if (!tenantInfo) {
    tenantInfo = getTenantInfo(ctx);
  }
  // throw error if not existed still
  if (!tenantInfo) {
    throw new Error('没有租户信息');
  }

  const poiBase = new Model.PoiBaseTO(tenantInfo);

  // get table info if tableId existed
  if (tableId) {
    const tableResp = await execThrift(OrderAccessThriftService, 'getTableByTableId')(poiBase, Number(tableId));
    if (!tableResp.table) {
      ctx.redirect('/noTable');
      return;
    }
    table = tableResp.table;
  }

  // set global tableId
  if (table) {
    setTableId(ctx, table.tableId);
  }

  let routePath = ctx.path;
  // 如果是页面，获取 ctx.page 信息
  if (routePath in routeMap || routePath === '/') {
    ctx.page = {
      path: null,
      component: null,
      state: {
        globalInfo: await PoiService.getGlobalInfo(ctx),
      }
    };
    let route: RouteConfig = routeMap[routePath];
    const assignPageData = async (
      page: Page,
      _route: RouteConfig,
      _routePath: string,
      redirect?: {
        path: string,
        query?: {
          [key: string]: string | number | null,
        }
      }
    ) => {
      Object.assign(page, _route);
      if (redirect) {
        Object.assign(page.state, { redirect });
      }
      if (extraStateHandlers[_routePath]) {
        Object.assign(page.state, await extraStateHandlers[_routePath](ctx));
      }
    };
    if (route) {
      // if route existed
      await assignPageData(ctx.page, route, routePath);
    } else {
      // else redirect base on query
      if (tenantId && poiId) {
        const entry = Number(ctx.query.entry) || Entry.RESTAURANT;

        if (entry === Entry.RESTAURANT) {
          routePath = RestaurantPath;
          route = routeMap[routePath];
          await assignPageData(ctx.page, route, routePath, { path: routePath });
        }
      } else if (uuid) {
        const entry = Number(ctx.query.entry) || Entry.TABLE; // uuid 默认为桌台码

        if (entry === Entry.TABLE) {
          routePath = CheckoutPath;
          route = routeMap[routePath];
          await assignPageData(ctx.page, route, routePath, {
            path: routePath,
            query: {
              tableId: table && table.tableId,
            }
          });
        }
      }
    }
    let mis: { isInservice: boolean, mode: OrderMode | null } = { isInservice: false, mode: null };
    const { modeList } = await execThrift(OrderAccessThriftService, 'getPoiModes')(poiBase);
    if (modeList && (modeList.length === 1 || modeList.length === 2)) {
      if (modeList.length === 1) {
        const mode = modeList[0];
        switch (mode) {
          case OrderMode.SEQ_PAY_FORWARD:
            mis.isInservice = table === null;
            mis.mode = mode;
            break;
          case OrderMode.TABLE_PAY_FORWARD:
          case OrderMode.TABLE_PAY_AFTERWARD:
          case OrderMode.TABLE_CHECK_OUT:
            mis.isInservice = table !== null;
            mis.mode = mode;
            break;
          default: throw new Error('unkonwn mode');
        }
      } else {
        mis.isInservice = true;
        // 叫号取餐和桌台点餐两种模式下，以桌台信息为标准
        mis.mode = table !== null ? OrderMode.TABLE_PAY_FORWARD : OrderMode.SEQ_PAY_FORWARD;
      }
    }
    Object.assign(ctx.page.state, mis);
    table !== null && Object.assign(ctx.page.state.globalInfo, { table });
  }
  await next();
}
