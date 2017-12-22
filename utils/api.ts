const axios = require('axios');
export const xfApi = axios.create({
  baseURL: 'https://api.xfyun.cn',
  timeout: 10000,
  withCredentials: true,
  responseType: 'json',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
  },
  validateStatus() {
    return true;
  },
});
