import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {chromeSession} from '../scripts/chrome-session.mjs';
const c=await chromeSession(),{send,evaluate}=c;
const base=process.env.HAIRMATCH_TEST_URL||'http://127.0.0.1:4173/';
const wait=async expr=>{for(let i=0;i<100;i++){if(await evaluate(expr))return;await new Promise(r=>setTimeout(r,75));}throw Error('Timeout '+expr);};
const tap=async selector=>{await wait(`!!document.querySelector(${JSON.stringify(selector)})`);await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`);const p=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;return{x,y,hit:e.contains(document.elementFromPoint(x,y))}})()`);assert.ok(p.hit,'Blocked '+selector);await send('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',clickCount:1});};
const action=a=>tap(`[data-action="${a}"]`);
const step=n=>wait(`document.querySelector('.progress-head>div>span')?.textContent==='${n} / 8'`);
const answer=async()=>{await tap('[data-key="target"][data-value="both"]');await tap('[data-key="category"][data-value="both"]');await action('next');await step(2);};
const session=()=>evaluate(`JSON.parse(localStorage.getItem('hairmatch:session'))`);
try{
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await send('Page.navigate',{url:base});await action('start');await step(1);
 assert.equal(await evaluate(`document.querySelector('#auto-draft').checked`),false);await answer();assert.equal(await session(),null);
 await action('close-diagnosis');await wait(`document.querySelector('#draft-dialog').open`);await action('cancel-draft-close');await step(2);
 await action('close-diagnosis');await action('save-draft-close');await wait(`!!document.querySelector('.home')`);await send('Page.reload');await action('resume');await step(2);assert.equal(await evaluate(`document.querySelector('#auto-draft').checked`),false);
 await tap('#nav a[href="#diagnosis"]');await wait(`!!document.querySelector('.diagnosis-start')`);assert.ok(await evaluate(`!!document.querySelector('[data-action="resume"]')`));await action('start');await step(1);assert.equal(await session(),null);assert.equal(await evaluate(`document.querySelector('[data-action="next"]').disabled`),true);
 await tap('#auto-draft');await answer();await send('Page.reload');await step(2);assert.equal((await session()).answers.target,'both');await tap('#auto-draft');assert.equal(await session(),null);await send('Page.reload');await step(1);assert.equal(await evaluate(`document.querySelector('#auto-draft').checked`),false);
 await answer();await action('close-diagnosis');await action('discard-draft-close');await wait(`!!document.querySelector('.home')`);assert.equal(await evaluate(`!!document.querySelector('[data-action="resume"]')`),false);await send('Page.reload');await wait(`!!document.querySelector('.home')`);assert.equal(await session(),null);
 console.log('PASS: default off / save once / resume / start fresh / opt in reload / opt out / discard');
 await action('start');await answer();await action('close-diagnosis');await evaluate(`window.realSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Quota','QuotaExceededError')}`);await action('save-draft-close');assert.equal(await evaluate(`document.querySelector('#draft-dialog').open`),true);await evaluate(`Storage.prototype.setItem=window.realSet`);await action('save-draft-close');await wait(`!!document.querySelector('.home')`);
 await tap('#nav a[href="#search"]');await tap('[data-action="search-brand"][data-value="plus eau"]');assert.equal(await evaluate(`document.querySelectorAll('.product-card').length`),8);
 assert.ok(await evaluate(`document.querySelector('.brand-back').getBoundingClientRect().height>=48`));await tap('[data-action="search-series"][data-value="メルティ"]');await tap('.product-card .product-name');await wait(`!!document.querySelector('.detail-page')`);await tap('.page-top a');await wait(`!!document.querySelector('.series-shortcuts')`);assert.equal(await evaluate(`document.querySelectorAll('.product-card').length`),2);
 await tap('#nav a[href="#saved"]');await tap('#nav a[href="#search"]');await wait(`!!document.querySelector('.brand-grid')`);assert.equal(await evaluate(`document.querySelector('#search-input').value`),'');assert.equal(await evaluate(`window.scrollY`),0);
 await tap('[data-action="search-brand"][data-value="plus eau"]');await action('search-directory');await wait(`!!document.querySelector('.brand-grid')`);assert.equal(await evaluate(`window.scrollY`),0);
 console.log('PASS: save failure retains answers / detail back retains series / search tab resets directory / prominent back');
 await mkdir('test-results',{recursive:true});
 for(const width of [320,390,768,1440]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});await tap('#nav a[href="#diagnosis"]');await wait(`!!document.querySelector('.diagnosis-start')`);assert.equal(await evaluate(`document.documentElement.scrollWidth>innerWidth`),false);await action('resume');await step(2);await action('close-diagnosis');assert.equal(await evaluate(`document.documentElement.scrollWidth>innerWidth`),false);if(width===390)await writeFile('test-results/draft-save-choice.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));await action('cancel-draft-close');}
 assert.deepEqual(c.errors,[]);console.log('PASS: draft entry and dialog at 320–1440px / no browser exceptions');
}finally{c.close();}
