const path = require('path');
const octoKey = 'com.sankuai.sjst.erp.buffet';
module.exports = {
  port: 8080,
  isDev: false,
  isProd: false,
  isMock: false,
  root: path.resolve(__dirname, '..'),
  xf: {
    appId: '5a3c7645',
    appKey: '844e8ec8318843919bb7703b1e169dce'
  }
};