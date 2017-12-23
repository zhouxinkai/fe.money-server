import { Context } from 'koa';
import { route } from './decorator';
import { xfApi } from '../utils/api';
const crypto = require('crypto');
const config = require('config');
const querystring = require('querystring');
const formidable = require('formidable');
const fs = require('fs');

const appId = config.get('xf.appId');
const appKey = config.get('xf.appKey');
const getCurTime = () => Math.round(Date.now() / 1000);
const hash = crypto.createHash('md5');
const getBase64 = (content?: string) =>
  new Buffer(content || '').toString('base64');

//upload.js
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
          //var data = JSON.parse(stdout);
          console.log(stdout);
          // console.log(stderr);
          // console.log(err);
          fs.readFile(`${filePath}.wav`, function(err: Error, data: Buffer) {
            if (err) {
              reject(err);
            } else {
              const content = new Buffer(data).toString('base64');
              // console.log(content);
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
      console.log(filePath, files.record.type);
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
    body = querystring.stringify({ text });
    const curTime = getCurTime();
    const hash = crypto.createHash('md5');
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
    console.log(param);
    return ret.data;
  }

  @route('post', '/v1/aiui/v1/iat')
  async getIat(ctx: Context) {
    const filePath = await getRecordFilePath(ctx);
    let data = await silkToWav(filePath);
    console.log(data);
    let param = getBase64(
      JSON.stringify({ auf: '16k', aue: 'raw', scene: 'main' }),
    );
    // param = 'eyJhdWUiOiJyYXciLCJzY2VuZSI6Im1haW4iLCJhdWYiOiIxNksifQ==';
    const body = querystring.stringify({ data });
    let curTime = getCurTime();
    // curTime = 1514024045;
    // const hash = crypto.createHash('md5');
    hash.update(`${appKey}${curTime}${param}data=${data}`);
    let checkSum = hash.digest('hex');
    // checkSum = '5d75cc02ae40102c6dcdb294f69971f1';
    const ret = await xfApi.post(ctx.request.path, `data=${data}`, {
      headers: {
        'X-Appid': appId,
        'X-CurTime': curTime,
        'X-CheckSum': checkSum,
        'X-Param': param,
      },
    });
    console.log(
      JSON.stringify(
        {
          appId,
          curTime,
          checkSum,
          param,
        },
        null,
        2,
      ),
    );
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
    const body = querystring.stringify({ data });
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
