const axios = require('axios');
export const wxApi = axios.create({
  baseURL: 'https://api.weixin.qq.com',
  timeout: 10000,
  withCredentials: true,
  responseType: 'json',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
  validateStatus() {
    return true;
  }
});
export const alipayApi = axios.create({
  baseURL: 'https://openapi.alipay.com',
  timeout: 10000,
  withCredentials: true,
  responseType: 'json',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
  validateStatus() {
    return true;
  }
});
