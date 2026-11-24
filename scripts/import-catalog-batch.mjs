// Import a reviewed batch manifest. Product facts are never inferred from image names.
// Usage: node scripts/import-catalog-batch.mjs data/catalog-additions-2026-11.json
import fs from 'node:fs/promises';
import path from 'node:path';
import {expandProducts} from '../js/catalog.js';
const manifest=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
const products=JSON.parse(await fs.readFile('data/products.json','utf8'));
const scoreKeys=Object.keys(products[0].scores);
const additions=[];
for(const entry of manifest.products){
 const {id,brand,name,series,kind,category,price,volume,image,sourceUrl,fragrance,reputation}=entry;
 if(products.some(p=>p.id===id))continue;
 if(!['shampoo','treatment'].includes(kind)||!/^[a-z0-9-]+$/.test(id))throw Error('Invalid item '+id);
 const extension=path.extname(new URL(image).pathname)||'.png';
 const local=`assets/images/products/catalog/${id}${extension}`;
 await fs.mkdir(path.dirname(local),{recursive:true});
 try{await fs.access(local);}catch{const response=await fetch(image,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error(`${response.status} ${image}`);if(!response.headers.get('content-type')?.startsWith('image/'))throw Error('Not an image '+image);await fs.writeFile(local,Buffer.from(await response.arrayBuffer()));}
 const item={name,price,volume,ingredients:[],verifiedAt:manifest.checkedAt,sourceUrl};
 const seriesOrder=[...new Set(manifest.products.filter(p=>p.brand===brand).map(p=>p.series))].indexOf(series);
 additions.push({id,brand,series,name,kind,seriesId:brand+'|'+series,category,image:local,images:[local],shampoo:kind==='shampoo'?item:null,treatment:kind==='treatment'?item:null,
  fragrance:{type:[],strength:null,label:fragrance||null,verified:!!fragrance,strengthVerified:false},
  scores:Object.fromEntries(scoreKeys.map(k=>[k,60])),diagnosisEligible:true,scoreStatus:'demo',dataStatus:entry.imageType==='retailer'?'retailer-verified-assessment-unconfirmed':'facts-verified-scores-demo',
  dataNote:entry.imageType==='retailer'?'商品名・容量・価格・画像は取扱店の掲載情報で確認。店舗の在庫や価格とは異なる場合があります。公式説明に基づく適性評価は未登録です。':'商品名・画像は公式情報を確認。価格・容量の未確認項目は表示せず、成分や香りを推測で補完していません。相性・使用感スコアは未検証の中立値で、口コミ評価とは別です。',
  sources:[{url:sourceUrl,label:entry.sourceLabel||brand+' 公式商品情報',checkedAt:manifest.checkedAt}],checkedAt:manifest.checkedAt,imageType:entry.imageType||'official',catalogBatch:manifest.batch,...(entry.jan?{jan:entry.jan}:{}),...(entry.retailers?{retailers:entry.retailers}:{}),
  originalImageUrl:image,originalLocalImage:local,catalogGroup:series,catalogOrder:seriesOrder,...(entry.imageBounds?{imageBounds:entry.imageBounds}:{}),...(reputation?{reputation}:{})});
}
const updated=[...products,...additions];
await fs.writeFile('data/products.json',JSON.stringify(updated,null,2)+'\n');
const coverage=JSON.parse(await fs.readFile('data/catalog-coverage.json','utf8'));
const expanded=expandProducts(updated);for(const brand of new Set(additions.map(p=>p.brand))){coverage.groups[brand]=Object.fromEntries([...new Set(expanded.filter(p=>p.brand===brand).map(p=>p.series))].map(s=>[s,expanded.filter(p=>p.brand===brand&&p.series===s).length]));}
coverage.total=expanded.length;coverage.expansions=[...(coverage.expansions||[]),{batch:manifest.batch,checkedAt:manifest.checkedAt,added:additions.length}].filter((x,i,a)=>a.findIndex(y=>y.batch===x.batch)===i);
await fs.writeFile('data/catalog-coverage.json',JSON.stringify(coverage,null,2)+'\n');
console.log(`Added ${additions.length}; total ${expanded.length}`);
