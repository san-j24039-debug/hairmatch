import test from 'node:test';
import assert from 'node:assert/strict';
import {compareHistory,restoreHistory} from '../js/history-tools.js';
const make=(id,answers,score,name='商品A')=>({id,answers,ranked:[{score,product:{id:'a',name},budgetStatus:'within'}]});
test('前回比較は変化した回答だけを表示し、複数選択の順序を無視',()=>{const before=make('a',{thickness:'細い',finish:['soft','smooth']},85);const after=make('b',{thickness:'太い',finish:['smooth','soft']},93);const diff=compareHistory(after,before);assert.equal(diff.changes.length,1);assert.equal(diff.changes[0].before,'細い');assert.equal(diff.best.afterScore,93);assert.equal(diff.scores[0].after-diff.scores[0].before,8);assert.equal(compareHistory(after,null),null);});
test('複数の履歴削除を元の順序で復元する',()=>{const original=['a','b','c'].map(id=>({id}));const after=[original[2]];const restored=restoreHistory(after,[{entry:original[0],index:0},{entry:original[1],index:0}]);assert.deepEqual(restored,original);assert.equal(restoreHistory(original,[{entry:original[1],index:1}]).length,3);});
