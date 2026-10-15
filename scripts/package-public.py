from pathlib import Path
import subprocess,zipfile,hashlib
root=Path(__file__).resolve().parents[1]
tracked=subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().strip('\0').split('\0')
out=root/'dist';out.mkdir(exist_ok=True)
def pack(name,files):
 with zipfile.ZipFile(out/name,'w',zipfile.ZIP_DEFLATED) as z:
  for rel in sorted(files):z.write(root/rel,rel)
common=['docs/RIGHTS.md','docs/VERIFICATION.md','docs/AUDIT.md']
pack('QuickAnswer-Edge-1.7.8.zip',[f for f in tracked if f.startswith('edge-quick-answer/')]+common)
pack('QuickAnswer-Desktop-0.1-SourcePreview.zip',[f for f in tracked if f.startswith('desktop/')]+common)
pack('QuickAnswer-1.7.8-Desktop-0.1-PublicSource.zip',tracked)
(out/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in sorted(out.glob('*.zip'))),encoding='utf-8')
