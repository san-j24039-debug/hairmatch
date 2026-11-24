// Apply a human-reviewed changeset: {reviewedAt, changes:[{id, status, replacementId, price, volume}]}.
import fs from 'node:fs/promises';import {expandProducts} from '../js/catalog.js';
const file=process.argv[2];if(!file)throw Error('Usage: node scripts/review-product-updates.mjs reviewed-changes.json');
const change=JSON.parse(await fs.readFile(file)),products=JSON.parse(await fs.readFile('data/products.json'));
if(!/^\d{4}-\d{2}-\d{2}$/.test(change.reviewedAt))throw Error('reviewedAt required');
const ids=new Set(expandProducts(products).map(p=>p.id));
if(change.reviewedSourceHashes)for(const [url,hash]of Object.entries(change.reviewedSourceHashes))if(!/^https:\/\//.test(url)||!/^[a-f0-9]{64}$/.test(hash))throw Error('Invalid source hash');
for(const c of change.changes){if(!ids.has(c.id)||!['active','renewed','discontinued'].includes(c.status))throw Error('Invalid product/status '+c.id);if(c.replacementId&&!ids.has(c.replacementId))throw Error('Unknown replacement');if(c.price!==undefined&&c.price!==null&&!(typeof c.price==='number'&&c.price>0))throw Error('Invalid price');if(c.volume!==undefined&&c.volume!==null&&typeof c.volume!=='string')throw Error('Invalid volume');}
for(const c of change.changes){let p=products.find(p=>p.id===c.id);if(!p){const parent=products.find(p=>['shampoo','treatment'].some(k=>p.id+'-'+k===c.id));const kind=c.id.endsWith('-shampoo')?'shampoo':'treatment';const expanded=expandProducts([parent]).find(p=>p.id===c.id);products.splice(products.indexOf(parent),1,...expandProducts([parent]));p=products.find(p=>p.id===expanded.id);}
 p.lifecycle={status:c.status,replacementId:c.replacementId||null,reviewedAt:change.reviewedAt};p.checkedAt=change.reviewedAt;const item=p[p.kind];if(c.price!==undefined)item.price=c.price;if(c.volume!==undefined)item.volume=c.volume;item.verifiedAt=change.reviewedAt;
}
await fs.writeFile('data/products.json',JSON.stringify(products,null,2)+'\n');console.log('Reviewed',change.changes.length);
// Only explicitly reviewed source URLs become comparison baselines.
if(change.reviewedSourceHashes){let baseline={};try{baseline=JSON.parse(await fs.readFile('data/source-baselines.json'));}catch{}for(const [url,hash]of Object.entries(change.reviewedSourceHashes)){if(!/^https:\/\//.test(url)||!/^[a-f0-9]{64}$/.test(hash))throw Error('Invalid source hash');baseline[url]=hash;}await fs.writeFile('data/source-baselines.json',JSON.stringify(baseline,null,2)+'\n');}
