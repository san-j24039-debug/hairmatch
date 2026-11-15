import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {expandProducts,sortCatalog} from '../js/catalog.js';
import {filterProducts} from '../js/products.js';
import {reputationHTML,sourcesHTML} from '../js/ui.js';
const products=expandProducts(JSON.parse(fs.readFileSync(new URL('../data/products.json',import.meta.url))));
const batch=JSON.parse(fs.readFileSync(new URL('../data/catalog-additions-2026-11.json',import.meta.url)));
test('11月追加80商品は市販67・サロン13で、公式出典と単品画像を持つ',()=>{
 const added=products.filter(p=>p.catalogBatch===batch.batch);
 assert.equal(added.length,80);assert.equal(added.filter(p=>p.category==='drugstore').length,67);assert.equal(added.filter(p=>p.category==='salon').length,13);
 for(const fact of batch.products){const p=added.find(p=>p.id===fact.id);assert.ok(p,fact.id);assert.equal(p[p.kind].sourceUrl,fact.sourceUrl);assert.equal(p[p.kind].price,fact.price);assert.equal(p[p.kind].volume,fact.volume);assert.equal(p.originalImageUrl,fact.image);assert.equal(p.images.length,1);assert.equal(p[p.kind==='shampoo'?'treatment':'shampoo'],null);assert.equal(p.scoreStatus,'demo');assert.ok(fs.existsSync(new URL('../'+p.image,import.meta.url)));}
});
test('追加ブランドは名前検索・種類切替で到達でき、シリーズ内の順番を維持',()=>{
 for(const brand of new Set(batch.products.map(p=>p.brand))){const all=sortCatalog(filterProducts(products,{brand}));assert.equal(all.length,batch.products.filter(p=>p.brand===brand).length);for(const p of all){assert.ok(filterProducts(products,{q:p.name,kind:p.kind}).some(x=>x.id===p.id));assert.ok(!filterProducts(products,{brand,kind:p.kind==='shampoo'?'treatment':'shampoo'}).some(x=>x.id===p.id));}}
});
test('口コミは確認日と出典を表示し、未確認価格を捏造しない',()=>{
 const p=products.find(p=>p.id==='lebel-399');assert.match(sourcesHTML(p),/2016/);assert.match(sourcesHTML(p),/公式商品情報/);assert.match(reputationHTML(p),/相性スコアとは別/);assert.equal(reputationHTML({...p,reputation:{url:'javascript:alert(1)'}}),'');
 const unknown=products.filter(p=>p.catalogBatch===batch.batch&&p[p.kind].price===null);assert.ok(unknown.length);for(const p of unknown)assert.ok(!filterProducts([p],{price:'10000'}).length);
});
