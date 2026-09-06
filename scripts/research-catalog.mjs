import fs from 'node:fs/promises';
import crypto from 'node:crypto';
export const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&nbsp;/g,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n));
export const plain=s=>decode(s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ')).trim();
export async function page(url){
 const dir='.tmp/official';await fs.mkdir(dir,{recursive:true});
 const file=`${dir}/${crypto.createHash('sha1').update(url).digest('hex')}.html`;
 try{return await fs.readFile(file,'utf8');}catch{}
 const response=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error(`${response.status} ${url}`);
 const html=await response.text();await fs.writeFile(file,html);return html;
}
export function links(html,url){return [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(m=>({url:new URL(decode(m[1]),url).href,label:plain(m[2])}));}
export function images(html,url){return [...html.matchAll(/<img\b[^>]*>/gi)].map(m=>{const src=m[0].match(/\bsrc=["']([^"']+)/i)?.[1];return src?{url:new URL(decode(src),url).href,alt:decode(m[0].match(/alt=["']([^"']*)/i)?.[1]||'')}:null;}).filter(Boolean);}
if(process.argv[1]?.endsWith('research-catalog.mjs'))for(const url of process.argv.slice(2))try{const html=await page(url);console.log(JSON.stringify({url,title:plain(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||''),links:[...new Map(links(html,url).filter(l=>/product|items|hair|shampoo|treatment|\/pro\/|deep|melty|milky|rich|care|couture|sera|spa|premium/i.test(l.url)).map(l=>[l.url,l])).values()],images:images(html,url).filter(i=>/shampoo|treatment|item|product|packshot|bain|mask/i.test(i.url+' '+i.alt)).slice(0,100)}));}catch(e){console.log(JSON.stringify({url,error:e.message}));}
