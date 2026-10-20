// Quick Answer S04 static and source-integrity release validation (no network/API calls).
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),ext=path.join(root,'edge-quick-answer');
let count=0;
function check(ok,message){if(!ok)throw new Error(`FAIL ${message}`);++count;console.log('PASS',message);}
const text=(p)=>fs.readFileSync(p,'utf8');
const present=(p)=>fs.existsSync(p)&&fs.statSync(p).isFile();
const manifest=JSON.parse(text(path.join(ext,'manifest.json')));
check(manifest.manifest_version===3,'valid Manifest V3');
check(manifest.version==='1.7.8','Edge version 1.7.8');
check(manifest.action?.default_popup==='popup.html','popup entry unchanged');
const expected=['qa-dom-153','qa-shot-153','qa-mode-153','qa-region-153'];
const mapped=['Ctrl+Shift+1','Ctrl+Shift+2','Ctrl+Shift+3','Ctrl+Shift+4'];
const assigned=Object.entries(manifest.commands||{}).filter(([k,v])=>v.suggested_key);
check(assigned.length===4,'Edge allowed maximum of 4 suggested shortcuts');
for(let i=0;i<4;i++)check(manifest.commands[expected[i]]?.suggested_key?.windows===mapped[i],`preserved shortcut ${expected[i]}`);
check(manifest.host_permissions?.includes('https://api.groq.com/*'),'Groq backend unchanged');
check(manifest.host_permissions?.includes('https://generativelanguage.googleapis.com/*'),'Gemini backend unchanged');
for(const sz of [16,32,48,128])check(fs.statSync(path.join(ext,`icons/icon${sz}.png`)).size>200,`icon ${sz}px`);
check(text(path.join(ext,'icons/quickanswer.svg')).match(/#ff8a1f|#ff861c|#ffac36/i),'orange source icon');
const ids={
 popup:['provider','mode','reasoning','status','stats','settingsTop','settings','dom','shot','region','desktop','retry','shortcuts'],
 settings:['language','theme','provider','mode','reasoning','status','apiKey','apiKey2','apiKey3','groqKey','groqKey2','groqKey3','lunaToken','quality','qualityLabel','rememberType','cacheEnabled','diagnostics','reqCount','lastTime','usageDetail','quotaRemaining','quotaWarning','model','debug','resetSite','shortcuts','backupPassword','backupConfirm','export','import','importFile','backupResult']
};
for(const [name,required] of Object.entries(ids)){
 const html=text(path.join(ext,`${name}.html`));
 for(const id of required)check(new RegExp(`\\bid="${id}"`).test(html),`${name} working control: ${id}`);
 check(html.includes('popup.css')||html.includes('settings.css'),`${name} stylesheet`);
}
for(const page of ['popup','settings','capture','debug']){
 const html=text(path.join(ext,`${page}.html`));
 for(const href of [...html.matchAll(/(?:href|src)="([^"#]+)"/g)].map(m=>m[1])){
  if(!href.includes(':')&&!href.startsWith('data:'))check(present(path.join(ext,href)),`local asset ${page}: ${href}`);
 }
}
const loc=text(path.join(ext,'i18n.js')); const match=loc.match(/const catalogs=(\{[\s\S]*?\});\r?\n let current/);
check(Boolean(match),'runtime i18n catalog parse');
const translations=JSON.parse(match[1]);
const langs=['ru','de','en']; const sourceKeys=Object.keys(translations.ru).sort();
for(const lang of langs){
 check(JSON.stringify(Object.keys(translations[lang]||{}).sort())===JSON.stringify(sourceKeys),`${lang} language-key parity`);
 check(sourceKeys.every(k=>typeof translations[lang][k]==='string'&&translations[lang][k].trim().length>0),`${lang} nonempty translations`);
 for(const p of [`docs/index-${lang}.html`,`docs/Guide-${lang}.html`,`docs/assets/screenshots/popup-${lang}.png`])check(present(path.join(root,p)),`${lang}: ${p}`);
}
for(const file of ['docs/index.html','docs/assets/site.css','docs/assets/app-icon.png','DESIGN_FREEZE.md','AGENTS.md','CHANGELOG.md','README.md','roadmap.md','current_task.md','docs/RELEASE.md','docs/VERIFICATION.md','docs/RIGHTS.md','docs/design/approved-popup-concept.png','docs/design/approved-settings-concept.png','docs/design/approved-site-concept.png'])check(present(path.join(root,file)),`project asset ${file}`);
check(text(path.join(root,'DESIGN_FREEZE.md')).includes('Orange Pulse'),'design freeze documented');
check(text(path.join(ext,'popup.css')).includes('--accent: #ff8a1f'),'popup orange design token');
check(text(path.join(ext,'settings.css')).includes('--orange:#ff8a1f'),'settings orange design token');
check(text(path.join(root,'docs/assets/site.css')).includes('--accent:#ff8a1f'),'site orange design token');
for(const file of [...fs.readdirSync(ext).filter(x=>x.endsWith('.js')).map(x=>path.join(ext,x)),path.join(ext,'companion/luna-bridge.js'),path.join(root,'docs/assets/site.js')]){
 const run=spawnSync('node',['--check',file],{encoding:'utf8'});
 check(run.status===0,`JS syntax ${path.relative(root,file)}`);
}
const secretFiles=fs.readdirSync(ext).filter(x=>/\.(js|html|json|css)$/.test(x)).map(x=>path.join(ext,x));
secretFiles.push(path.join(ext,'companion/luna-bridge.js'));
for(const file of secretFiles){const s=text(file);check(!/gsk_[a-zA-Z0-9]{25,}|AIza[a-zA-Z0-9_-]{30,}/.test(s),`no embedded provider keys: ${path.basename(file)}`);}
check(!manifest.permissions.includes('debugger'),'no added debugger permission');
console.log(`ALL PASSED: ${count} source/static checks. Edge/Windows live testing still required.`);
