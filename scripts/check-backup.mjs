import fs from 'node:fs';import vm from 'node:vm';import {webcrypto} from 'node:crypto';
const js=fs.readFileSync(new URL('../edge-quick-answer/backup.js',import.meta.url),'utf8');
const fakeEl=()=>({value:'',style:{},addEventListener(){}});
const context={__QA_TEST__:{},document:{getElementById:()=>fakeEl()},crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,Array,Object,Number,Set,Blob,URL,Date,console,atob,btoa,setTimeout,clearTimeout,window:{},QA_I18N:{t:key=>key}};
vm.createContext(context);vm.runInContext(js,context);
const {clean,derive,bytesToB64,b64ToBytes}=context.__QA_TEST__;
const cleaned=clean({groqKey:'FAKE_TEST_KEY',language:'de',theme:'light',apiKey2:'FAKE_TEST_KEY_2',unknown:'bad'});
if(cleaned.unknown!==undefined||cleaned.language!=='de'||cleaned.theme!=='light')throw new Error('Allowed key filtering or new setting persistence failed');
const pass='only-test-password-not-secret';const salt=webcrypto.getRandomValues(new Uint8Array(16));const iv=webcrypto.getRandomValues(new Uint8Array(12));const key=await derive(pass,salt);
const clear=new TextEncoder().encode(JSON.stringify(cleaned));const encrypted=await webcrypto.subtle.encrypt({name:'AES-GCM',iv},key,clear);
const b64=bytesToB64(new Uint8Array(encrypted));const decoded=b64ToBytes(b64);
const restored=JSON.parse(new TextDecoder().decode(await webcrypto.subtle.decrypt({name:'AES-GCM',iv},key,decoded)));
if(JSON.stringify(cleaned)!==JSON.stringify(restored))throw new Error('Encrypted backup round-trip mismatch');
try{const wrong=await derive('incorrect-password',salt);await webcrypto.subtle.decrypt({name:'AES-GCM',iv},wrong,decoded);throw new Error('Wrong password should fail');}catch(e){if(e.message==='Wrong password should fail')throw e;}
console.log('PASS encrypted backup round trip, wrong password rejection, and language/theme preservation');
