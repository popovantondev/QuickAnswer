(() => {
  'use strict';
  // Injected on demand only after clicking the extension or a keyboard command.
  if (window.__EDGE_QUICK_ANSWER_LOADED__) return;
  window.__EDGE_QUICK_ANSWER_LOADED__ = true;

  const rootHost = document.createElement('div');
  rootHost.id = 'edge-quick-answer-layer';
  rootHost.style.cssText = [
    'all:initial', 'position:fixed', 'inset:0', 'z-index:2147483647',
    'pointer-events:none', 'display:block', 'width:100vw', 'height:100vh'
  ].join(';');
  const shadow = rootHost.attachShadow({mode:'closed'});
  const style = document.createElement('style');
  style.textContent = `
    * { box-sizing: border-box; }
    #notices { position: absolute; right: 16px; top: 16px; display:flex; flex-direction:column; align-items:flex-end; gap:8px; pointer-events:none; }
    .toast { pointer-events:auto; max-width: min(370px, calc(100vw - 24px)); min-width: 130px; padding: 9px 32px 9px 12px;
      background: #151e30; color: #f8fafc; border: 1px solid #f58a32; border-radius: 13px; position:relative;
      box-shadow: 0 10px 32px rgba(0,0,0,.32); font-family:system-ui,Segoe UI,Arial,sans-serif;
      font-size: 14px; line-height:1.47; overflow-wrap:anywhere; }
    .toast.loading { background:#202b38; border-color:#d68a4b; }
    .toast.error { background:#80272c; border-color:#b93e49; font-size:14px; }
    .toast.info { background:#17455b; border-color:#3a8f91; }
    .toast.answer { font-size:21px; font-weight:800; min-width:125px; text-align:center; border-color:#f58a32; }
    .toast.answer.red { background: #c12c34; }
    .toast.answer.blue { background: #1766c2; }
    .toast.answer.yellow { background: #b18a00; color:white; }
    .toast.answer.green { background: #19814d; }
    .toast.answer.matching { width: min(370px, calc(100vw - 24px)); max-height:min(55vh,420px);overflow-y:auto; text-align:left;font-size:15px; font-weight:500; }
    .title {font-size:13px;color:#ffb679;font-weight:650;margin:0 0 7px;}
    .match-item {padding:8px 0;border-top:1px solid #ffffff22;font-size:14px;line-height:1.4;font-weight:520;}
    .match-item b {color:#ffb679;font-weight:800;margin-right:4px;}
    .explanation {font-size:13.5px;font-weight:450;color:#dbe7fc;line-height:1.4;text-align:left;margin-top:8px;padding-top:8px;border-top:1px solid #ffffff33;}

    .close { position:absolute;right:8px;top:6px;background:transparent;border:none;color:inherit;
      font-size:20px;line-height:24px;cursor:pointer;opacity:.85;padding:0 5px; }
    .close:hover{ opacity:1; }
    .small { font-size:12px;font-weight:500; opacity:.84; margin-top:4px; }
    .answerRow { display:flex; gap:5px; justify-content:center; flex-wrap:wrap; }
    .chip { display:inline-block; border-radius:7px; padding:7px 8px; font-size:14px; color:white; }
    .red.chip { background:#c12c34; } .blue.chip{ background:#1766c2; }
    .yellow.chip { background:#b18a00; } .green.chip { background:#19814d; }
    #selector { display:none; position:absolute;inset:0; pointer-events:auto; cursor:crosshair;
      background:rgba(10,25,50,.12);font-family:system-ui,Segoe UI,sans-serif; touch-action:none; }
    #selector.show {display:block;}
    #hint {position:absolute;top:20px;left:50%; transform:translateX(-50%);background:#13243b;
      color:white; padding:10px 14px; border-radius:10px; white-space:nowrap;font-size:13px;pointer-events:none; }
    #rect { display:none;position:absolute; border:2px solid #ff8a1f; background:rgba(255,138,31,.12);
      box-shadow:0 0 0 200vmax rgba(7,17,30,.20);pointer-events:none; }
  `;
  shadow.appendChild(style);
  const notices = document.createElement('div'); notices.id = 'notices';
  const selector = document.createElement('div'); selector.id = 'selector';
  const hint = document.createElement('div'); hint.id = 'hint';
  let uiLanguage='ru';
  const userCopy={ru:{hint:'Выдели вопрос и ответы мышью · Esc — отмена',matching:'СОПОСТАВЛЕНИЕ',close:'Закрыть',maybe:'может ошибаться'},de:{hint:'Frage und Antworten markieren · Esc — abbrechen',matching:'ZUORDNUNG',close:'Schließen',maybe:'kann falsch sein'},en:{hint:'Select question and answers · Esc to cancel',matching:'MATCHING',close:'Close',maybe:'may be wrong'}};
  chrome.storage.local.get('language').then(o=>{uiLanguage=['ru','de','en'].includes(o.language)?o.language:'ru';hint.textContent=userCopy[uiLanguage].hint;}).catch(()=>{});
  hint.textContent = userCopy.ru.hint;
  const selectionRect = document.createElement('div'); selectionRect.id = 'rect';
  selector.append(hint, selectionRect);
  shadow.append(notices, selector);
  (document.documentElement || document.body).appendChild(rootHost);

  let cleanupTimer = null;
  let activeSelection = false;
  let selectionCleanup = () => {};

  function hide() {
    clearTimeout(cleanupTimer);
    notices.replaceChildren();
  }
  function putText(node, s) { node.textContent = String(s ?? ''); }

  function display(message) {
    hide();
    const toast = document.createElement('div');
    toast.className = `toast ${['answer','error','loading','info'].includes(message.kind) ? message.kind : 'info'}`;
    const answer = String(message.text || '');
    if (message.kind === 'answer') {
      const pairs = Array.isArray(message.pairs) ? message.pairs.slice(0,16) : [];
      if (message.mode === 'kahoot' && answer !== 'НЕВИДНО') {
        const names = ['КРАСНЫЙ','СИНИЙ','ЖЁЛТЫЙ','ЗЕЛЁНЫЙ'];
        const cls = ['red','blue','yellow','green'];
        const values = answer.split(',').map(s=>s.trim()).filter(x=>names.includes(x));
        if (values.length === 1) toast.classList.add(cls[names.indexOf(values[0])]);
        if (values.length > 1) {
          const row = document.createElement('div'); row.className = 'answerRow';
          for (const val of values) {
            const chip = document.createElement('span');
            chip.className = 'chip ' + cls[names.indexOf(val)];
            chip.textContent = val;
            row.appendChild(chip);
          }
          toast.appendChild(row);
        } else {
          const val = document.createElement('div'); putText(val, values[0] || answer);
          toast.appendChild(val);
        }
      } else if (message.mode !== 'kahoot' && pairs.length) {
        toast.classList.add('matching');
        const heading = document.createElement('div'); heading.className = 'title';
        putText(heading,userCopy[uiLanguage].matching); toast.appendChild(heading);
        for (const p of pairs) {
          const row = document.createElement('div'); row.className = 'match-item';
          const first = document.createElement('b'); putText(first, `${String(p.item || '').slice(0,35)} →`);
          const second = document.createElement('span'); putText(second, String(p.choice||'').slice(0,180));
          row.append(first,second); toast.appendChild(row);
        }
      } else {
        const val = document.createElement('div'); putText(val, answer);
        toast.appendChild(val);
      }
      if (message.mode !== 'kahoot') {
        if (message.explanation) {
          const reason = document.createElement('div'); reason.className = 'explanation';
          putText(reason, String(message.explanation).slice(0,140)); toast.appendChild(reason);
        }
        if (Number.isFinite(message.elapsedMs)) {
          const ms = document.createElement('div'); ms.className = 'small';
          putText(ms, `${(message.elapsedMs / 1000).toFixed(1)} с · ${message.providerLabel || "ИИ"} · может ошибаться`);
          toast.appendChild(ms);
        }
      }
    } else {
      const line = document.createElement('div'); putText(line, answer);
      toast.appendChild(line);
    }
    const close = document.createElement('button');
    close.className = 'close'; close.setAttribute('aria-label',userCopy[uiLanguage].close);
    close.textContent = '×'; close.addEventListener('click', hide);
    toast.appendChild(close);
    notices.appendChild(toast);
    if (message.kind !== 'loading') cleanupTimer = setTimeout(hide, message.kind === 'answer' ? 13500 : 6500);
  }

  // Question focus is computed entirely from the current rendered viewport.
  // Do not guess a rectangle if the answer controls are missing/ambiguous.
  function getQuestionFocus(area = null) {
    if (area) return null; // Manual region selection always has priority.
    const inputs=[...document.querySelectorAll('input[type="radio"],input[type="checkbox"],[role="radio"],[role="checkbox"]')];
    const visible=inputs.filter(el=>{
      const r=el.getBoundingClientRect(),css=getComputedStyle(el);
      return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth&&css.display!=='none'&&css.visibility!=='hidden';
    });
    const groups=new Map();
    for(const ctl of visible) {
      const isInput=ctl.tagName==='INPUT';
      const group= isInput && ctl.name ? `${ctl.type}:${ctl.name}` :
        `${isInput?ctl.type:ctl.getAttribute('role')}:${ctl.closest('fieldset,[role="radiogroup"],.answer,.answers,.options,.que,form')?.getAttribute('id')||'visible'}`;
      if(!groups.has(group))groups.set(group,[]);
      groups.get(group).push(ctl);
    }
    let chosen=[...groups.values()].filter(g=>g.length>=2).sort((a,b)=>{
      const measure=g=>{
        const rs=g.map(c=>c.getBoundingClientRect());
        const y=(Math.min(...rs.map(r=>r.top))+Math.max(...rs.map(r=>r.bottom)))/2;
        // Prefer one nearby, currently-visible question, not an unrelated form.
        return g.length*100-Math.abs(y-innerHeight*.53)/5;
      };
      return measure(b)-measure(a);
    })[0];
    if(!chosen) return null;
    const rs=chosen.map(c=>c.getBoundingClientRect());
    let left=Math.min(...rs.map(r=>r.left)), right=Math.max(...rs.map(r=>r.right));
    let top=Math.min(...rs.map(r=>r.top)), bottom=Math.max(...rs.map(r=>r.bottom));
    // A native radio dot can be only 16 px wide. Include its entire answer row.
    for(const ctl of chosen){
      let cur=ctl.parentElement;
      for(let n=0;cur && n<5;n++,cur=cur.parentElement){
        const groupCount=cur.querySelectorAll('input[type="radio"],input[type="checkbox"],[role="radio"],[role="checkbox"]').length;
        const r=cur.getBoundingClientRect();
        if(groupCount===1 && r.width>24 && r.height>12 && r.height<180){
          left=Math.min(left,r.left);right=Math.max(right,r.right);
          top=Math.min(top,r.top);bottom=Math.max(bottom,r.bottom);
          if(r.width>120)break;
        }
      }
    }
    // Look upwards for the question prompt and optionally its Question N marker.
    let promptTop=top;
    let promptLeft=left;
    let promptRight=right;
    const nearby=[];
    const walker=document.createTreeWalker(document.body||document.documentElement,NodeFilter.SHOW_TEXT);
    let node,seen=0;
    while((node=walker.nextNode()) && seen++<6500){
      const el=node.parentElement;
      if(!el || el.closest('header,nav,aside,footer,script,style,noscript,[hidden],[aria-hidden="true"],#edge-quick-answer-layer'))continue;
      const str=(node.nodeValue||'').replace(/\s+/g,' ').trim();
      if(!str || str.length>350)continue;
      const r=el.getBoundingClientRect();
      if(r.height<=0||r.width<=0||r.bottom<top-300||r.top>=top||r.right<left-100||r.left>right+100)continue;
      const css=getComputedStyle(el);
      if(css.display==='none'||css.visibility==='hidden')continue;
      if((r.top>top-280) && (str.length>11||/Question\s*\d+|Frage\s*\d+|Вопрос\s*\d+/i.test(str)))nearby.push({text:str,r});
    }
    // Exclude the unrelated H1 and site nav by accepting only nearby prompt lines.
    const questionMarker=nearby.filter(x=>/(?:Question\s*\d+\s*(?:of\s*\d+)?|Frage\s*\d+|Вопрос\s*\d+)/i.test(x.text)).sort((a,b)=>b.r.top-a.r.top)[0];
    const likelyPrompt=nearby.filter(x=> x.r.bottom>=top-190 && (/[?？]$/.test(x.text)|| /(?:choose|which|what|who|correct|ordne|zuord|выберите|укажи|найди|wähle|welch)/i.test(x.text))).sort((a,b)=>b.r.top-a.r.top)[0];
    const target=questionMarker||likelyPrompt;
    if(target){
      promptTop=target.r.top;
      promptLeft=Math.min(promptLeft,target.r.left);
      promptRight=Math.max(promptRight,target.r.right);
    } else {
      promptTop=Math.max(0,top-155);
    }
    const x=Math.max(0,Math.floor(Math.min(left,promptLeft)-19));
    const y=Math.max(0,Math.floor(promptTop-18));
    const x2=Math.min(innerWidth,Math.ceil(Math.max(right,promptRight)+19));
    const y2=Math.min(innerHeight,Math.ceil(bottom+24));
    if(x2-x<180||y2-y<85)return null;
    // Never crop if it saves almost no area or might truncate an off-screen choice.
    const croppedArea=(x2-x)*(y2-y);
    if(croppedArea>innerWidth*innerHeight*.92)return null;
    if(rs.some(r=>r.top<0||r.bottom>innerHeight))return null;
    return {x,y,width:x2-x,height:y2-y,viewportWidth:innerWidth,viewportHeight:innerHeight,confidence:'radio-options',options:chosen.length};
  }

  function visibleTextInRect(rect) {
    const lines=[],used=new Set();
    const walker=document.createTreeWalker(document.body||document.documentElement,NodeFilter.SHOW_TEXT);
    let node,count=0;
    while((node=walker.nextNode()) && count++<6500 && lines.length<90){
      const el=node.parentElement;
      if(!el||el.closest('header,nav,aside,footer,script,style,noscript,template,[hidden],[aria-hidden="true"],#edge-quick-answer-layer'))continue;
      const txt=(node.nodeValue||'').replace(/\s+/g,' ').trim();
      if(!txt||used.has(txt))continue;
      const r=el.getBoundingClientRect();
      if(r.width<1||r.height<1||r.right<rect.x||r.left>rect.x+rect.width||r.bottom<rect.y||r.top>rect.y+rect.height)continue;
      const css=getComputedStyle(el);
      if(css.display==='none'||css.visibility==='hidden'||css.opacity==='0')continue;
      lines.push({text:txt.slice(0,700),top:r.top,left:r.left});used.add(txt);
    }
    lines.sort((a,b)=>Math.abs(a.top-b.top)>4?a.top-b.top:a.left-b.left);
    return lines.map(x=>x.text).join('\n').slice(0,7000);
  }

  function getVisibleText(area = null) {
    // Rect coordinates are viewport CSS pixels. Ignore all other visible quiz questions.
    const focusRect=getQuestionFocus(area);
    const targetArea=area || focusRect;
    function inside(rect) {
      if (!targetArea) return true;
      return rect.right > targetArea.x && rect.left < targetArea.x + targetArea.width &&
        rect.bottom > targetArea.y && rect.top < targetArea.y + targetArea.height;
    }
    const selection = area ? '' : String(window.getSelection()?.toString() || '').trim().slice(0, 3500);
    const parts = [];
    const walker = document.createTreeWalker(document.body || document.documentElement,
      NodeFilter.SHOW_TEXT);
    let node; let count = 0; let size = 0;
    while ((node = walker.nextNode()) && count < 5000 && size < 10000) {
      count++;
      const el = node.parentElement;
      if (!el || el.closest('script,style,noscript,template,nav,footer,aside,[hidden],[aria-hidden="true"]')) continue;
      const str = node.nodeValue.replace(/\s+/g, ' ').trim();
      if (!str) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1 || rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > innerWidth || !inside(rect)) continue;
      const css = getComputedStyle(el);
      if (css.visibility === 'hidden' || css.display === 'none' || css.opacity === '0') continue;
      const clipped = str.slice(0, 900);
      parts.push(clipped); size += clipped.length + 1;
    }
    // Screen readers and quiz UI sometimes put text only in aria-label or alt attributes.
    const alts = [];
    for (const el of document.querySelectorAll('img[alt],button[aria-label],[role="radio"][aria-label]')) {
      if (alts.length >= 35) break;
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1 || rect.bottom < 0 || rect.top > innerHeight || !inside(rect)) continue;
      const label = (el.getAttribute('alt') || el.getAttribute('aria-label') || '').trim();
      if (label && label.length < 250) alts.push(label);
    }
    // Native <select> option text is available in the DOM even when menu is closed.
    // Needed for Moodle matching questions: Ordne zu / Zuordnung.
    const dropdowns = [];
    for (const sel of document.querySelectorAll('select')) {
      if (dropdowns.length >= 18) break;
      const r = sel.getBoundingClientRect();
      if (r.width < 1 || r.height < 1 || r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth || !inside(r)) continue;
      const st = getComputedStyle(sel);
      if (st.visibility === 'hidden' || st.display === 'none') continue;
      const label = String(sel.labels?.[0]?.innerText || sel.getAttribute('aria-label') ||
        sel.parentElement?.parentElement?.innerText || '').replace(/\s+/g,' ').trim().slice(0,210);
      const selected = sel.selectedOptions?.[0]?.textContent?.trim() || '';
      const options = Array.from(sel.options).map(o=>o.textContent.trim()).filter(Boolean).slice(0,40);
      dropdowns.push(`ВЫПАДАЮЩИЙ СПИСОК ${dropdowns.length+1}: контекст=${label}; выбран=${selected}; варианты=[${options.join(' | ')}]`);
    }
    // Give every unlabeled choice a stable numeric index in top-to-bottom DOM order.
    // Extract radio/checkbox choices from the ACTUAL rendered document. Order by
    // viewport top/left, never by stale model knowledge or alphabetical labels.
    const choices=[];
    const nodes=[...document.querySelectorAll('input[type="radio"],input[type="checkbox"],[role="radio"],[role="checkbox"]')].filter(ctl=>{
      if(!focusRect)return true;
      const r=ctl.getBoundingClientRect();
      return r.top>=focusRect.y && r.bottom<=focusRect.y+focusRect.height &&
        r.left>=focusRect.x && r.right<=focusRect.x+focusRect.width;
    });
    for (const ctl of nodes) {
      if (choices.length>=32) break;
      const r=ctl.getBoundingClientRect();
      if (r.bottom<0||r.top>innerHeight||r.left>innerWidth||r.right<0||!inside(r))continue;
      if (getComputedStyle(ctl).visibility==='hidden')continue;
      const labels=ctl.labels?[...ctl.labels].map(x=>x.innerText||x.textContent):[];
      let caption=labels.join(' ').trim()||ctl.closest('label')?.innerText?.trim()||'';
      // Many quiz websites render a custom-looking radio button in a large row.
      // Find the closest row whose text is just one choice, not the whole quiz.
      if (!caption || caption.length>230) {
        let ancestor=ctl.parentElement;
        for (let hops=0;ancestor&&hops<5;hops++,ancestor=ancestor.parentElement) {
          const text=(ancestor.innerText||ancestor.textContent||'').replace(/\s+/g,' ').trim();
          const groupCount=ancestor.querySelectorAll('input[type="radio"],input[type="checkbox"],[role="radio"],[role="checkbox"]').length;
          if (text.length>=2&&text.length<=230&&groupCount<=1) {caption=text;break;}
        }
      }
      if (!caption)caption=ctl.getAttribute('aria-label')||'';
      caption=caption.replace(/\s+/g,' ').trim().slice(0,230);
      if (!caption || choices.some(v=>v.text===caption))continue;
      choices.push({text:caption,top:r.top,left:r.left});
    }
    choices.sort((a,b)=>Math.abs(a.top-b.top)>5?a.top-b.top:a.left-b.left);
    const numbered=choices.map(({text},i)=>({number:i+1,text}));
    const prefix = selection ? `ВЫДЕЛЕННЫЙ ТЕКСТ:\n${selection}\n\n` : '';
    const focusedText=focusRect ? visibleTextInRect(focusRect) : '';
    const pageText=focusedText || parts.join('\n').slice(0,10000);
    const title = document.title?.slice(0, 140) || '';
    return {choices:numbered,focusRect, text: `${prefix}${area ? 'ТОЛЬКО ВЫДЕЛЕННАЯ ОБЛАСТЬ\n' : ''}ЗАГОЛОВОК: ${title}\nВИДИМЫЙ ТЕКСТ:\n${pageText}\n${numbered.length ? 'ВАРИАНТЫ В ТЕКУЩЕМ ПОРЯДКЕ НА СТРАНИЦЕ:\n' + numbered.map(v=>v.number+'. '+v.text).join('\n') : ''}\n${alts.length ? 'ПОДПИСИ ЭЛЕМЕНТОВ:\n' + alts.join('\n') : ''}\n${dropdowns.length ? 'ВАРИАНТЫ ВЫПАДАЮЩИХ СПИСКОВ:\n' + dropdowns.join('\n') : ''}`};
  }

  function beginAreaSelect() {
    if (activeSelection) selectionCleanup();
    hide();
    activeSelection = true;
    // Previous version let the page intercept pointer events in some layouts.
    // Explicitly activate the overlay and attach capture listeners to the window.
    rootHost.style.pointerEvents = 'auto';
    selector.classList.add('show');
    selectionRect.style.display = 'none';
    let start = null;
    let box = null;
    let pointerId = null;
    const beforeSelect = document.documentElement.style.userSelect;
    document.documentElement.style.userSelect = 'none';
    let expiry = null;
    const consume = e => { e.preventDefault(); e.stopImmediatePropagation(); };
    function updateRect(a, b) {
      const left = Math.max(0,Math.min(a.x,b.x)), top = Math.max(0,Math.min(a.y,b.y));
      const right = Math.min(innerWidth, Math.max(a.x,b.x));
      const bottom = Math.min(innerHeight, Math.max(a.y,b.y));
      box = {x:left,y:top,width:Math.max(0,right-left),height:Math.max(0,bottom-top)};
      Object.assign(selectionRect.style, {
        display: 'block', left: `${left}px`, top: `${top}px`,
        width: `${box.width}px`, height: `${box.height}px`
      });
    }
    function down(e) {
      if (!activeSelection || e.button !== 0 || start) return;
      consume(e);
      pointerId = e.pointerId;
      start = {x:e.clientX,y:e.clientY};
      updateRect(start,start);
    }
    function move(e) {
      if (!start || e.pointerId !== pointerId) return;
      consume(e);
      updateRect(start, {x:e.clientX,y:e.clientY});
    }
    function up(e) {
      if (!start || e.pointerId !== pointerId) return;
      consume(e);
      updateRect(start, {x:e.clientX,y:e.clientY});
      const chosen = box;
      // Keep the overlay for the final synthetic click, to avoid clicking an answer
      // underneath it. Remove it on the next frame, then capture on another frame.
      requestAnimationFrame(() => {
        selectionCleanup();
        if (!chosen || chosen.width < 24 || chosen.height < 24) {
          display({kind:'info',text:'Зажми левую кнопку мыши и обведи вопрос вместе с вариантами.'});
          return;
        }
        requestAnimationFrame(async () => {
          try {
            const response = await chrome.runtime.sendMessage({type:'QA_REGION_DONE',rect:{...chosen,
              viewportWidth:innerWidth,viewportHeight:innerHeight}});
            if (!response?.ok) throw new Error(response?.error || 'Запуск не удался');
          } catch (err) {
            display({kind:'error',text:`Не удалось сделать снимок области: ${err.message}`});
          }
        });
      });
    }
    function cancel() {
      selectionCleanup();
      display({kind:'info',text:'Выделение отменено.'});
    }
    function key(e) {
      if (e.key !== 'Escape') return;
      consume(e); cancel();
    }
    function mouseClick(e) {
      // Prevent page clicks while the overlay is active (also for release click).
      if (activeSelection) consume(e);
    }
    selectionCleanup = () => {
      clearTimeout(expiry);
      for (const name of ['pointerdown','pointermove','pointerup','pointercancel','click']) {
        window.removeEventListener(name, name==='pointerdown' ? down : name==='pointermove' ? move :
          name==='pointerup' ? up : name==='pointercancel' ? cancel : mouseClick, true);
      }
      window.removeEventListener('keydown',key,true);
      selector.classList.remove('show');
      selectionRect.style.display = 'none';
      rootHost.style.pointerEvents = 'none';
      document.documentElement.style.userSelect = beforeSelect;
      activeSelection = false;
      start = null;
    };
    window.addEventListener('pointerdown',down,true);
    window.addEventListener('pointermove',move,true);
    window.addEventListener('pointerup',up,true);
    window.addEventListener('pointercancel',cancel,true);
    window.addEventListener('click',mouseClick,true);
    window.addEventListener('keydown',key,true);
    expiry = setTimeout(cancel, 60000);
  }

  chrome.runtime.onMessage.addListener((message, _sender, reply) => {
    if (message?.type === 'QA_PING') {
      reply({ok:true});
    } else if (message?.type === 'QA_EXTRACT') {
      reply(getVisibleText(message.rect || null));
    } else if (message?.type === 'QA_DISPLAY') {
      display(message); reply({ok:true});
    } else if (message?.type === 'QA_HIDE') {
      if (activeSelection) selectionCleanup();
      hide();
      requestAnimationFrame(() => requestAnimationFrame(() => reply({ok:true})));
      return true;
    } else if (message?.type === 'QA_SELECT_AREA') {
      beginAreaSelect(); reply({ok:true});
    }
  });
})();
