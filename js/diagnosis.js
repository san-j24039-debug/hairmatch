export const labels={manageable:'まとまり',soft:'柔らかさ',smooth:'滑らかさ',silky:'サラサラ',moist:'しっとり',lowSqueak:'キシみにくさ',curlyHair:'くせ・うねり',damageRepair:'ダメージ補修',fragrance:'香り相性',cost:'コスト',coarseHair:'剛毛適性',fineHair:'細毛適性',antiFrizz:'広がりを抑える',light:'軽い仕上がり',shine:'ツヤ',fingerComb:'指通り',foam:'泡立ち',scalpDry:'乾燥した頭皮との相性',scalpOily:'皮脂が多い頭皮との相性',scalpSensitive:'敏感な頭皮との相性',scalpFlakes:'フケが気になる頭皮との相性',rinse:'すすいだ後の滑らかさ',weight:'仕上がりの重さ'};
import {unitPrice,hasKind} from './products.js';
export function scoreProduct(p,a) {
 a={...a,target:p.kind||a.target};
 const parts=[];const add=(key,weight,value=p.scores[key])=>{if(weight>0&&Number.isFinite(value))parts.push({key,label:labels[key]||key,weight,value});};
 add('manageable',2);add('soft',2);add('smooth',1.5);
 if(a.thickness==='細い')add('fineHair',3);if(a.thickness==='太い')add('coarseHair',3);
 if(['硬い','かなり硬い・剛毛'].includes(a.hardness))add('coarseHair',a.hardness==='硬い'?3:5);
 if(a.hardness==='柔らかい')add('fineHair',2);
 add('curlyHair',{'少しうねる':1,'うねりがある':3,'強いくせ毛':5}[a.curl]||0);
 add('antiFrizz',{'普通':1,'広がりやすい':3,'かなり広がりやすい':5}[a.spread]||0);
 const damage=Math.max(0,...(a.damage||[]).map(x=>({'少しダメージ':1,'カラー':2,'頻繁なカラー':3,'ブリーチ':5,'アイロン・コテを頻繁に使用':3,'かなり傷んでいる':5}[x]||0)));add('damageRepair',damage);
 const scalp={'乾燥しやすい':'scalpDry','皮脂が多い':'scalpOily','敏感':'scalpSensitive','フケが気になる':'scalpFlakes'}[a.scalp];if(scalp)add(scalp,3);
 for(const key of a.finish||[])add(key,key===a.priority?8:2);
 if(a.target!=='treatment')add('lowSqueak',{'絶対に嫌':8,'ほとんど無い方がいい':5,'少しなら許容できる':2}[a.squeak]||0);
 const rinse={'かなり滑らか':100,'滑らか':85,'普通':65,'少しさっぱり':35}[a.rinse];if(a.target!=='shampoo'&&rinse!==undefined)add('rinse',3,100-Math.abs(p.scores.rinse-rinse));
 const weight={'かなり軽い':0,'軽め':25,'普通':50,'しっとり':75,'かなりしっとり':100}[a.weight];if(weight!==undefined)add('weight',3,100-Math.abs(p.scores.weight-weight));
 if(a.target!=='treatment')add('foam',{'かなり重要':3,'ある程度重要':1}[a.foam]||0);
 const chosen=(a.scents||[]).filter(x=>x!=='any');let fragrance=null;
 if(chosen.length&&p.fragrance.type.length)fragrance=40+60*chosen.filter(x=>p.fragrance.type.includes(x)).length/chosen.length;
 if(a.strength&&a.strength!=='any'&&p.fragrance.strength){const v=100-Math.abs(['weak','medium','strong'].indexOf(a.strength)-['weak','medium','strong'].indexOf(p.fragrance.strength))*40;fragrance=fragrance===null?v:(fragrance*2+v)/3;}
 if(fragrance!==null)add('fragrance',3,fragrance);
 const price=unitPrice(p,a.target||'both');const budget=a.budget&&a.budget!=='any'?Number(a.budget):null;const cost=price===null?null:budget?Math.max(0,100-(Math.max(0,price-budget)/budget)*100):100;
 if(budget&&cost!==null)add('cost',2,cost);
 const total=parts.reduce((s,x)=>s+x.weight,0);const score=Math.round(parts.reduce((s,x)=>s+x.weight*x.value,0)/total);
 const reasons=[...parts].sort((x,y)=>y.weight*y.value-x.weight*x.value).filter((x,i,arr)=>arr.findIndex(v=>v.key===x.key)===i).slice(0,3).map(x=>`${x.key===a.priority?'一番重視した「':'ご希望の「'}${x.label}」は、検証用の評価で${Math.round(x.value)}点。${x.value>=80?'好みに近い傾向です。':'ほかの条件とのバランスで選ばれています。'}`);
 return {product:p,score,parts,reasons,metrics:{...p.scores,fragrance:fragrance===null?null:Math.round(fragrance),cost:cost===null?null:Math.round(cost)},budgetStatus:price===null?'unknown':budget&&price>budget?'over':'within'};
}
export function rankProducts(products,a) {return products.filter(p=>p.diagnosisEligible!==false&&(!a.category||a.category==='both'||p.category===a.category)&&hasKind(p,a.target||'both')).map(p=>scoreProduct(p,a)).sort((a,b)=>b.score-a.score||a.product.id.localeCompare(b.product.id));}
export function splitResults(ranked) {return {main:ranked.filter(x=>x.budgetStatus!=='over').slice(0,5),over:ranked.filter(x=>x.budgetStatus==='over').slice(0,3)};}
export function resultGroups(ranked) {
 if(ranked.some(r=>!r.product.kind))return [{kind:'legacy',...splitResults(ranked)}];
 return ['shampoo','treatment'].filter(kind=>ranked.some(r=>r.product.kind===kind))
   .map(kind=>({kind,...splitResults(ranked.filter(r=>r.product.kind===kind))}));
}
export function bestResult(ranked){return resultGroups(ranked).flatMap(g=>g.main)[0]||ranked[0];}
