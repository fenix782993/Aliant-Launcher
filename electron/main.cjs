const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const https = require('node:https');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { autoUpdater } = require('electron-updater');

const isDev = !app.isPackaged;
let win;
const configUrl = process.env.ALIANT_CONFIG_URL ||
  'https://raw.githubusercontent.com/fenix782993/Aliant-Launcher/main/remote/launcher.json';
const userData = () => app.getPath('userData');
const settingsFile = () => path.join(userData(), 'settings.json');
function readSettings(){ try { return JSON.parse(fs.readFileSync(settingsFile(),'utf8')); } catch { return {}; } }
function writeSettings(data){ fs.mkdirSync(userData(),{recursive:true}); fs.writeFileSync(settingsFile(),JSON.stringify(data,null,2)); }
function getGameRoot(){ return readSettings().gamePath || ''; }
function findGameRoot(){
  const s=readSettings(); if(s.gamePath && fs.existsSync(s.gamePath)) return s.gamePath;
  const roots=[app.getPath('games'),app.getPath('documents'),app.getPath('downloads'),app.getPath('desktop'),process.env.ProgramFiles,process.env['ProgramFiles(x86)'],process.env.LOCALAPPDATA,process.env.APPDATA].filter(Boolean);
  const names=['Black Test','BlackTest','Aliant','Amazing RP','Amazing'];
  for(const root of roots){for(const name of names){const candidate=path.join(root,name);if(fs.existsSync(candidate)&&fs.statSync(candidate).isDirectory()){s.gamePath=candidate;writeSettings(s);return candidate;}}}
  return '';
}

function getText(url) {
  return new Promise((resolve,reject) => {
    if (!/^https:\/\/[^/]+/i.test(url)) return reject(new Error('Only HTTPS URLs are allowed'));
    https.get(url, {headers:{'User-Agent':'AliantLauncher'}}, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume(); return getText(res.headers.location).then(resolve,reject);
      }
      if(res.statusCode !== 200){res.resume();return reject(new Error(`HTTP ${res.statusCode}`));}
      let body='';res.setEncoding('utf8');res.on('data',d=>body+=d);res.on('end',()=>resolve(body));
    }).on('error',reject);
  });
}
function downloadFile(url, dest) {
  return new Promise((resolve,reject) => {
    if (!/^https:\/\/[^/]+/i.test(url)) return reject(new Error('Only HTTPS download URLs are allowed'));
    fs.mkdirSync(path.dirname(dest),{recursive:true});
    const tmp = dest + '.aliant-download';
    const out = fs.createWriteStream(tmp);
    https.get(url,{headers:{'User-Agent':'AliantLauncher'}},res=>{
      if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){res.resume();out.close();fs.rmSync(tmp,{force:true});return downloadFile(res.headers.location,dest).then(resolve,reject);}
      if(res.statusCode!==200){res.resume();out.close();fs.rmSync(tmp,{force:true});return reject(new Error(`HTTP ${res.statusCode} while downloading`));}
      res.pipe(out);out.on('finish',()=>out.close(()=>{
        try{fs.renameSync(tmp,dest);resolve();}catch(e){reject(e);}
      }));
    }).on('error',e=>{out.close();fs.rmSync(tmp,{force:true});reject(e);});
  });
}
function createWindow() {
  win = new BrowserWindow({
    width:900,height:570,minWidth:760,minHeight:480,backgroundColor:'#090b10',
    frame:false,autoHideMenuBar:true,
    webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false}
  });
  if(isDev) win.loadURL('http://127.0.0.1:5173'); else win.loadFile(path.join(__dirname,'../dist/index.html'));
}
app.whenReady().then(()=>{
  createWindow();
  if(!isDev){
    autoUpdater.autoDownload=false;
    autoUpdater.checkForUpdates().catch(e=>win?.webContents.send('app:update-error',e.message));
    autoUpdater.on('update-available',info=>win?.webContents.send('app:update-available',info.version));
    autoUpdater.on('update-not-available',()=>win?.webContents.send('app:update-none'));
    autoUpdater.on('download-progress',p=>win?.webContents.send('app:update-progress',Math.round(p.percent)));
    autoUpdater.on('update-downloaded',()=>win?.webContents.send('app:update-ready'));
    autoUpdater.on('error',e=>win?.webContents.send('app:update-error',e.message));
  }
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
ipcMain.on('window:minimize',()=>win?.minimize());
ipcMain.on('window:close',()=>win?.close());
ipcMain.on('window:maximize',()=>{if(win?.isMaximized())win.unmaximize();else win?.maximize();});
ipcMain.handle('app:version',()=>app.getVersion());
ipcMain.handle('app:check-update',async()=>{if(isDev)return {dev:true};try{return await autoUpdater.checkForUpdates();}catch(e){return {error:e.message};}});
ipcMain.handle('app:download-update',async()=>{try{return await autoUpdater.downloadUpdate();}catch(e){return {error:e.message};}});
ipcMain.handle('app:install-update',()=>autoUpdater.quitAndInstall());
ipcMain.handle('app:open-url',async(_,url)=>{if(typeof url==='string'&&/^https:\/\/[a-z0-9.-]+(?:\/.*)?$/i.test(url))return shell.openExternal(url);});
ipcMain.handle('launcher:config',async()=>{
  try { const c=JSON.parse(await getText(configUrl)); return c; }
  catch(e){return {error:e.message};}
});
ipcMain.handle('launcher:game-path',()=>findGameRoot());
ipcMain.handle('launcher:get-nickname',()=>readSettings().nickname||'');
ipcMain.handle('launcher:set-nickname',(_,nickname)=>{if(typeof nickname!=='string'||nickname.length>24||!/^[A-Za-z0-9_]{3,24}$/.test(nickname))return {error:'Некорректный ник'};const s=readSettings();s.nickname=nickname;writeSettings(s);return {ok:true};});
ipcMain.handle('launcher:set-game-path',async()=>{
  const result=await dialog.showOpenDialog(win,{title:'Выберите папку игры',properties:['openDirectory']});
  if(result.canceled||!result.filePaths[0])return '';
  const folder=result.filePaths[0];const s=readSettings();s.gamePath=folder;writeSettings(s);return folder;
});
ipcMain.handle('launcher:launch',async(_,executable,args=[])=>{
  const root=getGameRoot();
  if(!root||!fs.existsSync(root))return {error:'Выберите существующую папку игры в настройках.'};
  if(typeof executable!=='string'||!executable.toLowerCase().endsWith('.exe')||path.isAbsolute(executable)||executable.split(/[\\/]/).includes('..'))
    return {error:'Руководитель должен указать безопасный относительный путь к EXE в launcher.json.'};
  const exe=path.resolve(root,executable);
  if(!exe.startsWith(path.resolve(root)+path.sep)||!fs.existsSync(exe))return {error:'EXE не найден. Проверьте путь в конфигурации сервера.'};
  try { const child=spawn(exe,Array.isArray(args)?args.map(String):[],{cwd:path.dirname(exe),detached:true,stdio:'ignore',windowsHide:false});child.unref();return {ok:true}; }
  catch(e){return {error:`Не удалось запустить игру: ${e.message}`};}
});
ipcMain.handle('launcher:update-game',async()=>{
  const root=getGameRoot(); if(!root||!fs.existsSync(root))return {error:'Сначала выберите папку игры.'};
  try{
    const config=JSON.parse(await getText(configUrl));
    if(!config.gameManifestUrl)return {error:'Владелец ещё не настроил gameManifestUrl.'};
    const manifest=JSON.parse(await getText(config.gameManifestUrl));
    if(!Array.isArray(manifest.files))return {error:'Манифест должен содержать массив files.'};
    let updated=0;
    for(const item of manifest.files){
      if(!item||typeof item.path!=='string'||typeof item.url!=='string'||!/^[a-f0-9]{64}$/i.test(item.sha256||''))throw new Error('У каждого файла нужны path, HTTPS url и SHA-256.');
      if(path.isAbsolute(item.path)||item.path.split(/[\\/]/).includes('..'))throw new Error('Небезопасный путь в манифесте.');
      const dest=path.resolve(root,item.path);
      if(!dest.startsWith(path.resolve(root)+path.sep))throw new Error('Путь файла выходит за папку игры.');
      let current='';
      if(fs.existsSync(dest)&&fs.statSync(dest).isFile())current=crypto.createHash('sha256').update(fs.readFileSync(dest)).digest('hex');
      if(current.toLowerCase()===item.sha256.toLowerCase())continue;
      await downloadFile(item.url,dest);
      const actual=crypto.createHash('sha256').update(fs.readFileSync(dest)).digest('hex');
      if(actual.toLowerCase()!==item.sha256.toLowerCase()){fs.rmSync(dest,{force:true});throw new Error(`SHA-256 не совпал: ${item.path}`);}
      updated++;
    }
    return {ok:true,updated};
  }catch(e){return {error:e.message};}
});
