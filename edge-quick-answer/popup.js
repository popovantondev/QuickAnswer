'use strict';
const $=id=>document.getElementById(id);
const START={provider:'auto',mode:'auto',reasoning:'balanced'};
const t=key=>QA_I18N.t(key);
let readyLocale=false;

function status(message,kind=''){const el=$('status');el.textContent=message;el.className='status-line '+kind;}
async function recommendedDefaults(){
 const {qaV152DefaultsApplied=false}=await chrome.storage.local.get('qaV152DefaultsApplied');
 if(!qaV152DefaultsApplied)await chrome.storage.local.set({...START,rememberType:true,cacheEnabled:true,qaV152DefaultsApplied:true});
}
async function init(){
 await QA_I18N.init(); readyLocale=true;
 await recommendedDefaults();
 const saved=await chrome.storage.local.get(Object.keys(START));
 for(const [id,value] of Object.entries(START)) $(id).value=saved[id]||value;
 status(t('ready'),'good');
 await recentFailure();
 // Do not wait for counters or shortcut lookup to make popup usable.
 void refreshStats();void refreshShortcuts();
}
async function refreshStats(){try{
 const {qaUsage={}}=await chrome.storage.local.get('qaUsage');
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const get=n=>parts.find(x=>x.type===n)?.value;
 const day=`${get('year')}-${get('month')}-${get('day')}`;
 const list=qaUsage.day===day?Object.values(qaUsage.models||{}):[];
 const requests=list.reduce((n,x)=>n+(x.requests||0),0);
 const ms=list.map(x=>x.lastResponseMs).filter(Number.isFinite).at(-1);
 $('stats').textContent=t('metric')+`: ${requests} · ${t('time')}: ${ms===undefined?'—':(ms/1000).toFixed(1)+' s'}`;
}catch(_){$('stats').textContent=t('statsUnavailable');}}
async function refreshShortcuts(){try{const all=await chrome.commands.getAll();const four=['qa-dom-153','qa-shot-153','qa-mode-153','qa-region-153'];const n=all.filter(x=>four.includes(x.name)&&!!x.shortcut).length;$('shortcuts').textContent=(n===4?`${t('shortcuts')}: ${n}/4`:`⚠ ${t('shortcuts')}: ${n}/4`);if(n<4)status(t('missingShortcuts'),'bad');}catch(_){$('shortcuts').textContent='Клавиши';}}
for(const name of Object.keys(START)){$(name).addEventListener('change',async()=>{try{await chrome.storage.local.set({[name]:$(name).value});status(t('saved'),'good');}catch(e){status('Ошибка сохранения: '+e.message,'bad');}});}
async function recentFailure(){
  try {
    const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
    const {lastStatus}=await chrome.storage.session.get('lastStatus');
    if (tab?.id && lastStatus?.tabId===tab.id && lastStatus.kind==='error' && Date.now()-lastStatus.at<180000) {
      status(lastStatus.text,'bad');
    }
  } catch (_) {}
}
async function currentTab(){const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!tab?.id)throw new Error('Нет активной вкладки');return tab.id;}
async function run(action){
 try {
   status(t('starting'));
   const tabId=await currentTab();
   const response=await chrome.runtime.sendMessage({type:'QA_RUN',action,tabId});
   if(!response?.ok)throw new Error(response?.error||'Не удалось запустить');
   // For a region: close only once the overlay has actually appeared.
   // For text/screenshot: close only after the injected overlay confirms startup.
   window.close();
 } catch(e) {status(String(e?.message||e),'bad');}
}
for(const id of ['dom','shot','region','retry'])$(id).addEventListener('click',()=>void run(id));
$('settingsTop').addEventListener('click',()=>chrome.tabs.create({url:chrome.runtime.getURL('settings.html')}));
$('settings').addEventListener('click',()=>chrome.tabs.create({url:chrome.runtime.getURL('settings.html')}));
$('desktop').addEventListener('click',async()=>{await chrome.tabs.create({url:chrome.runtime.getURL('capture.html')});window.close();});
$('shortcuts').addEventListener('click',()=>chrome.tabs.create({url:'edge://extensions/shortcuts'}));
document.querySelectorAll('[data-lang]').forEach(btn=>btn.addEventListener('click',async()=>{await QA_I18N.set(btn.dataset.lang);status(t('ready'),'good');void refreshStats();void refreshShortcuts();}));
init().catch(e=>status(t('loadError')+': '+e.message,'bad'));
