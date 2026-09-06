import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const profile=path.resolve('.tmp/browser-profile-'+Date.now());await mkdir(profile,{recursive:true});await mkdir('test-results',{recursive:true});
const child=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-allow-origins=*','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
let socket;
try {
 let port;for(let i=0;i<60;i++){try{port=(await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break;}catch{await new Promise(r=>setTimeout(r,200));}}
 if(!port)throw new Error('Chrome headless did not start');
 const targets=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
 let sequence=0;const pending=new Map();const errors=[];
 socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(new Error(m.error.message));else p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout: '+method));},15000);pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v)},reject:e=>{clearTimeout(timer);reject(e)}});socket.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
 const wait=async expression=>{for(let i=0;i<80;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,75));}throw new Error('Timed out: '+expression);};
 const click=async selector=>{assert.ok(await evaluate(`!!document.querySelector(${JSON.stringify(selector)})`),'Missing '+selector);await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);};
 const snap=async name=>{const image=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(`test-results/${name}.png`,Buffer.from(image.data,'base64'));};
 await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await send('Page.navigate',{url:'http://127.0.0.1:4173'});await wait(`!!document.querySelector('[data-action="start"]')`);await snap('mobile-home');
 await click('[data-action="start"]');await wait(`!!document.querySelector('[data-key="category"]')`);assert.equal(await evaluate(`document.querySelector('[data-action="next"]').disabled`),true);
 const answers=[{target:'both',category:'both'},{thickness:'太い',hardness:'かなり硬い・剛毛',curl:'強いくせ毛',spread:'かなり広がりやすい'},{damage:'ブリーチ',scalp:'乾燥しやすい'},{finish:'soft'},{squeak:'絶対に嫌',rinse:'かなり滑らか',weight:'しっとり',foam:'かなり重要'},{scents:'rose',strength:'medium'},{budget:'any'}];
 for(let i=0;i<answers.length;i++){for(const [key,value] of Object.entries(answers[i]))await click(`[data-key="${key}"][data-value="${value}"]`);if(i===3)await snap('mobile-finish');assert.equal(await evaluate(`document.querySelector('[data-action="next"]').disabled`),false);await click('[data-action="next"]');}
 await snap('mobile-review');await click('[data-action="next"]');await wait(`!!document.querySelector('.results-page')`);assert.equal(await evaluate(`document.querySelectorAll('.results-grid .product-card').length`),10);await snap('mobile-results');
 await click('.winner [data-action="favorite"]');await click('.winner .product-name');await wait(`!!document.querySelector('.detail-page')`);await snap('mobile-detail');
 await evaluate(`location.hash='search'`);await wait(`!!document.querySelector('#search-input')`);for(let i=0;i<4;i++)await click(`.product-card:nth-child(${i+1}) [data-action="compare"]`);assert.match(await evaluate(`document.querySelector('#toast').textContent`),/最大3件/);
 await evaluate(`location.hash='compare'`);await wait(`!!document.querySelector('table')`);assert.equal(await evaluate(`document.querySelectorAll('thead th').length`),4);await snap('mobile-compare');
 await evaluate(`location.hash='favorites'`);await wait(`!!document.querySelector('.product-card')`);await send('Page.reload');await wait(`!!document.querySelector('.product-card')`);assert.equal(await evaluate(`document.querySelectorAll('.product-card').length`),1);await snap('mobile-favorites');
 await evaluate(`location.hash='search'`);await wait(`!!document.querySelector('#search-input')`);await evaluate(`var input=document.querySelector('#search-input');input.value='COTA';input.dispatchEvent(new Event('input',{bubbles:true}));`);assert.equal(await evaluate(`document.querySelectorAll('.product-card').length`),4);

 // Saved collection and historical snapshots must work without replacing the current answers.
 assert.deepEqual(await evaluate(`[...document.querySelectorAll('#nav a span')].map(x=>x.textContent)`),['ホーム','診断','商品検索','保存','マイページ']);
 await evaluate(`location.hash='saved'`);await wait(`!!document.querySelector('.saved-page')`);assert.equal(await evaluate(`document.querySelector('#nav [aria-current]').getAttribute('href')`),'#saved');await snap('mobile-saved');
 await click('.saved-tabs a[href="#compare"]');await wait(`!!document.querySelector('table')`);assert.equal(await evaluate(`document.querySelector('#nav [aria-current]').getAttribute('href')`),'#saved');
 await evaluate(`location.hash='mypage'`);await wait(`!!document.querySelector('.mypage')`);assert.equal(await evaluate(`document.querySelectorAll('.history-card').length`),1);await snap('mobile-mypage');
 const firstLink=await evaluate(`document.querySelector('.history-preview').getAttribute('href')`);const firstScore=await evaluate(`document.querySelector('.history-preview .match b').textContent`);
 await click('.history-preview');await wait(`!!document.querySelector('.history-answers')`);assert.equal(await evaluate(`document.querySelector('.winner .match b').textContent`),firstScore);
 await click('[data-action="reuse-history"]');await wait(`!!document.querySelector('.review-list')`);await click('[data-action="edit-step"][data-index="1"]');await click('[data-key="thickness"][data-value="細い"]');await click('[data-key="hardness"][data-value="柔らかい"]');
 for(let i=0;i<7;i++){if(await evaluate(`location.hash==='#results'`))break;await click('[data-action="next"]');}await wait(`location.hash==='#results'`);
 await evaluate(`location.hash='mypage'`);await wait(`document.querySelectorAll('.history-card').length===2`);await send('Page.reload');await wait(`document.querySelectorAll('.history-card').length===2`);
 await evaluate(`location.hash=${JSON.stringify(firstLink)}`);await wait(`!!document.querySelector('.history-answers')`);assert.equal(await evaluate(`document.querySelector('.winner .match b').textContent`),firstScore);assert.match(await evaluate(`document.querySelector('.history-answers').textContent`),/太い/);
 await click('.winner .product-name');await wait(`!!document.querySelector('.detail-page')`);assert.match(await evaluate(`document.querySelector('.detail-page').textContent`),/保存した診断時/);await click('.page-top a');await wait(`!!document.querySelector('.history-answers')`);await snap('mobile-history');
 await evaluate(`location.hash='mypage'`);await wait(`!!document.querySelector('.mypage')`);await snap('mobile-mypage');
 for(const route of ['home','diagnosis','results','search','favorites','compare','saved','mypage','detail/cota7']){await evaluate(`location.hash=${JSON.stringify(route)}`);await new Promise(r=>setTimeout(r,120));assert.equal(await evaluate(`document.documentElement.scrollWidth>window.innerWidth`),false,'Overflow on '+route);}
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});await evaluate(`location.hash='home'`);await wait(`!!document.querySelector('.home')`);await snap('desktop-home');await evaluate(`location.hash='results'`);await wait(`!!document.querySelector('.results-page')`);await snap('desktop-results');
 await evaluate(`location.hash='mypage'`);await wait(`!!document.querySelector('.mypage')`);await snap('desktop-mypage');
 // Product-kind navigation must switch images and facts without losing saved IDs.
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await evaluate(`location.hash='search'`);await wait(`!!document.querySelector('#search-input')`);
 await click('[data-action="reset-filters"]');
 await evaluate(`location.hash='compare'`);await wait(`!!document.querySelector('table')`);await click('[data-action="clear-compare"]');
 await evaluate(`location.hash='search'`);await wait(`!!document.querySelector('#search-input')`);
 for(const id of ['plus-mellow-shampoo','plus-repair-treatment']){
  await click('[data-action="favorite"][data-id="'+id+'"]');await click('[data-action="compare"][data-id="'+id+'"]');
 }
 assert.equal(await evaluate(`document.querySelector('[data-action="favorite"][data-id="plus-mellow-treatment"]').getAttribute('aria-pressed')`),'false');
 for(const page of ['search','saved','compare']){
  await evaluate(`location.hash=${JSON.stringify(page)}`);await wait(`!!document.querySelector('.kind-tabs')`);
  for(const kind of ['shampoo','treatment','both']){
   await click(`[data-action="view-kind"][data-value="${kind}"]`);
   const images=await evaluate(`[...document.querySelectorAll('.product-photo')].map(p=>p.querySelectorAll('img').length)`);
   assert.ok(images.length>0);assert.ok(images.every(n=>n===1),page+' '+kind);
   assert.equal(await evaluate(`document.documentElement.scrollWidth>innerWidth`),false);
   if(kind==='both'&&page==='compare'){
    assert.equal(await evaluate(`document.querySelectorAll('thead th').length`),3);
    assert.match(await evaluate(`document.querySelector('thead').textContent`),/メロウ シャンプー/);
    assert.match(await evaluate(`document.querySelector('thead').textContent`),/リポア トリートメント/);
    assert.ok(await evaluate(`(()=>{const table=document.querySelector('.table-scroll');return table.scrollWidth<=table.clientWidth+1;})()`),'Two items should fit side by side on mobile');
    await snap('mobile-mixed-comparison');
   }
  }
 }
 await evaluate(`location.hash='search'`);await wait(`!!document.querySelector('.kind-tabs')`);
 await click('[data-action="view-kind"][data-value="treatment"]');await send('Page.reload');await wait(`!!document.querySelector('.kind-tabs')`);
 assert.equal(await evaluate(`document.querySelector('.kind-tabs .active').dataset.value`),'treatment');
 await click('.product-name');await wait(`!!document.querySelector('.detail-page')`);
 assert.equal(await evaluate(`document.querySelectorAll('.price-row').length`),1);
 assert.match(await evaluate(`document.querySelector('.price-row').textContent`),/トリートメント/);
 await snap('mobile-treatment-detail');
 await evaluate(`location.hash='mypage'`);await wait(`!!document.querySelector('.mypage')`);await click('[data-action="restart"]');
 await click('[data-key="target"][data-value="treatment"]');await click('[data-key="category"][data-value="both"]');await click('[data-action="next"]');
 const treatmentAnswers=answers.slice(1);treatmentAnswers[3]={rinse:'かなり滑らか',weight:'しっとり'};
 for(const values of treatmentAnswers){for(const [key,value] of Object.entries(values))await click(`[data-key="${key}"][data-value="${value}"]`);await click('[data-action="next"]');}
 await click('[data-action="next"]');await wait(`!!document.querySelector('.results-page')`);
 assert.equal(await evaluate(`document.querySelector('.result-heading h1').textContent`),'あなたにおすすめのトリートメント');
 assert.ok(await evaluate(`[...document.querySelectorAll('.product-photo')].every(p=>p.querySelectorAll('img').length===1)`));
 await wait(`Array.from(document.images).every(i=>i.complete)`);
 assert.ok(await evaluate(`[...document.images].every(i=>i.naturalWidth>0)`));
 await snap('mobile-treatment-results');
 // Upgrade a pre-item catalog without losing saved products or rewriting old history.
 await evaluate(`localStorage.setItem('hairmatch:favorites',JSON.stringify(['plus-mellow']));localStorage.setItem('hairmatch:compare',JSON.stringify(['plus-mellow','plus-repair','cota7']));localStorage.setItem('hairmatch:viewKind',JSON.stringify('both'));location.hash='saved';`);
 await send('Page.reload');await wait(`!!document.querySelector('.saved-page')`);
 const migrated=await evaluate(`({favorites:JSON.parse(localStorage.getItem('hairmatch:favorites')),compare:JSON.parse(localStorage.getItem('hairmatch:compare'))})`);
 assert.equal(migrated.compare.length,3);assert.ok(migrated.favorites.includes('cota7-treatment'));
 assert.match(await evaluate(`document.querySelector('.saved-page').textContent`),/残りはお気に入りに保存/);
 await click('[data-action="favorite"][data-id="plus-mellow-shampoo"]');
 await send('Page.reload');await wait(`!!document.querySelector('.saved-page')`);
 assert.equal(await evaluate(`!!document.querySelector('[data-product-id="plus-mellow-shampoo"]')`),false);
 assert.equal(await evaluate(`!!document.querySelector('[data-product-id="plus-mellow-treatment"]')`),true);
 assert.deepEqual(errors,[]);console.log('PASS: individual products, mixed-series favorites/comparison, diagnosis, history, legacy collection migration, treatment-only diagnosis and mobile layout; no browser exceptions.');
 await send('Browser.close');
}finally{socket?.close();child.kill();}

