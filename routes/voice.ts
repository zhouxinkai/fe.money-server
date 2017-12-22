import { Context } from 'koa';
import { route } from './decorator';
import { xfApi } from '../utils/api';
const crypto = require('crypto');
const config = require('config');
const querystring = require('querystring');

const appId = config.get('xf.appId');
const appKey = config.get('xf.appKey');
const getCurTime = () => Math.round(Date.now() / 1000);
const hash = crypto.createHash('md5');
const getBase64 = (content?: string) =>
  new Buffer(content || '').toString('base64');
const wav = require('./wav');

export class Test {
  @route('post', '/v1/aiui/v1/text_semantic')
  async getTextSemantic(ctx: Context) {
    let body: {
      text: string;
    } =
      ctx.request.body;
    let { text } = body;
    const param = getBase64(
      JSON.stringify({ scene: 'main', userid: 'user_0001' }),
    );
    text = getBase64(text);
    body = querystring.stringify({ text });
    const curTime = getCurTime();
    hash.update(`${appKey}${curTime}${param}${body}`);
    const CheckSum = hash.digest('hex');
    const ret = await xfApi.post(ctx.request.path, body, {
      headers: {
        'X-Appid': appId,
        'X-CurTime': curTime,
        'X-CheckSum': CheckSum,
        'X-Param': param,
      },
    });
    return ret.data;
  }

  @route('post', '/v1/aiui/v1/iat')
  async getIat(ctx: Context) {
    let body: {
      data: string;
    } =
      ctx.request.body;
    let { data } = body;
    const param = getBase64(
      JSON.stringify({ auf: '8k', aue: 'raw', scene: 'main' }),
    );
    data = getBase64(data);
    data = wav;
    body = querystring.stringify({ data });
    const curTime = getCurTime();
    hash.update(`${appKey}${curTime}${param}${body}`);
    const CheckSum = hash.digest('hex');
    const ret = await xfApi.post(ctx.request.path, body, {
      headers: {
        'X-Appid': appId,
        'X-CurTime': curTime,
        'X-CheckSum': CheckSum,
        'X-Param': param,
      },
    });
    return ret.data;
  }

  @route('post', '/v1/aiui/v1/voice_semantic')
  async getVoiceSemantic(ctx: Context) {
    let body: {
      data: string;
    } =
      ctx.request.body;
    let { data } = body;
    const param = getBase64(
      JSON.stringify({
        auf: '8k',
        aue: 'raw',
        scene: 'main',
        userid: 'user_0001',
      }),
    );
    data = getBase64(data);
    data = wav;
    body = querystring.stringify({ data });
    const curTime = getCurTime();
    hash.update(`${appKey}${curTime}${param}${body}`);
    const CheckSum = hash.digest('hex');
    const ret = await xfApi.post(ctx.request.path, body, {
      headers: {
        'X-Appid': appId,
        'X-CurTime': curTime,
        'X-CheckSum': CheckSum,
        'X-Param': param,
      },
    });
    return ret.data;
  }
}
