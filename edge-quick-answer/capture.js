'use strict';
const $=id=>document.getElementById(id);
const base=$('base'),overlay=$('overlay'),ctx=base.getContext('2d'),fg=overlay.getContext('2d');
let selected=null,begin=null,busy=false;
function status(s){$('status').textContent=s;}
function draw(){fg.clearRect(0,0,overlay.width,overlay.height);if(selected){const r=selected;fg.fillStyle='rgba(39,139,235,.18)';fg.fillRect(r.x,r.y,r.width,r.height);fg.strokeStyle='#38aaff';fg.lineWidth=Math.max(2,base.width/1200);fg.strokeRect(r.x,r.y,r.width,r.height);}}
function coords(e){const r=overlay.getBoundingClientRect();return {x:Math.max(0,Math.min(base.width,Math.round((e.clientX-r.left)*base.width/r.width))),y:Math.max(0,Math.min(base.height,Math.round((e.clientY-r.top)*base.height/r.height)))}};
overlay.addEventListener('pointerdown',e=>{if(!base.width||e.button!==0)return;overlay.setPointerCapture(e.pointerId);begin=coords(e);selected={...begin,width:0,height:0};draw();});
overlay.addEventListener('pointermove',e=>{if(!begin)return;const p=coords(e);selected={x:Math.min(begin.x,p.x),y:Math.min(begin.y,p.y),width:Math.abs(p.x-begin.x),height:Math.abs(p.y-begin.y)};draw();});
overlay.addEventListener('pointerup',e=>{if(begin){const p=coords(e);selected={x:Math.min(begin.x,p.x),y:Math.min(begin.y,p.y),width:Math.abs(p.x-begin.x),height:Math.abs(p.y-begin.y)};begin=null;draw();}});
$('clear').onclick=()=>{selected=null;draw();};
$('choose').onclick=async()=>{
  try{
    if(!navigator.mediaDevices?.getDisplayMedia)throw new Error('В этой версии Edge захват через браузер недоступен.');
    status('Ожидаю, какой экран или окно ты выберешь…');
    const stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:1},audio:false});
    try{
      const video=document.createElement('video');video.muted=true;video.srcObject=stream;await video.play();
      if(!video.videoWidth||!video.videoHeight) await new Promise(r=>setTimeout(r,300));
      if(!video.videoWidth||!video.videoHeight)throw new Error('Не получил видеокадр от выбранного окна.');
      base.width=video.videoWidth;base.height=video.videoHeight;overlay.width=base.width;overlay.height=base.height;
      ctx.drawImage(video,0,0,base.width,base.height);selected=null;draw();
      $('all').disabled=false;$('crop').disabled=false;$('clear').disabled=false;
      status(`Получен кадр ${base.width}×${base.height}. Выдели область мышью или отправь весь снимок.`);
    }finally{for(const track of stream.getTracks())track.stop();}
  }catch(e){status('Захват не удался: '+e.message);}
};
async function solve(crop){
  if(busy||!base.width)return;
  if(crop && (!selected||selected.width<25||selected.height<25)){status('Сначала обведи область мышью.');return;}
  busy=true;$('all').disabled=true;$('crop').disabled=true;
  try{
    const from=crop?selected:{x:0,y:0,width:base.width,height:base.height};
    const c=document.createElement('canvas');c.width=from.width;c.height=from.height;
    c.getContext('2d').drawImage(base,from.x,from.y,from.width,from.height,0,0,from.width,from.height);
    const {quality=82}=await chrome.storage.local.get('quality');
    const jpeg=c.toDataURL('image/jpeg',Number(quality)/100);
    status(`Отправляю JPEG: ${(jpeg.length*0.75/1024).toFixed(0)} КБ. Ожидаю ответ (до 15 с)…`);
    $('result').textContent='Думаю…';$('details').textContent='';
    const res=await chrome.runtime.sendMessage({type:'QA_EXTERNAL',jpeg});
    if(!res?.ok)throw new Error(res?.error||'Запрос не запущен');
  }catch(e){status('Ошибка: '+e.message);$('result').textContent=e.message;}
  finally{busy=false;$('all').disabled=false;$('crop').disabled=false;}
}
$('all').onclick=()=>solve(false);$('crop').onclick=()=>solve(true);
chrome.runtime.onMessage.addListener(msg=>{
  if(msg?.type!=='QA_CAPTURE_DISPLAY')return;
  if(msg.kind==='answer'){
    $('result').textContent=msg.pairs?.length?msg.pairs.map(p=>`${p.item} → ${p.choice}`).join('\n'):msg.text;
    $('details').textContent=[msg.providerLabel,Number.isFinite(msg.elapsedMs)?(msg.elapsedMs/1000).toFixed(1)+' с':'',msg.explanation].filter(Boolean).join(' · ');
    status('Ответ готов.');
  }else if(msg.kind==='error'){status('Ошибка: '+msg.text);$('result').textContent='Ошибка';}
  else if(msg.kind==='loading'){status(msg.text||'Анализирую…');}
});

QA_I18N.init().catch(()=>{});
