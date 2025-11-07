const http = require('http');
const url = 'http://localhost:3001/api/dotaciones/proximas?limit=1';
http.get(url, res => {
  console.log('statusCode', res.statusCode);
  let d='';
  res.on('data', c => d+=c);
  res.on('end', ()=>{
    try{ console.log('body:', JSON.parse(d)); }catch(e){ console.log('body:', d); }
  });
}).on('error', e => console.error('ERR', e.message));
