import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {expandProducts,migrateCollections} from '../js/catalog.js';
import {filterProducts,productView} from '../js/products.js';
import {rankProducts,resultGroups,scoreProduct} from '../js/diagnosis.js';
import {toggleId} from '../js/favorites.js';
const series=JSON.parse(fs.readFileSync(new URL('../data/products.json',import.meta.url)));
const products=expandProducts(series);
test('全商品が単品のID・価格・画像を持つ',()=>{
 assert.ok(products.length>=126);assert.equal(new Set(products.map(p=>p.id)).size,products.length);
 for(const p of products){assert.ok(p[p.kind]);assert.equal(p.images.length,1);assert.equal(p[p.kind==='shampoo'?'treatment':'shampoo'],null);assert.equal(productView(p,'both').id,p.id);assert.equal(productView(p,p.kind==='shampoo'?'treatment':'shampoo').image,p.image);}
 assert.equal(filterProducts(products,{kind:'both'}).length,products.length);
 assert.equal(filterProducts(products,{kind:'shampoo'}).length,products.filter(p=>p.kind==='shampoo').length);
 assert.equal(filterProducts(products,{kind:'treatment'}).length,products.filter(p=>p.kind==='treatment').length);
 assert.equal(filterProducts(products,{price:'5000'}).some(p=>p.id==='kerastase-treatment'),false);
 assert.equal(filterProducts(products,{price:'5000'}).some(p=>p.id==='kerastase-shampoo'),true);
});
test('メロウのシャンプーとリポアのトリートメントを独立保存・削除できる',()=>{
 let ids=toggleId([],'plus-mellow-shampoo');ids=toggleId(ids,'plus-repair-treatment');
 assert.deepEqual(ids,['plus-mellow-shampoo','plus-repair-treatment']);
 assert.deepEqual(toggleId(ids,'plus-mellow-shampoo'),['plus-repair-treatment']);
 assert.deepEqual(migrateCollections(ids,ids,products).favorites,ids);
});
test('両方の診断でも商品種類ごとに採点し、各TOP5を返す',()=>{
 const a={target:'both',budget:'any',foam:'かなり重要',squeak:'絶対に嫌',rinse:'かなり滑らか'};
 const ranked=rankProducts(products,a);assert.equal(ranked.length,products.filter(p=>p.diagnosisEligible!==false).length);
 for(const r of ranked){assert.equal(r.parts.some(p=>p.key==='foam'),r.product.kind==='shampoo');assert.equal(r.parts.some(p=>p.key==='rinse'),r.product.kind==='treatment');}
 const groups=resultGroups(ranked);assert.equal(groups.length,2);
 for(const g of groups){assert.equal(g.main.length,5);assert.ok(g.main.every(r=>r.product.kind===g.kind));}
 const treatment=products.find(p=>p.id==='plus-repair-treatment');
 assert.equal(scoreProduct(treatment,a).score,scoreProduct(treatment,{...a,foam:'気にしない',squeak:'気にしない'}).score);
});
test('旧保存IDを単品へ移行し、比較の超過分もお気に入りで保持する',()=>{
 const first=migrateCollections(['plus-mellow'],['plus-mellow','plus-repair','cota7'],products);
 assert.equal(first.compare.length,3);assert.ok(first.overflow);
 for(const id of ['plus-mellow-shampoo','plus-mellow-treatment','plus-repair-shampoo','plus-repair-treatment','cota7-shampoo','cota7-treatment'])assert.ok([...first.favorites,...first.compare].includes(id));
 const second=migrateCollections(first.favorites,first.compare,products);assert.equal(second.changed,false);
});
