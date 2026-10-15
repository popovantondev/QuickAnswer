import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code=fs.readFileSync(new URL('../edge-quick-answer/background.js',import.meta.url),'utf8');
const ctx=vm.createContext({console, chrome:{commands:{onCommand:{addListener(){}}},runtime:{onMessage:{addListener(){}}}}, Intl, URL, Date, TextEncoder, AbortController, setTimeout, clearTimeout});
vm.runInContext(code,ctx);
function check(choices,text,answer,exp){
  const result=vm.runInContext(`reconcileChoice(parseAnswer(${JSON.stringify(JSON.stringify({quizMode:'test',kind:'choice',answer,selectedText:text,explanation:'Test',pairs:[]}))}, 'test'), ${JSON.stringify(choices)})`,ctx);
  assert.equal(result.answer,String(exp),JSON.stringify(result));
}
const first=[{number:1,text:'Hyper Text Markup Language'},{number:2,text:'Hyperlinks and Text Markup Language'},{number:3,text:'Home Tool Markup Language'}];
check(first, 'Hyper Text Markup Language','3',1);
check(first.slice().reverse(), 'Hyper Text Markup Language','1',3);
const second=[{number:1,text:'Mozilla'},{number:2,text:'The World Wide Web Consortium'},{number:3,text:'Google'},{number:4,text:'Microsoft'}];
check(second, 'The World Wide Web Consortium','4',2);
check(second.slice().reverse(), 'The World Wide Web Consortium','2',3);
const textWrong=vm.runInContext(`reconcileChoice(parseAnswer(${JSON.stringify(JSON.stringify({kind:'choice',answer:'4',selectedText:'This option is not on screen',explanation:'Test',pairs:[]}))}, 'test'), ${JSON.stringify(second)})`,ctx);
assert.equal(textWrong.answer,'This option is not on screen');
const kahoot=vm.runInContext(`reconcileChoice(parseAnswer(${JSON.stringify(JSON.stringify({kind:'choice',answer:'GREEN',selectedText:'Mars',explanation:'',pairs:[]}))},'kahoot'), ${JSON.stringify(first)})`,ctx);
assert.equal(kahoot.answer,'ЗЕЛЁНЫЙ');

const tags=[{number:1,text:'<i>'},{number:2,text:'<italic>'},{number:3,text:'<em>'}];
check(tags,'<em>','1',3);
const punctuation=[{number:1,text:'/'},{number:2,text:'*'},{number:3,text:'^'},{number:4,text:'<'}];
check(punctuation,'/','6',1);
check(punctuation,'<','4',4);
console.log('PASS: short HTML tags and single-character alternatives map to current positions');
console.log('PASS: W3Schools HTML shuffled 3 → 1');
console.log('PASS: HTML reverse 1 → 3');
console.log('PASS: W3C shuffled 4 → 2');
console.log('PASS: W3C reverse 2 → 3');
console.log('PASS: unmatched options do not fabricate ordinal');
console.log('PASS: Kahoot remains a color');
