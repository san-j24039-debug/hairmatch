import {rankProducts} from './diagnosis.js';
export function createHistoryEntry(products,answers,{id=crypto.randomUUID(),createdAt=new Date().toISOString(),imported=false}={}) {
 return structuredClone({id,createdAt,imported,version:1,answers,ranked:rankProducts(products,answers)});
}
export function appendHistory(history,entry){return [entry,...history.filter(item=>item.id!==entry.id)].slice(0,30);}
export function validHistory(value){return Array.isArray(value)?value.filter(x=>x&&typeof x.id==='string'&&x.answers&&typeof x.answers==='object'&&Array.isArray(x.ranked)&&x.ranked.length&&x.ranked.every(r=>r.product?.id&&r.metrics&&Array.isArray(r.reasons)&&Array.isArray(r.parts)&&Number.isFinite(r.score))).slice(0,30):[];}
export function historyDate(entry){return entry.createdAt&&Number.isFinite(Date.parse(entry.createdAt))?new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(entry.createdAt)):'以前の診断（日付未記録）';}
