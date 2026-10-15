'use strict';
const $=id=>document.getElementById(id);
const defaults={language:'ru',theme:'system',apiKey:'',apiKey2:'',apiKey3:'',model:'gemini-3.5-flash-lite',provider:'auto',groqKey:'',groqKey2:'',groqKey3:'',lunaToken:'',mode:'auto',quality:82,cacheEnabled:true,diagnostics:false,rememberType:true,reasoning:'balanced'};
const fields=Object.keys(defaults);
const timers=new Map();let restoring=true;
const t=key=>QA_I18N.t(key);
function status(message,kind=''){const el=$('status');el.textContent=message;el.className='status '+kind;}
function valueOf(el){return el.type==='checkbox'?el.checked:el.type==='range'?Number(el.value):el.value.trim();}
async function flushAll(){const pairs=[...timers];for(const [id,timer] of pairs){clearTimeout(timer);timers.delete(id);await saveField(id);} }
async function saveField(id){try{const value=valueOf($(id));await chrome.storage.local.set({[id]:value});if(id==='theme'){try{localStorage.setItem('qa_theme',String(value));}catch(_){}}status(t('sAutoSaved'),'good');}catch(e){status('Ошибка сохранения: '+e.message,'bad');}}
function scheduleSave(e){if(restoring)return;const id=e.target.id;if(id==='quality')$('qualityLabel').textContent=$('quality').value+'%';$('quality').style.setProperty('--quality-progress',(($('quality').value-55)/40*100)+'%');clearTimeout(timers.get(id));timers.delete(id);if(id==='language')void QA_I18N.set(e.target.value);if(id==='theme')void QA_I18N.theme(e.target.value);if(e.type==='change'||['checkbox-one'].includes(e.target.type))void saveField(id);else timers.set(id,setTimeout(()=>{timers.delete(id);void saveField(id)},380));}
async function recommendedDefaults(){const {qaV152DefaultsApplied=false}=await chrome.storage.local.get('qaV152DefaultsApplied');if(!qaV152DefaultsApplied)await chrome.storage.local.set({provider:'auto',mode:'auto',reasoning:'balanced',rememberType:true,cacheEnabled:true,qaV152DefaultsApplied:true});}
async function restore(){await QA_I18N.init();await recommendedDefaults();const stored=await chrome.storage.local.get(fields);restoring=true;for(const id of fields){const el=$(id);const v=stored[id]??defaults[id];if(el.type==='checkbox')el.checked=!!v;else el.value=v;}try{localStorage.setItem('qa_theme',String(stored.theme??defaults.theme));}catch(_){}$('qualityLabel').textContent=$('quality').value+'%';$('quality').style.setProperty('--quality-progress',(($('quality').value-55)/40*100)+'%');restoring=false; QA_I18N.apply();status(t('sStatusGood'),'good');void usage();}
function pacificDay(ts=Date.now()){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(ts);const f=k=>parts.find(p=>p.type===k)?.value||'00';return `${f('year')}-${f('month')}-${f('day')}`;}
async function usage(){try{const {qaUsage={}}=await chrome.storage.local.get('qaUsage');const current=qaUsage.day===pacificDay()?Object.entries(qaUsage.models||{}):[];const sum=k=>current.reduce((t,[,v])=>t+(v[k]||0),0);$('reqCount').textContent=String(sum('requests'));const ms=current.flatMap(([,v])=>Number.isFinite(v.lastResponseMs)?[v.lastResponseMs]:[]);$('lastTime').textContent=ms.length?(ms.at(-1)/1000).toFixed(1)+' с':'—';$('usageDetail').textContent=`${t('statsSuccess')}: ${sum('success')} · ${t('statsErrors')}: ${sum('errors')} · 429: ${sum('rate429')}`;const groq=qaUsage.models?.['groq:qwen/qwen3.8-27b'];$('quotaRemaining').textContent=Number.isFinite(groq?.remainingRpd)?`Groq: ${groq.remainingRpd} / ${groq.limitRpd||'?'} (${t('statsQuota')}).`:t('statsQuotaUnknown');$('quotaWarning').hidden=!sum('rate429');$('quotaWarning').textContent=sum('rate429')?t('statsLimit'):'';}catch(e){$('usageDetail').textContent=t('statsUnavailableDetail');}}
for(const id of fields){const el=$(id);el.addEventListener('change',scheduleSave);el.addEventListener('input',scheduleSave);if(el.type==='password')el.addEventListener('blur',()=>{if(timers.has(id)){clearTimeout(timers.get(id));timers.delete(id);void saveField(id);}});}
$('debug').addEventListener('click',()=>chrome.tabs.create({url:chrome.runtime.getURL('debug.html')}));
$('resetSite').addEventListener('click',async()=>{try{const [tab]=await chrome.tabs.query({active:true,lastFocusedWindow:true});if(tab?.id){await chrome.storage.session.remove(['qaType_'+tab.id,'qaAnswer_'+tab.id]);status(t('sResetDone'),'good');}else status('Не найдена вкладка теста','bad');}catch(e){status(e.message,'bad');}});
$('shortcuts').addEventListener('click',()=>chrome.tabs.create({url:'edge://extensions/shortcuts'}));
window.qaPrepareBackup=flushAll;
window.qaAfterImport=restore;
restore().catch(e=>status(t('loadError')+': '+e.message,'bad'));


// 1.7.6 navigation: no auto-highlighting on scroll; only explicit clicks switch the active item.
const navLinks=[...document.querySelectorAll('.sidebar nav a[href^="#"]')];
function activateNavigation(link){
  for(const item of navLinks){
    const active=item===link;
    item.classList.toggle('active',active);
    item.setAttribute('aria-current',active?'location':'false');
  }
}
function syncNavigationFromHash(){
  const hash=location.hash||'#settings-general';
  const link=navLinks.find(item=>item.getAttribute('href')===hash)||navLinks[0];
  activateNavigation(link);
}
for(const link of navLinks){
  link.addEventListener('click',()=>activateNavigation(link));
}
window.addEventListener('hashchange',syncNavigationFromHash);
requestAnimationFrame(syncNavigationFromHash);
