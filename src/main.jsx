import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Shield, Settings, Minus, X, ChevronDown, Users, Play, Download, RefreshCw, FolderOpen, ExternalLink, CircleHelp, Monitor, CheckCircle2, AlertCircle, Flame, Gamepad2, Crown, LockKeyhole } from 'lucide-react';
import './style.css';

const fallback = {
  brand: 'ALIANT', subtitle: 'ROLEPLAY COMMUNITY', selectedServer: 'Black Test',
  servers: [{id:'black-test',name:'Black Test',description:'Основной игровой сервер',status:'unknown',online:null,maxPlayers:1000,executable:'',args:[]}],
  links: {site:'',forum:'',shop:'',support:''},
  footer: 'ALIANT ROLEPLAY • ТВОЯ ИСТОРИЯ НАЧИНАЕТСЯ ЗДЕСЬ',
  banner: {title:'ALIANT ROLEPLAY',subtitle:'МИР, КОТОРЫЙ СОЗДАЁШЬ ТЫ'},
  onlineApi: ''
};
function App(){
 const [config,setConfig]=useState(fallback), [server,setServer]=useState('black-test'), [version,setVersion]=useState('1.0.0');
 const [gamePath,setGamePath]=useState(''), [nickname,setNickname]=useState(''), [busy,setBusy]=useState(false), [message,setMessage]=useState('Подключаемся к серверам Aliant…');
 const [tab,setTab]=useState('home'), [showServers,setShowServers]=useState(false), [update,setUpdate]=useState(''), [updateAvailable,setUpdateAvailable]=useState(false), [updateReady,setUpdateReady]=useState(false), [updateProgress,setUpdateProgress]=useState(0);
 useEffect(()=>{(async()=>{
   try { setVersion(await window.aliant.version()); } catch {}
   const p=await window.aliant.gamePath().catch(()=> ''); setGamePath(p);
   setNickname(await window.aliant.nickname().catch(()=>''));
   const c=await window.aliant.config().catch(()=>null);
   if(c && c.servers?.length){setConfig(c);setServer(c.selectedServer || c.servers[0].id);setMessage('Конфигурация обновлена');}
   else setMessage('Не удалось загрузить удалённую конфигурацию. Проверьте адрес GitHub.');
   window.aliant.on('app:update-available',v=>{setUpdate(`Доступна версия ${v}`);setUpdateAvailable(true);setUpdateReady(false);});
   window.aliant.on('app:update-none',()=>{setUpdate('Установлена последняя версия');setUpdateAvailable(false);});
   window.aliant.on('app:update-ready',()=>{setUpdate('Обновление загружено — нажмите «Перезапустить»');setUpdateReady(true);});
   window.aliant.on('app:update-progress',v=>{setUpdateProgress(v);setUpdate(`Загрузка обновления: ${v}%`);});
   window.aliant.on('app:update-error',e=>setUpdate(`Ошибка обновления: ${e}`));
 })()},[]);
 const selected=config.servers.find(s=>s.id===server)||config.servers[0]||fallback.servers[0];
 const link=(key)=>config.links?.[key]||'';
 async function refresh(){setBusy(true);setMessage('Проверяем обновления и конфигурацию…');const c=await window.aliant.config().catch(()=>null);if(c&&!c.error&&c.servers?.length){setConfig(c);setServer(c.selectedServer||c.servers[0].id);setMessage('Данные сервера обновлены');}else setMessage(c?.error||'Не удалось обновить конфигурацию');await window.aliant.checkUpdate().catch(()=>{});setBusy(false);}
 async function choosePath(){const p=await window.aliant.chooseGamePath();if(p){setGamePath(p);setMessage('Папка игры сохранена');}}
 async function saveNickname(){const n=nickname.trim();if(!n){setMessage('Введите игровой ник.');return;}if(n.length<3||n.length>24||!/^[A-Za-z0-9_]+$/.test(n)){setMessage('Ник: 3–24 символа, латиница, цифры и _.');return;}await window.aliant.setNickname(n);setNickname(n);setMessage(`Ник ${n} сохранён`);}
 async function updateLauncher(){if(updateReady){window.aliant.installUpdate();return;}setBusy(true);const r=await window.aliant.downloadUpdate();if(r?.error)setUpdate(`Ошибка обновления: ${r.error}`);else if(!updateAvailable)setUpdate('Проверяем наличие обновления…');setBusy(false);}
 async function launch(){if(!nickname.trim()){setMessage('Введите игровой ник перед входом.');return;}await saveNickname();if(!gamePath){setMessage('Игра не найдена автоматически. Укажите папку игры один раз в настройках.');setTab('settings');return;}if(!selected?.executable){setMessage('Руководитель ещё не настроил EXE игры для этого сервера.');return;}setMessage('Подготовка запуска…');setBusy(true);const args=(selected.args||[]).map(a=>String(a).replaceAll('{nickname}',nickname.trim()));const r=await window.aliant.launch(selected.executable,args);setMessage(r?.error||'Запуск передан системе');setBusy(false);}
 return <div className="app-shell">
  <aside className="sidebar">
   <div className="brand-card"><div className="brand-mark">A</div><div><b>ALIANT</b><small>ROLEPLAY LAUNCHER</small></div><span className="brand-dot"/></div>
   <div className="side-label">ИГРОВЫЕ СЕРВЕРЫ</div>
   <button className={`server-row ${tab==='home'?'active':''}`} onClick={()=>{setTab('home');setShowServers(!showServers)}}><span className="server-hex"><Flame size={21}/></span><span className="server-info"><b>{selected?.name||'Black Test'}</b><small>{selected?.description||'Игровой сервер'}</small></span><span className="server-online"><i/> {selected?.online ?? '—'}{selected?.maxPlayers?` / ${selected.maxPlayers}`:''}</span><ChevronDown size={16}/></button>
   {showServers&&<div className="server-dropdown">{config.servers.map(s=><button key={s.id} onClick={()=>{setServer(s.id);setShowServers(false);setMessage(`Выбран сервер ${s.name}`)}}><span className="mini-hex"/><span><b>{s.name}</b><small>{s.description||'Aliant Roleplay'}</small></span></button>)}</div>}

  </aside>
  <main className="main-panel">
   <header className="topbar"><div className="profile"><div className="profile-icon"><Gamepad2 size={18}/></div><div><small>ALIANT CONTROL CENTER</small><b>Игровой лаунчер</b></div><button title="Настройки" onClick={()=>setTab('settings')}><Settings size={18}/></button></div><div className="window-actions"><button title="Свернуть" onClick={()=>window.aliant.minimize()}><Minus size={17}/></button><button title="Развернуть" onClick={()=>window.aliant.maximize()}><span className="maximize-icon"/></button><button title="Закрыть" onClick={()=>window.aliant.close()}><X size={17}/></button></div></header>
   <nav className="nav">{[['home','ГЛАВНАЯ'],['site','НАШ САЙТ'],['forum','ФОРУМ'],['shop','МАГАЗИН'],['support','ПОМОЩЬ']].map(([id,label])=>id==='home'?<button key={id} className={tab==='home'?'nav-active':''} onClick={()=>setTab('home')}>{label}</button>:<button key={id} onClick={()=>link(id)&&window.aliant.openUrl(link(id))}>{label}<ExternalLink size={11}/></button>)}</nav>
   {tab==='settings'?<section className="settings-page"><div className="eyebrow">ALIANT CONTROL CENTER</div><h1>Настройки</h1><p className="muted">Настройте расположение игры и проверьте состояние лаунчера.</p><div className="setting-card"><div className="setting-icon"><FolderOpen/></div><div className="setting-content"><b>Папка игры</b><p>{gamePath||'Папка игры не выбрана'}</p><button className="secondary-btn" onClick={choosePath}>Выбрать папку</button></div></div><div className="setting-card"><div className="setting-icon"><RefreshCw/></div><div className="setting-content"><b>Обновление лаунчера</b><p>{update||`Текущая версия ${version}`}</p><button className="secondary-btn" onClick={async()=>{const r=await window.aliant.checkUpdate();if(r?.error)setUpdate(`Ошибка: ${r.error}`);else setUpdate(update||'Проверка обновлений запущена');}}>Проверить обновления</button></div></div><div className="setting-card"><div className="setting-icon"><Monitor/></div><div className="setting-content"><b>Файлы игры</b><p>Игровые файлы можно синхронизировать из опубликованного манифеста. Источник настраивается владельцем проекта.</p><button className="secondary-btn" onClick={async()=>{setBusy(true);setMessage('Проверяем и обновляем игровые файлы…');const r=await window.aliant.updateGame();setMessage(r?.error||`Проверка завершена. Обновлено файлов: ${r.updated}`);setBusy(false);}}>Проверить файлы</button></div></div></section>
   :<section className="home-page"><div className="compact-heading"><div><div className="eyebrow"><span/> BLACK TEST</div><h1>Игровой сервер</h1><p>Введи ник и подключайся к игре.</p></div><span className="version-pill">ALIANT v{version}</span></div><div className="login-card"><label htmlFor="nickname">ИГРОВОЙ НИК</label><div className="login-row"><input id="nickname" value={nickname} onChange={e=>setNickname(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')saveNickname()}} placeholder="Например, Fenix_Dinero" maxLength={24}/><button className="secondary-btn" onClick={saveNickname}>Сохранить ник</button></div><small>Ник сохранится после закрытия лаунчера.</small></div>
    <div className="section-head"><div><div className="eyebrow">ТВОЯ ТОЧКА ВХОДА</div><h2>Игровой сервер</h2></div><span className="server-count"><span className="status-led"/> {config.servers.length} СЕРВЕР(А)</span></div>
    <div className="server-card"><div className="server-card-mark"><Flame size={27}/></div><div className="server-card-info"><div className="server-name">{selected?.name||'Black Test'} <span className="test-tag">BETA</span></div><p>{selected?.description||'Основной сервер Aliant'}</p><div className="server-meta"><span><Users size={14}/> Онлайн: {selected?.online ?? '—'}{selected?.maxPlayers?` / ${selected.maxPlayers}`:''}</span><span><Shield size={14}/> {selected?.status==='online'?'СЕРВЕР ДОСТУПЕН':'СТАТУС НЕИЗВЕСТЕН'}</span></div></div><button className="server-play" onClick={launch} disabled={busy}><Play size={19} fill="currentColor"/></button></div>
    <div className="notice"><div className="notice-icon"><RefreshCw size={18}/></div><div className="notice-text"><b>{updateReady?'Обновление готово':updateAvailable?'Доступно обновление лаунчера':'Обновления без лишних действий'}</b><p>{update||'При запуске лаунчер проверяет новую версию. Игровые файлы и настройки не удаляются.'}</p>{updateAvailable&&updateProgress>0&&<div className="progress-track"><span style={{width:`${updateProgress}%`}}/></div>}</div><button className="update-action" onClick={updateAvailable?updateLauncher:refresh} aria-label="Обновить">{updateReady?'Перезапустить':updateAvailable?'Обновить':<RefreshCw size={16}/>}</button></div>
   </section>}
   
  </main>
 </div>
}
createRoot(document.getElementById('root')).render(<App/>);