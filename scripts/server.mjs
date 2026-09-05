import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const types = {'.png':'image/png','.jpg':'image/jpeg','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml'};
const server = http.createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep) || pathname.split('/').some(p=>p.startsWith('.'))) {res.writeHead(403);res.end();return;}
    const data = await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-cache'});res.end(data);
  } catch {res.writeHead(404);res.end('Not found');}
});
server.listen(Number(process.env.PORT || 4173),'127.0.0.1',()=>console.log('HairMatch: http://127.0.0.1:'+(process.env.PORT || 4173)));
