import http from 'node:http'; import sharp from 'sharp';
let n=0;
http.createServer(async (req,res)=>{let b='';for await (const c of req) b+=c; const j=JSON.parse(b); n++;
 if(n===2){res.writeHead(429);res.end('rate');return;}
 const [w,h]=j.size.split('x').map(Number);
 const png=await sharp({create:{width:w,height:h,channels:4,background:j.background==='transparent'?{r:0,g:0,b:0,alpha:0}:'#88aa66'}}).composite([{input:Buffer.from(`<svg width="${w}" height="${h}"><rect x="${w/4}" y="${h/4}" width="${w/2}" height="${h/2}" fill="#335"/></svg>`)}]).png().toBuffer();
 res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({data:[{b64_json:png.toString('base64')}]}));
}).listen(8787);
