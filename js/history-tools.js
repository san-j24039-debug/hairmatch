import {steps,finishes} from './questions.js';
import {bestResult} from './diagnosis.js';
export function compareHistory(current,previous){
 if(!previous)return null;
 const fields=[...steps.flatMap(s=>s.fields),{key:'priority',label:'一番重視するもの',options:finishes}];
 const show=(f,a)=>{const values=Array.isArray(a[f.key])?a[f.key]:[a[f.key]];return values.map(v=>f.options.find(x=>x[0]===v)?.[1]||'未回答').join('・');};
 const normalized=v=>JSON.stringify(Array.isArray(v)?[...v].sort():v??null);
 const changes=fields.filter(f=>normalized(current.answers[f.key])!==normalized(previous.answers[f.key])).map(f=>({label:f.label,before:show(f,previous.answers),after:show(f,current.answers)}));
 const best=e=>bestResult(e.ranked);
 const now=best(current),before=best(previous);
 const scores=current.ranked.filter(r=>previous.ranked.some(p=>p.product.id===r.product.id)).map(r=>({id:r.product.id,name:r.product.name,after:r.score,before:previous.ranked.find(p=>p.product.id===r.product.id).score}));
 return {changes,best:{before:before.product.name,after:now.product.name,beforeScore:before.score,afterScore:now.score},scores};
}
export function restoreHistory(history,deleted){const next=[...history];for(const item of [...deleted].reverse()){if(!next.some(x=>x.id===item.entry.id))next.splice(Math.min(item.index,next.length),0,item.entry);}return next.slice(0,30);}
