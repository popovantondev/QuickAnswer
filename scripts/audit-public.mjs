// Public-source secret scan. Not a substitute for a full security audit.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const allowedExt=new Set(['.py','.js','.mjs','.json','.html','.css','.md','.ps1','.cmd','.yml','.yaml','.svg','.txt']);
const all=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const abs=path.join(dir,entry.name);if(entry.isDirectory()){
  if(entry.name==='.git')continue;
  if(['node_modules','.local','.private','user-data','dist'].includes(entry.name))throw Error(`Forbidden source directory ${abs}`);
  walk(abs);
 }else if(entry.isFile())all.push(abs);}}
walk(root);
const patterns=[
  /gsk_[a-zA-Z0-9]{25,}/g, /AIza[a-zA-Z0-9_-]{30,}/g,
  /(?:sk-proj-|github_pat_|ghp_)[A-Za-z0-9_-]{22,}/g,
  /-----BEGIN (?:RSA|OPENSSH|EC) PRIVATE KEY-----/g,
  /[A-Z]:\\Users\\(?!Public\\)[^\\\s]{2,}\\/gi,
  /\b(?:[a-f0-9]{48})\b/g
];
const forbiddenFile=/(?:^|[/\\])(?:settings\.json|qaUsage\.json|luna-pairing-token\.txt|api-keys\.json|\.env)$/i;
const findings=[];
for(const file of all){const rel=path.relative(root,file).replaceAll('\\','/');
  if(forbiddenFile.test(rel))findings.push(`${rel}: forbidden private file`);
  if(!allowedExt.has(path.extname(file)))continue;
  const text=fs.readFileSync(file,'utf8');
  for(const pat of patterns){pat.lastIndex=0;const m=text.match(pat);if(m) findings.push(`${rel}: possible secret or local path (${pat.source})`);}
}
if(findings.length){console.error(findings.join('\n'));process.exitCode=1;}
else console.log(`PUBLIC AUDIT PASSED: ${all.length} files scanned; no configured secret patterns found.`);
