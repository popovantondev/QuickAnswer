import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import assert from 'node:assert/strict';
const code=fs.readFileSync(new URL('../edge-quick-answer/background.js',import.meta.url),'utf8');
const local={provider:'groq',groqKey:'gsk_mock_test_key',mode:'test',qaV152DefaultsApplied:true};const session={};const tabs={id:7,url:'https://quiz.example.test/test',windowId:1};
const commands={}; const api={}; const display=[];let injectionFailure=false;let injectCount=0;let lastCrop=null;
const storage={
 local:{get: async keys=>get(local,keys),set:async value=>Object.assign(local,value),remove:async keys=>keys.forEach(k=>delete local[k])},
 session:{get:async keys=>get(session,keys),set:async value=>Object.assign(session,value),remove:async keys=>{for(const k of (Array.isArray(keys)?keys:[keys])) delete session[k]}}
};
function get(data,keys){if(!keys)return {...data};if(typeof keys==='string')return {[keys]:data[keys]};if(Array.isArray(keys))return Object.fromEntries(keys.map(x=>[x,data[x]]));return Object.fromEntries(Object.keys(keys).map(x=>[x,data[x]??keys[x]]));}
const chrome={storage,
 tabs:{query:async()=>[tabs],get:async()=>({...tabs}),sendMessage:async(tabId,msg)=>{if(msg.type==='QA_PING')return {ok:true};if(msg.type==='QA_EXTRACT')return {text:'Question 1 of 40\nWhat does HTML stand for?\n1. Hyper Text Markup Language\n2. Hyperlinks and text\n3. Home Tool',choices:[{number:1,text:'Hyper Text Markup Language'},{number:2,text:'Hyperlinks and text'},{number:3,text:'Home Tool'}],focusRect:{x:50,y:130,width:800,height:370,viewportWidth:1200,viewportHeight:800}};if(msg.type==='QA_SELECT_AREA'){display.push('region');return {ok:true};}if(msg.type==='QA_DISPLAY'){display.push('overlay '+msg.kind);return {ok:true};}if(msg.type==='QA_HIDE')return {ok:true};},captureVisibleTab:async()=> 'data:image/jpeg;base64,ZmFrZQ=='},
 scripting:{executeScript:async()=>{injectCount++;if(injectionFailure)throw Error('Cannot access contents of the page');}},
 action:{setBadgeText:async()=>{},setBadgeBackgroundColor:async()=>{}},
 runtime:{getURL:x=>'chrome-extension://sampleid/'+x,onMessage:{addListener(fn){api.fn=fn;}},sendMessage:async()=>{}},commands:{onCommand:{addListener(fn){commands.fn=fn;}}}};
const ctx=vm.createContext({chrome,console,URL,crypto:webcrypto,Date,Intl,TextEncoder,AbortController,Response,AbortSignal,setTimeout,clearTimeout,fetch:async(url,opts)=>{if(!url.includes('api.groq.com'))throw Error('Unexpected fetch '+url);return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({kind:'choice',answer:'3',selectedText:'Hyper Text Markup Language',explanation:'HTML is markup',pairs:[]})}}],usage:{prompt_tokens:32,completion_tokens:12}}),{status:200,headers:{'Content-Type':'application/json'}});}});
vm.runInContext(code,ctx);
ctx.__mockCrop=(rect)=>{lastCrop=rect;};vm.runInContext(`cropJPEG=async (jpeg,rect)=>{__mockCrop(rect);return jpeg;}`,ctx);
async function send(message,sender={}){return await new Promise((resolve,reject)=>{let done=false;const respond=x=>{done=true;resolve(x)};api.fn(message,sender,respond);setTimeout(()=>!done&&reject(Error('no response from handler')),3000);});}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let a=await send({type:'QA_RUN',action:'dom',tabId:7});assert(a.ok,a.error);await sleep(50);assert.equal(session.lastStatus.kind,'answer');assert.equal(session.lastStatus.text,'1');assert(display.includes('overlay loading'));console.log('PASS: full text request uses current option ordering');
a=await send({type:'QA_RUN',action:'region',tabId:7});assert.equal(a.ok,true,a.error);assert(display.includes('region'));console.log('PASS: region startup confirmed');
a=await send({type:'QA_RUN',action:'shot',tabId:7});assert.equal(a.ok,true,a.error);await sleep(30);assert.equal(session.lastStatus.kind,'answer');assert.equal(session.lastStatus.text,'1');assert.equal(lastCrop?.width,800,'screenshot auto crop must use the detected question bounds');console.log('PASS: screenshot auto crop picks current question at native resolution');console.log('PASS: screenshot request uses current option ordering');
// Known Kahoot hosts must preserve all four color tiles on the full screen.
local.mode='kahoot';tabs.url='https://play.kahoot.it/game';lastCrop=null;
a=await send({type:'QA_RUN',action:'shot',tabId:7});assert.equal(a.ok,true,a.error);await sleep(30);
assert.equal(lastCrop,null,'Kahoot should not crop color tiles');
console.log('PASS Kahoot screenshot is not auto-cropped');
local.mode='test';
// Prevent loading blocked pages from looking like success.
tabs.url='edge://settings';a=await send({type:'QA_RUN',action:'region',tabId:7});assert.equal(a.ok,false);assert.match(a.error,/служебная страница/);console.log('PASS: privileged page reports actionable error');
a=await send({type:'QA_RUN',action:'dom',tabId:7});assert.equal(a.ok,false);await sleep(10);assert.equal(session.lastStatus.kind,'error');console.log('PASS: text on restricted page reports failure instead of silent close');
// Ordinary site with revoked injection permissions must also fail early.
tabs.url='https://quiz.example.test/test';injectionFailure=true;
a=await send({type:'QA_RUN',action:'dom',tabId:7});assert.equal(a.ok,false);assert.match(a.error,/Нет доступа/);console.log('PASS: missing site access is shown in popup');
console.log('ALL MOCK HOTFIX TESTS PASSED');
