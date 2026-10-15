#requires -Version 5.1
<##
 Quick Answer Desktop Preview 0.1 — self-contained Windows PowerShell 5.1 + WinForms.
 No installation, elevated rights, external packages, or stored screenshot files.
 Credentials are encrypted with Windows DPAPI (CurrentUser) and stored under LOCALAPPDATA.
##>
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Security
[System.Windows.Forms.Application]::EnableVisualStyles()

Add-Type -TypeDefinition @'
using System;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Windows.Forms;
public class QAHotkeyEventArgs : EventArgs {
    public int Id { get; private set; }
    public QAHotkeyEventArgs(int id) { Id = id; }
}
public class QAForm : Form {
    public event EventHandler<QAHotkeyEventArgs> GlobalHotkey;
    protected override void WndProc(ref Message message) {
        if (message.Msg == 0x0312 && GlobalHotkey != null)
            GlobalHotkey(this, new QAHotkeyEventArgs(message.WParam.ToInt32()));
        base.WndProc(ref message);
    }
}
public struct QARect { public int Left, Top, Right, Bottom; }
public static class QANative {
    [DllImport("user32.dll", SetLastError=true)] public static extern bool RegisterHotKey(IntPtr hwnd, int id, uint modifier, uint key);
    [DllImport("user32.dll", SetLastError=true)] public static extern bool UnregisterHotKey(IntPtr hwnd, int id);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out QARect rect);
}
'@

$script:storageDir=Join-Path $env:LOCALAPPDATA 'QuickAnswerDesktop'
if(-not (Test-Path $script:storageDir)){[void](New-Item -ItemType Directory -Force -Path $script:storageDir)}
$script:configPath=Join-Path $script:storageDir 'settings.json'
$script:cfg=@{ groq1='';groq2='';gemini1='';gemini2='';bridge=''; language='ru'; provider='auto';mode='auto';quality=80 }
function Seal([string]$text) {
 if([string]::IsNullOrWhiteSpace($text)){return ''}
 $bytes=[Text.Encoding]::UTF8.GetBytes($text)
 $sealed=[System.Security.Cryptography.ProtectedData]::Protect($bytes,$null,[System.Security.Cryptography.DataProtectionScope]::CurrentUser)
 return [Convert]::ToBase64String($sealed)
}
function Unseal([string]$text) {
 if([string]::IsNullOrWhiteSpace($text)){return ''}
 try {
  $bytes=[Convert]::FromBase64String($text)
  $plain=[System.Security.Cryptography.ProtectedData]::Unprotect($bytes,$null,[System.Security.Cryptography.DataProtectionScope]::CurrentUser)
  return [Text.Encoding]::UTF8.GetString($plain)
 } catch { return '' }
}
function Load-Settings {
 if(-not(Test-Path $script:configPath)){return}
 try {
  $data=Get-Content -LiteralPath $script:configPath -Raw -Encoding UTF8 | ConvertFrom-Json
  foreach($key in @('language','provider','mode','quality')){ if($null -ne $data.$key){$script:cfg[$key]=$data.$key} }
  foreach($key in @('groq1','groq2','gemini1','gemini2','bridge')){$script:cfg[$key]=Unseal ([string]$data.$key)}
 } catch { [System.Windows.Forms.MessageBox]::Show('Unable to read saved settings. Keys were not imported.','Quick Answer') | Out-Null }
}
function Save-Settings {
 $data=@{language=$script:cfg.language;provider=$script:cfg.provider;mode=$script:cfg.mode;quality=$script:cfg.quality}
 foreach($key in @('groq1','groq2','gemini1','gemini2','bridge')){$data[$key]=Seal ([string]$script:cfg[$key])}
 $json=$data|ConvertTo-Json -Depth 5
 $tmp=$script:configPath+'.tmp'
 [IO.File]::WriteAllText($tmp,$json,[Text.UTF8Encoding]::new($false))
 Move-Item -LiteralPath $tmp -Destination $script:configPath -Force
}
Load-Settings

$script:words=@{
 ru=@{title='Быстрый ответ';screen='Весь экран';window='Окно';region='Область';keys='Ключи API';ready='Готово · Ctrl+Alt+1/2/4';working='Анализирую JPEG…';model='Модель';mode='Тест';help='Горячие клавиши работают из других окон';saved='Ключи сохранены для этого пользователя Windows';empty='Добавь хотя бы один ключ Groq или Gemini';cancel='Выделение отменено';error='Ошибка';pause='Выбери другое окно и нажми горячую клавишу';}
 de=@{title='Schnellantwort';screen='Bildschirm';window='Fenster';region='Bereich';keys='API-Schlüssel';ready='Bereit · Strg+Alt+1/2/4';working='JPEG wird analysiert…';model='Modell';mode='Quiz';help='Tastenkürzel funktionieren in anderen Fenstern';saved='Schlüssel für diesen Windows-Benutzer gespeichert';empty='Bitte Groq- oder Gemini-Schlüssel eingeben';cancel='Auswahl abgebrochen';error='Fehler';pause='Anderes Fenster fokussieren, dann Tastenkürzel drücken';}
 en=@{title='Quick Answer';screen='Screen';window='Window';region='Region';keys='API keys';ready='Ready · Ctrl+Alt+1/2/4';working='Analyzing JPEG…';model='Provider';mode='Quiz';help='Global shortcuts work from other windows';saved='Keys saved for this Windows user';empty='Enter at least one Groq or Gemini key';cancel='Selection cancelled';error='Error';pause='Focus a different window, then press a shortcut';}
}
function T([string]$key){$lang=$script:cfg.language;if(-not $script:words.ContainsKey($lang)){$lang='ru'};return $script:words[$lang][$key]}

function Shot-Screen {
 $bounds=[System.Windows.Forms.SystemInformation]::VirtualScreen
 $bmp=[System.Drawing.Bitmap]::new($bounds.Width,$bounds.Height)
 $g=[System.Drawing.Graphics]::FromImage($bmp)
 try {$g.CopyFromScreen($bounds.Left,$bounds.Top,0,0,$bounds.Size)} finally {$g.Dispose()}
 return $bmp
}
function Crop-Bitmap([System.Drawing.Bitmap]$bmp,[System.Drawing.Rectangle]$rect){
 if($rect.Width -lt 24 -or $rect.Height -lt 24){throw 'Selection is too small.'}
 $bounds=[System.Drawing.Rectangle]::new(0,0,$bmp.Width,$bmp.Height)
 $r=[System.Drawing.Rectangle]::Intersect($bounds,$rect)
 if($r.Width -lt 24 -or $r.Height -lt 24){throw 'Selection outside screen.'}
 $out=[System.Drawing.Bitmap]::new($r.Width,$r.Height)
 $g=[System.Drawing.Graphics]::FromImage($out)
 try {$dest=[System.Drawing.Rectangle]::new(0,0,$r.Width,$r.Height);$g.DrawImage($bmp,$dest,$r,[System.Drawing.GraphicsUnit]::Pixel)} finally {$g.Dispose()}
 return $out
}
function Shot-Window([IntPtr]$hwnd){
 $virt=[System.Windows.Forms.SystemInformation]::VirtualScreen
 if($hwnd -eq [IntPtr]::Zero){return Shot-Screen}
 $rc=New-Object QARect
 if(-not [QANative]::GetWindowRect($hwnd,[ref]$rc)){return Shot-Screen}
 $screen=Shot-Screen
 try {
  $bounds=[System.Drawing.Rectangle]::new(($rc.Left-$virt.Left),($rc.Top-$virt.Top),($rc.Right-$rc.Left),($rc.Bottom-$rc.Top))
  return Crop-Bitmap $screen $bounds
 } finally {$screen.Dispose()}
}
function Shot-Region {
 $virtual=[System.Windows.Forms.SystemInformation]::VirtualScreen
 $image=Shot-Screen
 $script:selectionPoint=$null
 $script:selectionBox=$null
 $overlay=New-Object System.Windows.Forms.Form
 $overlay.FormBorderStyle=[System.Windows.Forms.FormBorderStyle]::None
 $overlay.StartPosition=[System.Windows.Forms.FormStartPosition]::Manual
 $overlay.Bounds=$virtual
 $overlay.ShowInTaskbar=$false
 $overlay.TopMost=$true
 $overlay.BackgroundImage=$image
 $overlay.BackgroundImageLayout='None'
 $overlay.Cursor=[System.Windows.Forms.Cursors]::Cross
 $overlay.KeyPreview=$true
 $overlay.Add_MouseDown({param($sender,$evt) if($evt.Button -eq [System.Windows.Forms.MouseButtons]::Left){$script:selectionPoint=$evt.Location;$script:selectionBox=$null}})
 $overlay.Add_MouseMove({param($sender,$evt)
  if($null -eq $script:selectionPoint){return}
  $x=[Math]::Min($script:selectionPoint.X,$evt.X);$y=[Math]::Min($script:selectionPoint.Y,$evt.Y)
  $w=[Math]::Abs($evt.X-$script:selectionPoint.X);$h=[Math]::Abs($evt.Y-$script:selectionPoint.Y)
  $script:selectionBox=[System.Drawing.Rectangle]::new($x,$y,$w,$h)
  $sender.Invalidate()
 })
 $overlay.Add_Paint({param($sender,$evt)
  if($null -ne $script:selectionBox){
   $pen=[System.Drawing.Pen]::new([System.Drawing.Color]::Orange,3)
   try{$evt.Graphics.DrawRectangle($pen,$script:selectionBox)}finally{$pen.Dispose()}
  }
 })
 $overlay.Add_MouseUp({param($sender,$evt) if($evt.Button -eq [System.Windows.Forms.MouseButtons]::Left){$sender.DialogResult=[System.Windows.Forms.DialogResult]::OK;$sender.Close()}})
 $overlay.Add_KeyDown({param($sender,$evt) if($evt.KeyCode -eq [System.Windows.Forms.Keys]::Escape){$sender.DialogResult=[System.Windows.Forms.DialogResult]::Cancel;$sender.Close()}})
 try {
  $result=$overlay.ShowDialog()
  if($result -ne [System.Windows.Forms.DialogResult]::OK -or $null -eq $script:selectionBox){return $null}
  return Crop-Bitmap $image $script:selectionBox
 } finally {$overlay.Dispose();$image.Dispose();$script:selectionBox=$null;$script:selectionPoint=$null}
}
function Jpeg-Base64([System.Drawing.Bitmap]$bmp,[int]$quality){
 $stream=New-Object System.IO.MemoryStream
 try {
  $codec=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object {$_.MimeType -eq 'image/jpeg'} | Select-Object -First 1
  $parameters=[System.Drawing.Imaging.EncoderParameters]::new(1)
  $parameters.Param[0]=[System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality,[long]([Math]::Max(55,[Math]::Min(95,$quality))))
  try{$bmp.Save($stream,$codec,$parameters)}finally{$parameters.Dispose()}
  return [Convert]::ToBase64String($stream.ToArray())
 } finally {$stream.Dispose()}
}
function Reply-Text([object]$value){
 if($null -eq $value){return ''}
 $text=[string]$value
 try {
  $parsed=$text|ConvertFrom-Json
  if($null -ne $parsed.answer){
   $answer=[string]$parsed.answer
   $extra=[string]$parsed.explanation
   if($extra){return "$answer`n$extra"}
   return $answer
  }
 } catch {}
 return $text.Trim()
}
function Invoke-Json([string]$uri,[hashtable]$headers,[object]$payload){
 $json=ConvertTo-Json -InputObject $payload -Depth 16 -Compress
 $body=[Text.Encoding]::UTF8.GetBytes($json)
 return Invoke-RestMethod -Uri $uri -Method Post -ContentType 'application/json; charset=utf-8' -Headers $headers -Body $body -TimeoutSec 13
}
function Solve-Image([string]$jpg){
 $mode=[string]$script:cfg.mode
 $instruction='Read the screenshot. Answer the visible CURRENT question only, not ads or navigation. Return ONLY JSON {"answer":"...","explanation":"..."}. For multiple choice use the 1-based number in VISIBLE top-to-bottom order. For Kahoot use only RED, BLUE, YELLOW, GREEN (or comma-separated colors if multiple). If impossible: answer="NOT_VISIBLE". Explanation max 90 characters. Do not invent choices.'
 if($mode -eq 'kahoot'){$instruction+=' This is definitely a Kahoot question: answer with a color.'}
 if($mode -eq 'test'){$instruction+=' This is a numbered multiple-choice test.'}
 $imageUrl='data:image/jpeg;base64,'+$jpg
 $errs=New-Object System.Collections.Generic.List[string]
 $chosen=@([string]$script:cfg.provider)
 if($script:cfg.provider -eq 'auto'){$chosen=@('groq','gemini','bridge')}
 foreach($provider in $chosen){
  if($provider -eq 'groq'){
   foreach($key in @($script:cfg.groq1,$script:cfg.groq2)){
    if([string]::IsNullOrWhiteSpace($key)){continue}
    try {
     $payload=@{model='qwen/qwen3.8-27b';temperature=1;max_completion_tokens=480;stream=$false;response_format=@{type='json_object'};messages=@(@{role='system';content='Return only a JSON object.'},@{role='user';content=@(@{type='text';text=$instruction},@{type='image_url';image_url=@{url=$imageUrl}})})}
     $data=Invoke-Json 'https://api.groq.com/openai/v1/chat/completions' @{Authorization='Bearer '+$key} $payload
     $answer=Reply-Text $data.choices[0].message.content
     if($answer){return @{text=$answer;provider='Groq'}}
    } catch {$errs.Add('Groq: '+$_.Exception.Message.Substring(0,[Math]::Min(100,$_.Exception.Message.Length)))}
   }
  }
  if($provider -eq 'gemini'){
   foreach($key in @($script:cfg.gemini1,$script:cfg.gemini2)){
    if([string]::IsNullOrWhiteSpace($key)){continue}
    try {
     $payload=@{contents=@(@{role='user';parts=@(@{text=$instruction},@{inline_data=@{mime_type='image/jpeg';data=$jpg}})});generationConfig=@{temperature=0;maxOutputTokens=320;responseMimeType='application/json'}}
     $data=Invoke-Json 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent' @{'x-goog-api-key'=$key} $payload
     $answer=Reply-Text $data.candidates[0].content.parts[0].text
     if($answer){return @{text=$answer;provider='Gemini'}}
    } catch {$errs.Add('Gemini: '+$_.Exception.Message.Substring(0,[Math]::Min(100,$_.Exception.Message.Length)))}
   }
  }
  if($provider -eq 'bridge' -and -not [string]::IsNullOrWhiteSpace($script:cfg.bridge)){
   try {
    $payload=@{mode=$mode;source='desktop-window';text=$instruction;image=$imageUrl}
    $data=Invoke-Json 'http://127.0.0.1:8765/solve' @{'X-Quick-Answer-Token'=[string]$script:cfg.bridge} $payload
    $answer=Reply-Text $data.answer
    if($answer){return @{text=$answer;provider='ChatGPT Bridge'}}
   } catch {$errs.Add('ChatGPT: '+$_.Exception.Message.Substring(0,[Math]::Min(100,$_.Exception.Message.Length)))}
  }
 }
 if($errs.Count -eq 0){throw (T 'empty')}
 throw ($errs -join '; ')
}

# Dark navy + orange compact UI, consistent with Edge extension.
$script:form=[QAForm]::new()
$script:form.Text='Quick Answer Desktop · 0.1 Preview'
$script:form.ClientSize=[System.Drawing.Size]::new(405,315)
$script:form.StartPosition='CenterScreen'
$script:form.BackColor=[System.Drawing.ColorTranslator]::FromHtml('#101A2D')
$script:form.ForeColor=[System.Drawing.Color]::White
$script:form.Font=[System.Drawing.Font]::new('Segoe UI',10)
$script:form.FormBorderStyle=[System.Windows.Forms.FormBorderStyle]::FixedSingle
$script:form.MaximizeBox=$false
$script:form.KeyPreview=$true

function Make-Label([int]$x,[int]$y,[int]$w,[int]$h,[int]$size,[string]$color){
 $l=New-Object System.Windows.Forms.Label
 $l.Bounds=[System.Drawing.Rectangle]::new($x,$y,$w,$h)
 $l.ForeColor=[System.Drawing.ColorTranslator]::FromHtml($color)
 $l.Font=[System.Drawing.Font]::new('Segoe UI',$size)
 $script:form.Controls.Add($l)
 return $l
}
function Make-Button([int]$x,[int]$y,[int]$w,[string]$color){
 $b=New-Object System.Windows.Forms.Button
 $b.Bounds=[System.Drawing.Rectangle]::new($x,$y,$w,43)
 $b.FlatStyle='Flat';$b.FlatAppearance.BorderSize=1
 $b.FlatAppearance.BorderColor=[System.Drawing.ColorTranslator]::FromHtml('#41536C')
 $b.ForeColor=[System.Drawing.Color]::White
 $b.BackColor=[System.Drawing.ColorTranslator]::FromHtml($color)
 $b.Font=[System.Drawing.Font]::new('Segoe UI',10,[System.Drawing.FontStyle]::Bold)
 $script:form.Controls.Add($b)
 return $b
}
$header=Make-Label 18 14 360 36 18 '#FF9A39'
$sub=Make-Label 18 53 370 25 9 '#BCC7D8'
$btnScreen=Make-Button 18 91 115 '#A75518'
$btnWindow=Make-Button 143 91 115 '#162D49'
$btnRegion=Make-Button 268 91 115 '#162D49'
$provider=New-Object System.Windows.Forms.ComboBox
$provider.Bounds=[System.Drawing.Rectangle]::new(18,151,170,28);$provider.DropDownStyle='DropDownList'
[void]$provider.Items.AddRange(@('AUTO · Groq → Gemini → ChatGPT','Groq','Gemini','ChatGPT Bridge'))
$provider.SelectedIndex=@{'auto'=0;'groq'=1;'gemini'=2;'bridge'=3}[[string]$script:cfg.provider]
if($provider.SelectedIndex -lt 0){$provider.SelectedIndex=0}
$script:form.Controls.Add($provider)
$mode=New-Object System.Windows.Forms.ComboBox
$mode.Bounds=[System.Drawing.Rectangle]::new(198,151,118,28);$mode.DropDownStyle='DropDownList'
[void]$mode.Items.AddRange(@('AUTO','Test','Kahoot'))
$mode.SelectedIndex=@{'auto'=0;'test'=1;'kahoot'=2}[[string]$script:cfg.mode]
if($mode.SelectedIndex -lt 0){$mode.SelectedIndex=0}
$script:form.Controls.Add($mode)
$lang=New-Object System.Windows.Forms.ComboBox
$lang.Bounds=[System.Drawing.Rectangle]::new(325,151,58,28);$lang.DropDownStyle='DropDownList'
[void]$lang.Items.AddRange(@('RU','DE','EN'))
$lang.SelectedIndex=@{'ru'=0;'de'=1;'en'=2}[[string]$script:cfg.language]
if($lang.SelectedIndex -lt 0){$lang.SelectedIndex=0}
$script:form.Controls.Add($lang)
$result=Make-Label 18 193 370 62 12 '#F8FAFC'
$result.BorderStyle='FixedSingle'
$result.BackColor=[System.Drawing.ColorTranslator]::FromHtml('#172238')
$result.Padding=[System.Windows.Forms.Padding]::new(8)
$state=Make-Label 18 264 270 29 8 '#9FC8AE'
$btnKeys=Make-Button 295 260 89 '#E97821'

function Refresh-Language {
 $header.Text='⚡ Quick Answer Desktop'
 $sub.Text=T 'help'
 $btnScreen.Text=T 'screen';$btnWindow.Text=T 'window';$btnRegion.Text=T 'region';$btnKeys.Text=T 'keys'
 $state.Text=T 'ready'
}
Refresh-Language
$provider.Add_SelectedIndexChanged({$script:cfg.provider=@('auto','groq','gemini','bridge')[$provider.SelectedIndex];Save-Settings})
$mode.Add_SelectedIndexChanged({$script:cfg.mode=@('auto','test','kahoot')[$mode.SelectedIndex];Save-Settings})
$lang.Add_SelectedIndexChanged({$script:cfg.language=@('ru','de','en')[$lang.SelectedIndex];Refresh-Language;Save-Settings})

function Open-KeySettings {
 $dlg=New-Object System.Windows.Forms.Form
 $dlg.Text='Quick Answer · API keys';$dlg.ClientSize=[System.Drawing.Size]::new(430,358)
 $dlg.StartPosition='CenterParent';$dlg.BackColor=$script:form.BackColor;$dlg.ForeColor=[System.Drawing.Color]::White
 $dlg.Font=[System.Drawing.Font]::new('Segoe UI',10)
 $entries=@{}
 $items=@(@('groq1','Groq · key 1'),@('groq2','Groq · key 2'),@('gemini1','Gemini · key 1'),@('gemini2','Gemini · key 2'),@('bridge','ChatGPT Bridge · pairing token'))
 $y=16
 foreach($item in $items){
  $label=New-Object System.Windows.Forms.Label;$label.Text=$item[1];$label.Bounds=[System.Drawing.Rectangle]::new(16,$y,390,20);$dlg.Controls.Add($label)
  $entry=New-Object System.Windows.Forms.TextBox;$entry.Bounds=[System.Drawing.Rectangle]::new(16,($y+23),390,28)
  $entry.UseSystemPasswordChar=$true;$entry.Text=[string]$script:cfg[$item[0]]
  $dlg.Controls.Add($entry);$entries[$item[0]]=$entry
  $y+=58
 }
 $save=New-Object System.Windows.Forms.Button;$save.Text='Save';$save.Bounds=[System.Drawing.Rectangle]::new(305,310,100,32)
 $save.BackColor=[System.Drawing.ColorTranslator]::FromHtml('#F28A30');$save.ForeColor=[System.Drawing.Color]::Black
 $dlg.Controls.Add($save)
 $save.Add_Click({
  foreach($k in @('groq1','groq2','gemini1','gemini2','bridge')){$script:cfg[$k]=$entries[$k].Text.Trim()}
  Save-Settings
  [System.Windows.Forms.MessageBox]::Show((T 'saved'),'Quick Answer')|Out-Null
  $dlg.DialogResult='OK';$dlg.Close()
 })
 try{[void]$dlg.ShowDialog($script:form)}finally{$dlg.Dispose()}
}
$btnKeys.Add_Click({Open-KeySettings})

$script:busy=$false
$script:notifyWin=$null
$script:notifyTimer=$null
function Show-Answer([string]$text,[string]$provider,[double]$seconds){
 $answer=New-Object System.Windows.Forms.Form
 $answer.FormBorderStyle='FixedToolWindow';$answer.ShowInTaskbar=$false;$answer.TopMost=$true
 $answer.Text='Quick Answer · '+$provider
 $answer.Size=[System.Drawing.Size]::new(400,160)
 $answer.BackColor=[System.Drawing.ColorTranslator]::FromHtml('#101A2D')
 $answer.ForeColor=[System.Drawing.Color]::White
 $area=[System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
 $answer.StartPosition='Manual';$answer.Location=[System.Drawing.Point]::new(($area.Right-410),($area.Top+25))
 $label=New-Object System.Windows.Forms.Label;$label.Text=$text+"`n"+('{0:0.0} s · {1}' -f $seconds,$provider)
 $label.ForeColor=[System.Drawing.ColorTranslator]::FromHtml('#FFE0BA')
 $label.Font=[System.Drawing.Font]::new('Segoe UI',13,[System.Drawing.FontStyle]::Bold)
 $label.Bounds=[System.Drawing.Rectangle]::new(12,12,370,104);$answer.Controls.Add($label)
 if($script:notifyTimer){$script:notifyTimer.Stop();$script:notifyTimer.Dispose()}
 if($script:notifyWin -and -not $script:notifyWin.IsDisposed){$script:notifyWin.Close()}
 $script:notifyWin=$answer
 $script:notifyTimer=New-Object System.Windows.Forms.Timer;$script:notifyTimer.Interval=6500
 $script:notifyTimer.Add_Tick({if($script:notifyTimer){$script:notifyTimer.Stop()};if($script:notifyWin -and -not $script:notifyWin.IsDisposed){$script:notifyWin.Close()}})
 $script:notifyTimer.Start();$answer.Show()
}
function Start-Capture([string]$kind){
 if($script:busy){return}
 $script:busy=$true
 $bmp=$null
 $target=if($kind -eq 'window') {[QANative]::GetForegroundWindow()}else{[IntPtr]::Zero}
 $script:form.WindowState='Minimized'
 try {
  [System.Windows.Forms.Application]::DoEvents()
  [Threading.Thread]::Sleep(190)
  if($kind -eq 'region'){$bmp=Shot-Region}
  elseif($kind -eq 'window'){$bmp=Shot-Window $target}
  else {$bmp=Shot-Screen}
  if($null -eq $bmp){$state.Text=T 'cancel';return}
  $script:form.WindowState='Normal'
  $state.Text=T 'working';$result.Text=T 'working';$script:form.Refresh()
  $jpg=Jpeg-Base64 $bmp ([int]$script:cfg.quality)
  $watch=[Diagnostics.Stopwatch]::StartNew()
  $reply=Solve-Image $jpg
  $watch.Stop()
  $result.Text=$reply.text
  $state.Text=('{0} · {1:0.0} s' -f $reply.provider,$watch.Elapsed.TotalSeconds)
  Show-Answer $reply.text $reply.provider $watch.Elapsed.TotalSeconds
 } catch {
  $result.Text=($_.Exception.Message -replace 'AIza[0-9A-Za-z_-]+','[key]' -replace 'gsk_[0-9A-Za-z_-]+','[key]')
  $state.Text=T 'error'
 } finally {
  if($null -ne $bmp){$bmp.Dispose()}
  $script:form.WindowState='Normal'
  $script:busy=$false
 }
}
$btnScreen.Add_Click({Start-Capture 'screen'})
$btnWindow.Add_Click({[System.Windows.Forms.MessageBox]::Show((T 'pause'),'Quick Answer')|Out-Null})
$btnRegion.Add_Click({Start-Capture 'region'})
$script:form.Add_Shown({
 # Use Ctrl+Alt combinations to avoid clashing with Edge's Ctrl+Shift shortcuts.
 [void][QANative]::RegisterHotKey($script:form.Handle,101,3,0x31)
 [void][QANative]::RegisterHotKey($script:form.Handle,102,3,0x32)
 [void][QANative]::RegisterHotKey($script:form.Handle,104,3,0x34)
})
$script:form.Add_GlobalHotkey({param($sender,$e)
 if($e.Id -eq 101){Start-Capture 'screen'}
 elseif($e.Id -eq 102){Start-Capture 'window'}
 elseif($e.Id -eq 104){Start-Capture 'region'}
})
$script:form.Add_FormClosing({
 foreach($id in @(101,102,104)){[void][QANative]::UnregisterHotKey($script:form.Handle,$id)}
})
[System.Windows.Forms.Application]::Run($script:form)
