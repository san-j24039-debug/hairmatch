import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHistoryEntry,appendHistory,validHistory,historyDate} from '../js/history.js';
const products=JSON.parse(await readFile(new URL('../data/products.json',import.meta.url),'utf8'));
test('履歴は回答と商品評価のコピーを保持する',()=>{const a={category:'both',finish:['soft'],priority:'soft'};const p=structuredClone(products);const entry=createHistoryEntry(p,a,{id:'one',createdAt:'2026-09-05T03:00:00Z'});const score=entry.ranked[0].score;a.finish.push('light');p[0].scores.soft=0;assert.deepEqual(entry.answers.finish,['soft']);assert.equal(entry.ranked[0].score,score);assert.notEqual(entry.ranked.find(r=>r.product.id===p[0].id).product.scores.soft,0);});
test('履歴は新しい順に30件、既存IDは重複させない',()=>{let history=[];for(let i=0;i<35;i++)history=appendHistory(history,{id:String(i)});assert.equal(history.length,30);assert.equal(history[0].id,'34');assert.equal(history.at(-1).id,'5');history=appendHistory(history,{id:'34'});assert.equal(history.length,30);});
test('旧版の結果に診断日を捏造せず、不正な履歴は無視する',()=>{const e=createHistoryEntry(products,{category:'both'},{createdAt:null,imported:true});assert.equal(historyDate(e),'以前の診断（日付未記録）');assert.equal(validHistory([null,{},e]).length,1);assert.deepEqual(validHistory({}),[]);});
