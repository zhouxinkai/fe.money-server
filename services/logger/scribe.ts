import os = require('os');
import winston = require('winston');
import moment = require('moment');
import { Scribe } from '@mtfe/node-scribe';

export default class ScribeTransport extends winston.Transport {
  host: string = '127.0.0.1';
  port: number = 4252;
  hostname: string = os.hostname();
  dateFormat: string = 'YYYY-MM-DD HH:mm:ss.SSS';
  name: string;
  appkey: string;
  client: Scribe;

  constructor(options: {
    name: string,
    appkey: string,
  }) {
    super(options);
    this.name = options.name;
    this.appkey = options.appkey;
    this.client = new Scribe(this.host, this.port, {
      autoReconnect: true,
    });
  }

  log(level: string, msg: string, meta: { [key: string]: any }, callback: Function) {
    const datetime = moment().format(this.dateFormat);
    const log = `${datetime} ${this.hostname} ${this.appkey} [${level.toUpperCase()}] main ${this.name} #XMDJ#${JSON.stringify(meta)}#XMDJ# ${msg}`;
    this.client.send(this.name, log);
    callback(null, true);
  }
}
