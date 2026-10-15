'use strict';
const $=id=>document.getElementById(id);
async function read(){const {qaDebug}=await chrome.storage.session.get('qaDebug');$('meta').textContent=qaDebug?`${qaDebug.source} · ${qaDebug.mode} · ${new Date(qaDebug.at).toLocaleString()} · ${qaDebug.tabUrl||''}`:'Диагностика пуста. Включи галочку в Quick Answer и повтори вопрос.';$('text').textContent=qaDebug?.rawText||'(текст не был получен)';if(qaDebug?.jpeg)$('preview').src=qaDebug.jpeg;else $('preview').removeAttribute('src');}
$('clear').onclick=async()=>{await chrome.storage.session.remove('qaDebug');await read();};read();

QA_I18N.init().catch(()=>{});
