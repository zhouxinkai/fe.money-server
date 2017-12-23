const getBase64 = content => new Buffer(content || '').toString('base64');
let param = getBase64(
  '{"auf":"8k","aue":"raw","scene":"main"}',
);
console.log(param);
