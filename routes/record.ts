import { Context } from 'koa';
import { route } from './decorator';
import { xfApi } from '../utils/api';
const crypto = require('crypto');
const config = require('config');
const formidable = require('formidable');
const fs = require('fs');

const appId = config.get('xf.appId');
const appKey = config.get('xf.appKey');
const getCurTime = () => Math.round(Date.now() / 1000);
const hash = crypto.createHash('md5');
const getBase64 = (content?: string) =>
  new Buffer(content || '').toString('base64');

const exec = require('child_process').exec;
const silkToWav = (filePath: string) => {
  return new Promise<string>((resolve, reject) => {
    exec(
      `sh converter.sh ${filePath} wav`,
      (err: Error, stdout: any, stderr: any) => {
        if (err) {
          reject({
            err,
            stderr,
          });
        } else {
          console.log(stdout);
          fs.readFile(`${filePath}.wav`, function(err: Error, data: Buffer) {
            if (err) {
              reject(err);
            } else {
              const content = new Buffer(data).toString('base64');
              resolve(content);
            }
          });
        }
      },
    );
  });
};

const form = new formidable.IncomingForm();
const getRecordFilePath = (ctx: Context) => {
  return new Promise<string>((resolve, reject) => {
    form.parse(ctx.req, (err: Error, fields: any, files: any) => {
      fields;
      if (err) {
        reject(err);
      }
      const filePath: string = files.record.path;
      // console.log(filePath, files.record.type);
      resolve(filePath);
      // const content = fs.readFileSync(filePath, 'base64');
    });
  });
};

export class Test {
  @route('get', '/v1/aiui/v1/text_semantic')
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
    const formData = `text=${text}`;
    const curTime = getCurTime();
    const hash = crypto.createHash('md5');
    hash.update(`${appKey}${curTime}${param}${formData}`);
    const CheckSum = hash.digest('hex');
    const ret = await xfApi.post(ctx.request.path, formData, {
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
    const filePath = await getRecordFilePath(ctx);
    let data = await silkToWav(filePath);
    let param = getBase64(
      JSON.stringify({ auf: '16k', aue: 'raw', scene: 'main' }),
    );
    const body = `data=${data}`;
    let curTime = getCurTime();
    hash.update(`${appKey}${curTime}${param}${body}`);
    let checkSum = hash.digest('hex');
    const ret = await xfApi.post(ctx.request.path, body, {
      headers: {
        'X-Appid': appId,
        'X-CurTime': curTime,
        'X-CheckSum': checkSum,
        'X-Param': param,
      },
    });
    return ret.data;
  }

  @route('post', '/v1/aiui/v1/voice_semantic')
  async getVoiceSemantic(ctx: Context) {
    const filePath = await getRecordFilePath(ctx);
    const data = await silkToWav(filePath);
    const param = getBase64(
      JSON.stringify({
        auf: '16k',
        aue: 'raw',
        scene: 'main',
        userid: 'user_0001',
      }),
    );
    const body = `data=${data}`;
    const curTime = getCurTime();
    hash.update(`${appKey}${curTime}${param}${body}`);
    const checkSum = hash.digest('hex');
    const ret = await xfApi.post(ctx.request.path, body, {
      headers: {
        'X-Appid': appId,
        'X-CurTime': curTime,
        'X-CheckSum': checkSum,
        'X-Param': param,
      },
    });
    return ret.data;
  }
}
