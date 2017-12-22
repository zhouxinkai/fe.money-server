import { Context } from 'koa';
import path = require('path');
import config = require('config');
import { route } from './decorator';
import { UserType } from '../../declarations/constants';
import { getUserInfo } from '../helpers/state';
/**
 * 前端构建信息
 */
let buildMeta: {
  [chunk: string]: string
} = {};

if (!config.get('isDev')) {
  try {
    buildMeta = require(path.join(config.get('root') as string, 'buildMeta.json'));
  } catch (e) { }
}
/**
 * 处理 webpack dev server 和 node server 端口不一致
 */
function fileResolver(file: string) {
  if (config.get('isDev')) {
    return `http://${require('ip').address()}:${config.get('webpack.port')}${file}`;
  } else {
    return `//s0.meituan.net/bs/fe.pos-buffet/@${file}`;
  }
};

function renderAlipayJs(ctx: Context) {
  const userInfo = getUserInfo(ctx);
  if (!userInfo) return '';
  if (userInfo.userType === UserType.ALIPAY) {
    return '<script src="https://a.alipayobjects.com/g/h5-lib/alipayjsapi/3.0.3/alipayjsapi.min.js"></script>';
  }
  return '';
}

function makeLingxiTpl() {
  return `
  <meta name="lx:category" content="${config.get('lingxi.channelIdentifier')}">
  <meta name="lx:appnm" content="${config.get('lingxi.appIdentifier')}">
  <link rel="dns-prefetch" href="//analytics.meituan.net" />
  <script type="text/javascript">
  !(function (win, doc, ns) {
      var cacheFunName = '_MeiTuanALogObject';
      win[cacheFunName] = ns;
      if (!win[ns]) {
          var _LX = function () {
              _LX.q.push(arguments);
              return _LX;
          };
          _LX.q = _LX.q || [];
          _LX.l = +new Date();
          win[ns] = _LX;
      }
  })(window, document, 'LXAnalytics');
  </script>
  <script src="//analytics.meituan.net/analytics.js" type="text/javascript" charset="utf-8" async defer></script>
  `
}

export class EntryController {
  @route('get', '/*')
  async entry(ctx: Context, next: Function) {
    if (!ctx.page) {
      return await next();
    }
    /**
     * 通过路由和构建信息，来自动加载对应的 chunk，加快页面读取速度
     */
    let chunkSrc: string | null = null;
    if (ctx.page.component && ctx.page.component.chunk) {
      const file = buildMeta[ctx.page.component.chunk];
      if (file) {
        chunkSrc = fileResolver(`/statics/${file}`);
      }
    }

    /**
     * 程序的入口文件
     */
    const mainFile = buildMeta['app'] || 'app.js';

    const sentryDSN = config.get('sentry.client.DSN');

    const isProd = config.get('isProd');
    const browserConfig = {
      payBizId: config.get('pay.bizId'),
      payHost: config.get('pay.host'),
      payProtocol: config.get('pay.protocol'),
      debug: config.get('feDebug'),
      prod: isProd,
      push: config.get('push'),
    };

    return `<html>
      <head>
        <title></title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <script>
          var fontSize = document.documentElement.clientWidth / 375 * 75;
          document.documentElement.style.fontSize = fontSize + 'px';
        </script>
        ${isProd ?
        `
          <script>
          !function(e,t,n){function s(){var e=t.createElement("script");e.async=!0,e.src="https://s0.meituan.net/bs/js/?f=mta-js:mta.min.js";var n=t.getElementsByTagName("script")[0];n.parentNode.insertBefore(e,n)}"[object String]"===Object.prototype.toString.call(n)&&(n=[n]),e.MeituanAnalyticsObject=n;for(var r=0;r<n.length;r++)!function(t){e[t]=e[t]||function(){(e[t].q=e[t].q||[]).push(arguments)}}(n[r]);if("complete"===t.readyState)s();else{var i="addEventListener",a="attachEvent";if(e[i])e[i]("load",s,!1);else if(e[a])e[a]("onload",s);else{var o=e.onload;e.onload=function(){s(),o&&o()}}}}(window,document,"mta"),function(e,t,n){if(t&&!("_mta"in t)){t._mta=!0;var s=e.location.protocol;if("file:"!==s){var r=e.location.host,i=t.prototype.open;t.prototype.open=function(t,n,a,o,l){if(this._method="string"==typeof t?t.toUpperCase():null,n){if(0===n.indexOf("http://")||0===n.indexOf("https://")||0===n.indexOf("//"))this._url=n;else if(0===n.indexOf("/"))this._url=s+"//"+r+n;else{var h=s+"//"+r+e.location.pathname;h=h.substring(0,h.lastIndexOf("/")+1),this._url=h+n}var u=this._url.indexOf("?");-1!==u?(this._searchLength=this._url.length-1-u,this._url=this._url.substring(0,u)):this._searchLength=0}else this._url=null,this._searchLength=0;return this._startTime=(new Date).getTime(),i.apply(this,arguments)};var a="onreadystatechange",o="addEventListener",l=t.prototype.send;t.prototype.send=function(t){function n(n,r){if(0!==n._url.indexOf(s+"//frep.meituan.net/_.gif")){for(var i="browser.ajax",a=[98,114,111,119,115,101,114,46,97,106,97,120],o=0,l=i.length;l>o;o++)if(i.charCodeAt(o)!==a[o])return;var h;if(n.response)switch(n.responseType){case"json":h=JSON&&JSON.stringify(n.response).length;break;case"blob":case"moz-blob":h=n.response.size;break;case"arraybuffer":h=n.response.byteLength;case"document":h=n.response.documentElement&&n.response.documentElement.innerHTML&&n.response.documentElement.innerHTML.length+28;break;default:h=n.response.length}e.mta("send",i,{url:n._url,method:n._method,error:!(0===n.status.toString().indexOf("2")||304===n.status),responseTime:(new Date).getTime()-n._startTime,requestSize:n._searchLength+(t?t.length:0),responseSize:h||0})}}if(o in this){var r=function(e){n(this,e)};this[o]("load",r),this[o]("error",r),this[o]("abort",r)}else{var i=this[a];this[a]=function(t){i&&i.apply(this,arguments),4===this.readyState&&e.mta&&e.mta&&n(this,t)}}return l.apply(this,arguments)}}}}(window,window.XMLHttpRequest,"mta");
          mta("create", "${config.get('mta.browser.token')}");
          mta("config", "beaconImage", "https://frep.meituan.net/_.gif");
          mta("send","page");
          </script>
          ${makeLingxiTpl()}
        ` : ''
        }
      </head>
      <body>
        <div id="app"></div>
        <script>
          var config = ${JSON.stringify(browserConfig)}
          var pageState = ${JSON.stringify(ctx.page.state || {})}
        </script>
        <script src="${fileResolver('/statics/' + mainFile)}"></script>
        ${chunkSrc ? '<script src="' + chunkSrc + '"></script>' : ''}
        ${sentryDSN ? `
          <script src="//s0.meituan.net/bs/raven-js/1.1.19:jsm/raven.min.js"></script>
          <script>
            Raven.config('${sentryDSN}').install();
            if (window.errors && window.errors.length) {
              window.errors.forEach(function(e){
                Raven.captureException(e.error, e.data);
              });
            }
          </script>` : ''}
        ${renderAlipayJs(ctx)}
        ${config.get('isDev') ? `
          <script src="http://${require('ip').address()}:1337/vorlon.js"></script>` : ''}
        ${config.get('eruda') ? `
          <script src="http://s0.meituan.net/bs/delivr/d762408/lib/eruda/eruda.js";></script>
          <script>eruda.init();</script>` : ''}
      </body>
    </html>`;
  }
}
