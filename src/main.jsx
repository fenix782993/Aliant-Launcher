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
 const [gamePath,setGamePath]=useState(''), [busy,setBusy]=useState(false), [message,setMessage]=useState('Подключаемся к серверам Aliant…');
 const [tab,setTab]=useState('home'), [showServers,setShowServers]=useState(false), [update,setUpdate]=useState('');
 useEffect(()=>{(async()=>{
   try { setVersion(await window.aliant.version()); } catch {}
   const p=await window.aliant.gamePath().catch(()=> ''); setGamePath(p);
   const c=await window.aliant.config().catch(()=>null);
   if(c && c.servers?.length){setConfig(c);setServer(c.selectedServer || c.servers[0].id);setMessage('Конфигурация обновлена');}
   else setMessage('Не удалось загрузить удалённую конфигурацию. Проверьте адрес GitHub.');
   window.aliant.on('app:update-available',v=>setUpdate(`Доступно обновление ${v}`));
   window.aliant.on('app:update-ready',()=>setUpdate('Обновление загружено — перезапустите лаунчер'));
   window.aliant.on('app:update-progress',v=>setUpdate(`Загрузка обновления: ${v}%`));
   window.aliant.on('app:update-error',e=>setUpdate(`Ошибка обновления: ${e}`));
 })()},[]);
 const selected=config.servers.find(s=>s.id===server)||config.servers[0]||fallback.servers[0];
 const link=(key)=>config.links?.[key]||'';
 async function refresh(){setBusy(true);setMessage('Проверяем обновления и конфигурацию…');const c=await window.aliant.config().catch(()=>null);if(c&&!c.error&&c.servers?.length){setConfig(c);setServer(c.selectedServer||c.servers[0].id);setMessage('Данные сервера обновлены');}else setMessage(c?.error||'Не удалось обновить конфигурацию');await window.aliant.checkUpdate().catch(()=>{});setBusy(false);}
 async function choosePath(){const p=await window.aliant.chooseGamePath();if(p){setGamePath(p);setMessage('Папка игры сохранена');}}
 async function launch(){if(!gamePath){setMessage('Сначала выберите папку установленной игры в настройках.');setTab('settings');return;}if(!selected?.executable){setMessage('Руководитель ещё не настроил EXE игры для этого сервера.');return;}setMessage('Подготовка запуска…');setBusy(true);const r=await window.aliant.launch(selected.executable,selected.args||[]);setMessage(r?.error||'Запуск передан системе');setBusy(false);}
 return <div className="app-shell">
  <aside className="sidebar">
   <div className="brand-card"><div className="brand-mark">A</div><div><b>ALIANT</b><small>ROLEPLAY LAUNCHER</small></div><span className="brand-dot"/></div>
   <div className="side-label">ИГРОВЫЕ СЕРВЕРЫ</div>
   <button className={`server-row ${tab==='home'?'active':''}`} onClick={()=>{setTab('home');setShowServers(!showServers)}}><span className="server-hex"><Flame size={21}/></span><span className="server-info"><b>{selected?.name||'Black Test'}</b><small>{selected?.description||'Игровой сервер'}</small></span><span className="server-online"><i/> {selected?.online ?? '—'}{selected?.maxPlayers?` / ${selected.maxPlayers}`:''}</span><ChevronDown size={16}/></button>
   {showServers&&<div className="server-dropdown">{config.servers.map(s=><button key={s.id} onClick={()=>{setServer(s.id);setShowServers(false);setMessage(`Выбран сервер ${s.name}`)}}><span className="mini-hex"/><span><b>{s.name}</b><small>{s.description||'Aliant Roleplay'}</small></span></button>)}</div>}
   <div className="side-spacer"/>
   <div className="character-art"><div className="red-orbit"/><div className="character-emblem"><Shield size={64}/></div><div className="character-copy"><span>ТВОЙ МИР.</span><strong>ТВОИ ПРАВИЛА.</strong></div></div>
   <button className="play-button" onClick={launch} disabled={busy}><Play size={23} fill="currentColor"/><span><b>ИГРАТЬ</b><small>{busy?'Подождите…':'Войти в Aliant'}</small></span></button>
   <div className="sidebar-bottom"><span className="status-led"/> СИСТЕМА ЛАУНЧЕРА <b>ONLINE</b></div>
  </aside>
  <main className="main-panel">
   <header className="topbar"><div className="profile"><div className="profile-icon"><Gamepad2 size={18}/></div><div><small>ИГРОВОЙ ПРОФИЛЬ</small><b>Игрок Aliant</b></div><button title="Настройки" onClick={()=>setTab('settings')}><Settings size={18}/></button></div><div className="window-actions"><button title="Свернуть" onClick={()=>window.aliant.minimize()}><Minus size={17}/></button><button title="Развернуть" onClick={()=>window.aliant.maximize()}><span className="maximize-icon"/></button><button title="Закрыть" onClick={()=>window.aliant.close()}><X size={17}/></button></div></header>
   <nav className="nav">{[['home','ГЛАВНАЯ'],['site','НАШ САЙТ'],['forum','ФОРУМ'],['shop','МАГАЗИН'],['support','ПОМОЩЬ']].map(([id,label])=>id==='home'?<button key={id} className={tab==='home'?'nav-active':''} onClick={()=>setTab('home')}>{label}</button>:<button key={id} onClick={()=>link(id)&&window.aliant.openUrl(link(id))}>{label}<ExternalLink size={11}/></button>)}</nav>
   {tab==='settings'?<section className="settings-page"><div className="eyebrow">ALIANT CONTROL CENTER</div><h1>Настройки</h1><p className="muted">Настройте расположение игры и проверьте состояние лаунчера.</p><div className="setting-card"><div className="setting-icon"><FolderOpen/></div><div className="setting-content"><b>Папка игры</b><p>{gamePath||'Папка игры не выбрана'}</p><button className="secondary-btn" onClick={choosePath}>Выбрать папку</button></div></div><div className="setting-card"><div className="setting-icon"><RefreshCw/></div><div className="setting-content"><b>Обновление лаунчера</b><p>{update||`Текущая версия ${version}`}</p><button className="secondary-btn" onClick={refresh}>Проверить обновления</button></div></div><div className="setting-card"><div className="setting-icon"><Monitor/></div><div className="setting-content"><b>Файлы игры</b><p>Игровые файлы можно синхронизировать из опубликованного манифеста. Источник настраивается владельцем проекта.</p><button className="secondary-btn" onClick={async()=>{setBusy(true);setMessage('Проверяем и обновляем игровые файлы…');const r=await window.aliant.updateGame();setMessage(r?.error||`Проверка завершена. Обновлено файлов: ${r.updated}`);setBusy(false);}}>Проверить файлы</button></div></div></section>
   :<section className="home-page"><div className="welcome"><div className="welcome-content"><div className="eyebrow"><span/> ОФИЦИАЛЬНЫЙ ЛАУНЧЕР</div><h1>ТВОЯ ИСТОРИЯ<br/><em>НАЧИНАЕТСЯ ЗДЕСЬ.</em></h1><p>Подключайся к миру Aliant. Выбирай сервер, обновляй клиент и отправляйся навстречу своей истории.</p><div className="welcome-actions"><button className="primary-btn" onClick={launch} disabled={busy}><Play size={18} fill="currentColor"/> {busy?'ЗАГРУЗКА…':'ЗАПУСТИТЬ ИГРУ'}</button><button className="outline-btn" onClick={refresh}><RefreshCw size={16}/> ОБНОВИТЬ ДАННЫЕ</button></div><div className="live-note"><span className="status-led"/>{message}</div></div><div className="hero-symbol"><div className="symbol-ring ring-one"/><div className="symbol-ring ring-two"/><div className="symbol-a">A</div><div className="symbol-caption">ALIANT <span>ROLEPLAY</span></div></div></div>
    <div className="section-head"><div><div className="eyebrow">ТВОЯ ТОЧКА ВХОДА</div><h2>Игровой сервер</h2></div><span className="server-count"><span className="status-led"/> {config.servers.length} СЕРВЕР(А)</span></div>
    <div className="server-card"><div className="server-card-mark"><Flame size={27}/></div><div className="server-card-info"><div className="server-name">{selected?.name||'Black Test'} <span className="test-tag">BETA</span></div><p>{selected?.description||'Основной сервер Aliant'}</p><div className="server-meta"><span><Users size={14}/> Онлайн: {selected?.online ?? '—'}{selected?.maxPlayers?` / ${selected.maxPlayers}`:''}</span><span><Shield size={14}/> {selected?.status==='online'?'СЕРВЕР ДОСТУПЕН':'СТАТУС НЕИЗВЕСТЕН'}</span></div></div><button className="server-play" onClick={launch}><Play size={19} fill="currentColor"/></button></div>
    <div className="notice"><div className="notice-icon"><RefreshCw size={18}/></div><div><b>Обновления без лишних действий</b><p>Лаунчер проверяет новую версию при запуске. Изменения серверов и оформления загружаются из конфигурации проекта.</p></div><button onClick={refresh} aria-label="Обновить"><RefreshCw size={16}/></button></div>
    <div className="bottom-banner"><div className="banner-slash"/><div><small>{config.banner?.subtitle||'ТВОЙ МИР • ТВОИ ПРАВИЛА'}</small><b>{config.banner?.title||'ALIANT ROLEPLAY'}</b></div><div className="banner-right">A<span>.</span></div></div>
   </section>}
   <footer><span>{config.footer||'ALIANT ROLEPLAY'}</span><span>LAUNCHER v{version}</span></footer>
  </main>
 </div>
}
createRoot(document.getElementById('root')).render(<App/>);