'use strict';
/* Quick Answer: encrypted, user-initiated backup of settings only. */
(()=>{
  const ALLOWED = new Set([
    'apiKey','apiKey2','apiKey3','groqKey','groqKey2','groqKey3',
    'lunaToken','provider','model','mode','reasoning','quality','cacheEnabled',
    'diagnostics','rememberType','groqFallback','context','qaDailyLimits', 'language','theme'
  ]);
  const FLAG = 'edge-quick-answer-secure-backup';
  const ITERATIONS = 310000;
  const enc = new TextEncoder(), dec = new TextDecoder();
  const $ = name => document.getElementById(name);
  const bt = key => QA_I18N.t(key);
  const text = (message, error=false) => {
    const el=$('backupResult'); el.textContent=message;
    el.style.color=error?'#ffb9b9':'#a9ead1';
  };
  const bytesToB64 = bytes => {
    let binary=''; for (const b of bytes) binary+=String.fromCharCode(b);
    return btoa(binary);
  };
  const b64ToBytes = base64 => {
    if (typeof base64!=='string'||base64.length>1500000) throw new Error(bt('backupBadFile'));
    return Uint8Array.from(atob(base64),x=>x.charCodeAt(0));
  };
  const derive = async (password,salt)=>{
    const seed=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:ITERATIONS,hash:'SHA-256'},seed,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  };
  function clean(obj){
    if(!obj||Array.isArray(obj)||typeof obj!=='object') throw new Error(bt('backupNoSettings'));
    const out={};
    for(const [key,value] of Object.entries(obj)){
      if(!ALLOWED.has(key)) continue;
      if (key==='qaDailyLimits') {
        if(!value||Array.isArray(value)||typeof value!=='object') continue;
        const safe={};
        for(const [m,n] of Object.entries(value).slice(0,50)){
          if(m.length>100)continue;
          if(n===null||(Number.isSafeInteger(n)&&n>=0&&n<=1000000))safe[m]=n;
        }
        out[key]=safe;
      } else if (key==='quality'){
        if(Number.isInteger(value)&&value>=40&&value<=100)out[key]=value;
      } else if (['groqFallback','cacheEnabled','diagnostics','rememberType','context'].includes(key)){
        if(typeof value==='boolean')out[key]=value;
      } else if(typeof value==='string'&&value.length<=4096){
        out[key]=value;
      }
    }
    if(!Object.keys(out).length)throw new Error(bt('backupNoSupported'));
    return out;
  }
  async function exportBackup(){
    if (typeof window.qaPrepareBackup==='function') await window.qaPrepareBackup();
    const password=$('backupPassword').value;
    if(password.length<12) throw new Error(bt('backupPasswordShort'));
    if(password!==$('backupConfirm').value)throw new Error(bt('backupPasswordMismatch'));
    const stored=await chrome.storage.local.get([...ALLOWED]);
    const settings=clean(stored);
    const salt=crypto.getRandomValues(new Uint8Array(16));
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const key=await derive(password,salt);
    const plain=enc.encode(JSON.stringify({kind:'edge-quick-answer-settings',version:2,settings}));
    const data=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,plain));
    const document={kind:FLAG,version:2,kdf:'PBKDF2-SHA256',iterations:ITERATIONS,cipher:'AES-256-GCM',salt:bytesToB64(salt),iv:bytesToB64(iv),data:bytesToB64(data)};
    const name=`QuickAnswer-ENCRYPTED-Backup-${new Date().toISOString().slice(0,10)}.json`;
    const url=URL.createObjectURL(new Blob([JSON.stringify(document,null,2)],{type:'application/json'}));
    try{
      const link=documentCreateLink(url,name);
      link.click();link.remove();
      text(bt('backupExported'));
    } finally {setTimeout(()=>URL.revokeObjectURL(url),30000);$('backupPassword').value='';$('backupConfirm').value='';}
  }
  function documentCreateLink(url,name){
    const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);return a;
  }
  async function importBackup(file){
    if(!file) return;
    if(file.size>1024*1024)throw new Error(bt('backupTooLarge'));
    const pass=$('backupPassword').value;
    if(!pass) throw new Error(bt('backupEnterPassword'));
    const backup=JSON.parse(await file.text());
    if(backup.kind!==FLAG||backup.version!==2||backup.cipher!=='AES-256-GCM'||backup.kdf!=='PBKDF2-SHA256'||backup.iterations!==ITERATIONS){
      throw new Error(bt('backupInvalidFormat'));
    }
    const salt=b64ToBytes(backup.salt),iv=b64ToBytes(backup.iv),data=b64ToBytes(backup.data);
    if(salt.length!==16||iv.length!==12||data.length<17)throw new Error(bt('backupDamaged'));
    const key=await derive(pass,salt);
    let plaintext;
    try {plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,data);}
    catch {throw new Error(bt('backupWrongPassword'));}
    const payload=JSON.parse(dec.decode(plaintext));
    if(payload.kind!=='edge-quick-answer-settings'||payload.version!==2) throw new Error(bt('backupUnknown'));
    const settings=clean(payload.settings);
    const existing=await chrome.storage.local.get([...ALLOWED]);
    const hasExisting = ['groqKey','apiKey','groqKey2','apiKey2'].some(k=>!!existing[k]);
    if(hasExisting&&!confirm(bt('backupConfirmOverwrite')))return;
    await chrome.storage.local.set(settings);
    if(typeof window.qaAfterImport==='function') await window.qaAfterImport();
    text(bt('backupRestored'));
    $('backupPassword').value='';$('backupConfirm').value='';
  }
  $('export').addEventListener('click',async()=>{
    $('export').disabled=true;text(bt('backupEncrypting'));
    try{await exportBackup();}catch(e){text(bt('backupExportError')+': '+e.message,true);}
    finally{$('export').disabled=false;}
  });
  $('import').addEventListener('click',()=>{$('importFile').value='';$('importFile').click();});
  $('importFile').addEventListener('change',async e=>{
    $('import').disabled=true;text(bt('backupImporting'));
    try{await importBackup(e.target.files[0]);}catch(err){text(bt('backupImportError')+': '+err.message,true);}
    finally{$('import').disabled=false;}
  });
  // Simple test seam without exposing any keys.
  if(typeof globalThis.__QA_TEST__!=='undefined')globalThis.__QA_TEST__={clean,derive,bytesToB64,b64ToBytes};
})();
