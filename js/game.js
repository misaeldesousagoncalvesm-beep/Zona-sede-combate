// =====================================================================
//  ZONA DE COMBATE — OPERAÇÃO APOCALIPSE (v2)
//  Campanha de 30 etapas, 6 mundos, 6 chefes, 7 armas, 6 personagens,
//  progressão com XP, moedas, loja, conquistas e salvamento automático.
//  Arquivo único, sem dependências. Canvas 2D + Web Audio.
// =====================================================================

// ----- Constantes -----
const GW=960, GH=540, GY=430, GRAV=2100, JUMP_V=-780, ENEMY_JUMP=-640, TOTAL=50;
const FONT='"Trebuchet MS",Verdana,Impact,sans-serif';
const SAVE_KEY='zc_save_v2';
const cv=document.getElementById('game');
const ctx=cv.getContext('2d');
const DPR=Math.min(1.5,window.devicePixelRatio||1);
cv.width=Math.round(GW*DPR); cv.height=Math.round(GH*DPR);

// ----- Utilitários -----
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick1=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rectHit=(a,b)=>a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
function rngSeed(s){ let x=(s>>>0)||1; return ()=>{ x^=x<<13; x>>>=0; x^=x>>>17; x^=x<<5; x>>>=0; return x/4294967296; }; }

// =====================================================================
//  SALVAMENTO (localStorage) — progresso, moedas, XP, desbloqueios
// =====================================================================
function defaultSave(){
  return {
    unlocked:1, cleared:{}, stageBest:{}, records:[],
    coins:0, totalCoins:0, xp:0, totalKills:0, worlds:0, perfect:0,
    heroes:['brisa'], hero:'brisa',
    weapons:['pistola'], weapon:'pistola', wlv:{},
    upg:{hp:0,dmg:0,ammo:0},
    ach:{},
    settings:{music:true,sfx:true,musVol:5,sfxVol:7,layout:'padrao'}
  };
}
let SAVE=loadSave();
function loadSave(){
  try{
    const s=JSON.parse(localStorage.getItem(SAVE_KEY));
    const d=defaultSave();
    return s ? Object.assign(d,s,{settings:Object.assign(d.settings,s.settings||{}),upg:Object.assign(d.upg,s.upg||{})}) : d;
  }catch(e){ return defaultSave(); }
}
function persist(){ try{ localStorage.setItem(SAVE_KEY,JSON.stringify(SAVE)); }catch(e){} }
function playerLevel(){ return 1+Math.floor(SAVE.xp/400); }
function addCoins(n){ SAVE.coins+=n; SAVE.totalCoins+=n; }

// =====================================================================
//  DADOS DO JOGO
// =====================================================================
const WORLDS=[
  {nome:'Cidade em Ruínas',boss:'GENERAL DE FERRO',titulo:'Mestre dos Tanques',draw:'general',root:0,particle:'dust',
   theme:{sky1:'#2b2d42',sky2:'#8d5a7c',far:'#3d3552',mid:'#4a4e69',plat:'#6b705c',plat2:'#3a3f35',accent:'#ffb703'}},
  {nome:'Deserto de Sucata',boss:'COLOSSO',titulo:'Gigante de Metal',draw:'colosso',root:3,particle:'sand',
   theme:{sky1:'#ffb347',sky2:'#ffe6a7',far:'#d68c45',mid:'#c17a3b',plat:'#b5835a',plat2:'#7f5539',accent:'#fff3b0'}},
  {nome:'Floresta Neon',boss:'CAÇADOR SOMBRIO',titulo:'Predador das Sombras',draw:'cacador',root:5,particle:'leaf',
   theme:{sky1:'#0b132b',sky2:'#1c4b5a',far:'#1b3a4b',mid:'#16423c',plat:'#4f772d',plat2:'#31572c',accent:'#4cc9f0'}},
  {nome:'Base Subterrânea',boss:'COMANDANTE X',titulo:'Mente do Laboratório',draw:'comandante',root:7,particle:'spark',
   theme:{sky1:'#1a1a2e',sky2:'#16213e',far:'#222e50',mid:'#2b3a55',plat:'#5c677d',plat2:'#3d4a5c',accent:'#ff4d6d'}},
  {nome:'Fortaleza Ártica',boss:'TITÃ GLACIAL',titulo:'Coração de Gelo',draw:'titan',root:9,particle:'snow',
   theme:{sky1:'#8ecae6',sky2:'#e0fbfc',far:'#a8dadc',mid:'#7fb3d5',plat:'#dbe9f4',plat2:'#9bb7cc',accent:'#ffffff'}},
  {nome:'Núcleo Apocalipse',boss:'IMPERADOR ZERO',titulo:'Senhor do Fim',draw:'imperador',root:10,particle:'ember',
   theme:{sky1:'#14001f',sky2:'#4a0d2a',far:'#2b0a20',mid:'#3d0f2c',plat:'#5a2d4a',plat2:'#2b1224',accent:'#ff6a00'}},
  {nome:'Cais Abandonado',boss:'SERPENTE DE AÇO',titulo:'Terror dos Portos',draw:'serpente',root:0,particle:'spark',
   theme:{sky1:'#1b3a4b',sky2:'#5fa8d3',far:'#274c60',mid:'#2e5d73',plat:'#7c8c8f',plat2:'#3d4f56',accent:'#ffd166'}},
  {nome:'Mina Vulcânica',boss:'MESTRE DOS VULCÕES',titulo:'Senhor da Lava',draw:'vulcao',root:2,particle:'ember',
   theme:{sky1:'#2a0a0a',sky2:'#c1121f',far:'#3b0f0f',mid:'#5c1a12',plat:'#4a3b36',plat2:'#261c19',accent:'#ff7b00'}},
  {nome:'Estação Orbital',boss:'COMANDANTE ORBITAL',titulo:'Guardião do Espaço',draw:'orbital',root:4,particle:'spark',
   theme:{sky1:'#03045e',sky2:'#0077b6',far:'#14213d',mid:'#23395d',plat:'#8d99ae',plat2:'#3d4a5c',accent:'#90e0ef'}},
  {nome:'Abismo do Vazio',boss:'O VAZIO',titulo:'O Fim de Tudo',draw:'vazio',root:6,particle:'dust',
   theme:{sky1:'#000000',sky2:'#240046',far:'#10002b',mid:'#1f0a3a',plat:'#3c096c',plat2:'#10002b',accent:'#c77dff'}}
];
const BOSS_HP=[900,1300,1600,2000,2400,3200,3800,4500,5300,6200];
const BOSS_SIZE=[[90,150],[110,170],[100,160],[120,170],[130,180],[110,190],[120,160],[130,190],[110,170],[120,180]];
const BOSS_ATKS=[
  ['barrage','charge'],
  ['barrage','charge','stomp'],
  ['stomp','laser','charge','barrage','summon']
];
const STAGE_NAMES=['Rua Principal','Becos Escondidos','Depósito Secreto','Rota de Fuga','Arena do Chefe'];
const MODS=['nenhum','vento','escuro','bonus'];

const HEROES=[
  {id:'brisa',nome:'Sargento Brisa',desc:'Equilibrada e confiável.',hp:100,speed:230,dmg:12,fire:0.20,cost:0,
   skill:{nome:'Escudo Tático',id:'escudo',cd:12},
   look:{skin:'#f1c27d',hair:'#3b2a1a',hairStyle:'short',shirt:'#5f7a3b',pants:'#3d4a2e',boots:'#2b1d12',hat:'cap',hatCol:'#4a5e2c',gun:'rifle',gunCol:'#2d2d2d',glasses:false}},
  {id:'nina',nome:'Nina Foguete',desc:'Muito rápida e dispara sem parar.',hp:80,speed:290,dmg:9,fire:0.12,cost:300,
   skill:{nome:'Turbo',id:'turbo',cd:6},
   look:{skin:'#f5d0a9',hair:'#e0572b',hairStyle:'long',shirt:'#ff8c42',pants:'#263246',boots:'#111',hat:'none',gun:'pistol',gunCol:'#444',glasses:false}},
  {id:'barril',nome:'Tenente Barril',desc:'Resistente, com tiro pesado.',hp:150,speed:170,dmg:24,fire:0.32,cost:600,
   skill:{nome:'Barreira',id:'barreira',cd:15},
   look:{skin:'#c68642',hair:'#111',hairStyle:'bald',shirt:'#7f8c8d',pants:'#34495e',boots:'#222',hat:'bandana',hatCol:'#c0392b',gun:'heavy',gunCol:'#2b2b2b',glasses:false}},
  {id:'vovo',nome:'Vovó Cartucho',desc:'Calma, precisa e corajosa.',hp:110,speed:200,dmg:15,fire:0.22,cost:500,
   skill:{nome:'Curativo',id:'curar',cd:14},
   look:{skin:'#e8b48a',hair:'#eeeeee',hairStyle:'bun',shirt:'#7b2cbf',pants:'#2b2d42',boots:'#4a2c1a',hat:'none',gun:'rifle',gunCol:'#555',glasses:true}},
  {id:'chip',nome:'Doutor Chip',desc:'Pulo duplo e pulso EMP.',hp:90,speed:215,dmg:13,fire:0.18,cost:0,req:{world:2},double:true,
   skill:{nome:'Pulso EMP',id:'emp',cd:12},
   look:{skin:'#f5d0a9',hair:'#5a3825',hairStyle:'short',shirt:'#ffffff',pants:'#6c757d',boots:'#222',hat:'none',gun:'pistol',gunCol:'#00b4d8',glasses:true}},
  {id:'aco',nome:'Ranger Aço',desc:'Blindado. Dispara em rajada.',hp:130,speed:190,dmg:14,fire:0.2,cost:0,req:{world:3},
   skill:{nome:'Rajada',id:'rajada',cd:10},
   look:{skin:'#c68642',hair:'#111',hairStyle:'none',shirt:'#2a9d8f',pants:'#264653',boots:'#111',hat:'helmet',hatCol:'#264653',gun:'heavy',gunCol:'#1d3557',glasses:false}}
];

// unlock = etapa em que a arma é liberada (campanha)
const WEAPONS=[
  {id:'pistola',nome:'Pistola de Combate',dmg:12,rate:0.22,speed:720,ammo:Infinity,pellets:1,spread:0,color:'#ffd60a',size:3,life:1.0,snd:'shot',stage:1},
  {id:'rifle',nome:'Rifle de Assalto',dmg:9,rate:0.085,speed:820,ammo:150,pellets:1,spread:0.02,color:'#ffe066',size:3,life:1.0,snd:'shot',stage:2},
  {id:'escopeta',nome:'Escopeta Futurista',dmg:7,rate:0.6,speed:620,ammo:40,pellets:6,spread:0.22,color:'#ff9f1c',size:3,life:0.45,snd:'boom',stage:4},
  {id:'energia',nome:'Rifle de Energia',dmg:16,rate:0.14,speed:950,ammo:80,pellets:1,spread:0,color:'#4cc9f0',size:4,life:1.1,pierce:true,snd:'special',stage:8},
  {id:'plasma',nome:'Canhão de Plasma',dmg:42,rate:0.7,speed:480,ammo:30,pellets:1,spread:0,color:'#b388ff',size:8,life:1.8,aoe:60,snd:'boom',stage:14},
  {id:'lanca',nome:'Lançador de Energia',dmg:55,rate:0.9,speed:420,ammo:12,pellets:1,spread:0,color:'#ff4d6d',size:6,life:2.2,aoe:90,grav:150,snd:'boom',stage:20},
  {id:'exp',nome:'Arma Experimental',dmg:20,rate:0.1,speed:600,ammo:70,pellets:1,spread:0.1,color:'#6ddb5a',size:4,life:2.0,homing:true,snd:'enemyShot',stage:27}
];
const WEAPON_BY={}; WEAPONS.forEach(w=>WEAPON_BY[w.id]=w);

// Inimigos
const ENEMY={
  soldado:{nome:'Soldado',w:30,h:56,hp:30,speed:90,detect:420,range:520,fire:1.6,dmg:9,pts:100,sc:1,kind:'human',minW:0,
    look:{skin:'#d9a066',hair:'#222',hairStyle:'none',shirt:'#55633a',pants:'#3b4a2b',boots:'#1d1d1d',hat:'helmet',hatCol:'#4b5320',gun:'rifle',gunCol:'#222',glasses:false}},
  elite:{nome:'Soldado de Elite',w:32,h:58,hp:60,speed:125,detect:500,range:600,fire:0.9,dmg:12,pts:160,sc:1.03,kind:'human',minW:1,
    look:{skin:'#e8b48a',hair:'#111',hairStyle:'short',shirt:'#3d2b56',pants:'#222',boots:'#000',hat:'cap',hatCol:'#111',gun:'rifle',gunCol:'#666',glasses:true}},
  robo:{nome:'Robô de Combate',w:40,h:62,hp:70,speed:95,detect:400,range:0,fire:0,melee:16,pts:150,sc:1,kind:'robot',minW:1},
  voador:{nome:'Drone Voador',w:34,h:24,hp:35,speed:110,detect:520,range:560,fire:1.4,dmg:10,pts:140,sc:1,kind:'drone',fly:true,minW:0,stageMin:2},
  blindado:{nome:'Blindado',w:40,h:70,hp:110,speed:70,detect:420,range:500,fire:1.8,dmg:12,pts:220,sc:1.25,kind:'human',shield:true,minW:1,
    look:{skin:'#b0734b',hair:'#111',hairStyle:'short',shirt:'#1f3a5f',pants:'#2d2d2d',boots:'#111',hat:'helmet',hatCol:'#1f3a5f',gun:'heavy',gunCol:'#333',glasses:false}},
  ninja:{nome:'Ninja',w:26,h:54,hp:48,speed:150,detect:460,range:0,fire:0,melee:14,pts:180,sc:1,kind:'human',minW:3,
    look:{skin:'#c68642',hair:'#111',hairStyle:'none',shirt:'#111111',pants:'#111111',boots:'#000',hat:'bandana',hatCol:'#111',gun:'pistol',gunCol:'#222',glasses:false}},
  mech:{nome:'Mech Pesado',w:56,h:84,hp:190,speed:55,detect:560,range:700,fire:2.6,dmg:22,melee:0,pts:320,sc:1,kind:'robot',minW:4},
  dronePesado:{nome:'Drone Blindado',w:44,h:30,hp:95,speed:90,detect:540,range:600,fire:1.9,dmg:16,pts:260,sc:1,kind:'drone',fly:true,minW:3},
  atirador:{nome:'Atirador de Longa Distância',w:30,h:56,hp:42,speed:70,detect:700,range:900,fire:2.3,dmg:18,pts:200,sc:1,kind:'human',minW:2,
    look:{skin:'#f1c27d',hair:'#666',hairStyle:'long',shirt:'#222',pants:'#333',boots:'#000',hat:'cap',hatCol:'#111',gun:'rifle',gunCol:'#000',glasses:false}}
};

const ACH=[
  {id:'primeiro',nome:'Primeiro abate',desc:'Derrube seu primeiro inimigo.',ok:()=>SAVE.totalKills>=1},
  {id:'cem',nome:'Cem abates',desc:'Derrube 100 inimigos.',ok:()=>SAVE.totalKills>=100},
  {id:'rico',nome:'Colecionador',desc:'Acumule 1000 moedas.',ok:()=>SAVE.totalCoins>=1000},
  {id:'intocavel',nome:'Intocável',desc:'Conclua uma etapa sem perder vida.',ok:()=>SAVE.perfect>0},
  {id:'mundo1',nome:'General caiu',desc:'Derrote o General de Ferro.',ok:()=>SAVE.worlds>=1},
  {id:'mundo6',nome:'Fim da zona',desc:'Derrote o Imperador Zero.',ok:()=>SAVE.worlds>=6},
  {id:'mundo10',nome:'Fim de tudo',desc:'Derrote O Vazio, o último chefe.',ok:()=>SAVE.worlds>=10},
  {id:'armas',nome:'Arsenal completo',desc:'Desbloqueie todas as armas.',ok:()=>WEAPONS.every(w=>SAVE.weapons.includes(w.id))},
  {id:'herois',nome:'Esquadrão',desc:'Desbloqueie todos os personagens.',ok:()=>HEROES.every(h=>SAVE.heroes.includes(h.id))}
];
function checkAch(){
  let got=null;
  for(const a of ACH){
    if(!SAVE.ach[a.id] && a.ok()){ SAVE.ach[a.id]=true; SAVE.coins+=50; got=a; }
  }
  if(got) toast('CONQUISTA: '+got.nome+' (+50 moedas)');
}

// =====================================================================
//  ÁUDIO — efeitos e trilha procedural (Web Audio)
// =====================================================================
let AC=null;
function ac(){
  if(!AC){ const C=window.AudioContext||window.webkitAudioContext; if(C) AC=new C(); }
  if(AC && AC.state==='suspended') AC.resume();
  return AC;
}
function sfxMul(){ return SAVE.settings.sfx ? SAVE.settings.sfxVol/7 : 0; }
function toneAt(t0,f1,f2,dur,type,vol){
  const c=ac(); if(!c||vol<=0) return;
  const o=c.createOscillator(), g=c.createGain();
  o.type=type; o.frequency.setValueAtTime(f1,t0);
  if(f2) o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t0+dur);
  g.gain.setValueAtTime(vol,t0);
  g.gain.exponentialRampToValueAtTime(0.001,t0+dur);
  o.connect(g); g.connect(c.destination);
  o.start(t0); o.stop(t0+dur+0.03);
}
function noiseAt(t0,dur,vol){
  const c=ac(); if(!c||vol<=0) return;
  const len=Math.floor(c.sampleRate*dur);
  const b=c.createBuffer(1,len,c.sampleRate), d=b.getChannelData(0);
  for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*(1-i/len);
  const s=c.createBufferSource(); s.buffer=b;
  const g=c.createGain(); g.gain.value=vol;
  s.connect(g); g.connect(c.destination); s.start(t0);
}
function tone(f1,f2,dur,type='square',vol=0.15,delay=0){
  const c=ac(); if(!c) return;
  toneAt(c.currentTime+delay,f1,f2,dur,type,vol*sfxMul());
}
function noise(dur,vol,delay=0){
  const c=ac(); if(!c) return;
  noiseAt(c.currentTime+delay,dur,vol*sfxMul());
}
const SFX={
  shot:()=>{ noise(0.07,0.12); tone(900,300,0.08,'square',0.08); },
  enemyShot:()=>{ tone(520,240,0.1,'sawtooth',0.05); },
  hit:()=>{ tone(400,120,0.08,'square',0.08); },
  boom:()=>{ noise(0.5,0.25); tone(120,40,0.5,'sawtooth',0.2); },
  special:()=>{ tone(300,1000,0.4,'sawtooth',0.12); tone(450,1500,0.35,'sine',0.08,0.08); },
  hurt:()=>{ tone(320,80,0.25,'triangle',0.2); },
  jump:()=>{ tone(260,520,0.12,'sine',0.12); },
  pick:()=>{ tone(660,990,0.1,'triangle',0.15); tone(990,1320,0.12,'triangle',0.12,0.08); },
  coin:()=>{ tone(1200,1800,0.08,'triangle',0.1); },
  phase:()=>{ [523,659,784,1046].forEach((f,i)=>tone(f,f,0.18,'square',0.12,i*0.1)); },
  win:()=>{ [523,659,784,1046,1318].forEach((f,i)=>tone(f,f,0.3,'square',0.13,i*0.14)); },
  lose:()=>{ [440,370,311,247].forEach((f,i)=>tone(f,f*0.8,0.3,'sawtooth',0.14,i*0.22)); },
  bossRoar:()=>{ tone(90,40,1.2,'sawtooth',0.25); noise(0.8,0.2,0.1); },
  bossDie:()=>{ [200,160,120,80,60].forEach((f,i)=>tone(f,f*0.5,0.4,'sawtooth',0.2,i*0.25)); noise(1.5,0.3,0.4); },
  clink:()=>{ tone(1500,900,0.1,'square',0.1); tone(1900,1200,0.08,'triangle',0.06,0.03); },
  select:()=>{ tone(660,990,0.08,'square',0.1); },
  tick:()=>{ tone(880,880,0.05,'square',0.06); },
  alarm:()=>{ tone(700,500,0.2,'square',0.1); tone(700,500,0.2,'square',0.1,0.25); }
};
function sfx(n){ try{ if(SFX[n]) SFX[n](); }catch(e){} }

// Trilha procedural: uma linha de baixo + arpejo por mundo
const MUS_SCALE=[0,3,5,7,10,12];
const MUS_BASS=[0,0,3,0,5,0,3,7];
let mNext=0, mStep=0;
function musicTick(){
  if(!SAVE.settings.music || !G) return;
  const c=AC; if(!c || c.state!=='running') return;
  const root=65.4*Math.pow(2,WORLDS[G.w].root/12);
  const bpm=96+G.w*6, stepLen=60/bpm/2;
  const vol=SAVE.settings.musVol/7;
  if(mNext<c.currentTime) mNext=c.currentTime+0.05;
  while(mNext<c.currentTime+0.12){
    const s=mStep%8;
    const f=root*Math.pow(2,MUS_BASS[s]/12);
    toneAt(mNext,f,f,stepLen*0.9,'triangle',0.09*vol);
    if(mStep%2===0){
      const a=root*4*Math.pow(2,MUS_SCALE[(mStep>>1)%6]/12);
      toneAt(mNext,a,a,stepLen*0.5,'square',0.025*vol);
    }
    if(s===0||s===4) noiseAt(mNext,0.05,0.05*vol);
    mNext+=stepLen; mStep++;
  }
}
setInterval(musicTick,40);

// =====================================================================
//  GERAÇÃO DE ETAPAS (30 etapas, variações de mundo, mapa e modificador)
// =====================================================================
function genStage(n){
  const w=Math.floor((n-1)/5), l=((n-1)%5)+1, isBoss=(l===5);
  const r=rngSeed(n*131+17);
  const W = isBoss ? 1900 : 3000+w*120;
  const exitX = W-240;
  const plats=[], crates=[], spikes=[], items=[], spawns=[], movers=[];

  if(isBoss){
    plats.push({x:0,y:GY,w:W,h:GH-GY,kind:'ground'});
  } else {
    let x=0;
    while(x<W){
      const seg=Math.min(260+r()*380,W-x);
      plats.push({x,y:GY,w:seg,h:GH-GY,kind:'ground'});
      x+=seg;
      if(x>300 && x<W-500 && r()<0.5) x+=70+r()*50;
    }
    for(let k=0;k<22;k++){
      plats.push({x:240+r()*(W-500),y:GY-(75+r()*45),w:100+r()*130,h:14,kind:'floor'});
    }
    for(let k=0;k<2;k++){
      const bx=500+r()*(W-1000), by=GY-(95+r()*35), ax=r()<0.6;
      const m={x:bx,y:by,w:120,h:14,kind:'moving',baseX:bx,baseY:by,ax,amp:ax?90+r()*80:40,sp:0.6+r()*0.5,t:r()*6};
      movers.push(m); plats.push(m);
    }
    for(let k=0;k<14;k++){
      const cx=520+r()*(W-1000), cs=38+r()*22;
      if(plats.some(p=>p.kind==='ground' && cx>=p.x+4 && cx+cs<=p.x+p.w-4))
        crates.push({x:cx,y:GY-cs,w:cs,h:cs,hp:40,max:40,secret:k===0 && w>=1});
    }
    for(let k=0;k<10;k++){
      const sx=520+r()*(W-900), sw=40+r()*24;
      const blocked=crates.some(c=>sx<c.x+c.w+10 && sx+sw>c.x-10);
      if(plats.some(p=>p.kind==='ground' && sx>=p.x+4 && sx+sw<=p.x+p.w-4) && !blocked)
        spikes.push({x:sx,y:GY-16,w:sw,h:16});
    }
    // área secreta: plataforma alta com moedas extras
    const sx=W*0.45;
    const seg=plats.find(p=>p.kind==='ground' && sx>=p.x && sx+110<=p.x+p.w);
    if(seg) plats.push({x:sx,y:GY-115,w:110,h:14,kind:'floor',secret:true});
  }

  // itens
  const spotX=()=>200+r()*(W-420);
  const spotY=(x)=>{
    const fl=plats.filter(p=>p.kind==='floor'&&!p.secret&&x>=p.x&&x<=p.x+p.w);
    return fl.length? fl[0].y-22 : GY-22;
  };
  for(let k=0;k<30;k++){ const x=spotX(); items.push({type:'coin',x,y:spotY(x),w:14,h:14,v:5}); }
  for(let k=0;k<6;k++){ const x=spotX(); items.push({type:'ammo',x,y:spotY(x),w:18,h:18}); }
  for(let k=0;k<4;k++){ const x=spotX(); items.push({type:'med',x,y:spotY(x),w:20,h:20}); }
  if(l===3){ for(let k=0;k<5;k++){ const x=300+k*(W-600)/5; items.push({type:'chip',x,y:spotY(x),w:16,h:16}); } }
  const sec=plats.find(p=>p.secret);
  if(sec){ for(let k=0;k<3;k++) items.push({type:'coin',x:sec.x+20+k*30,y:sec.y-22,w:14,h:14,v:12,secret:true}); }

  // inimigos posicionados ao longo da etapa
  if(!isBoss){
    const pool=Object.keys(ENEMY).filter(t=>{
      const T=ENEMY[t];
      return w>=T.minW && n>=(T.stageMin||1);
    });
    let x=650;
    while(x<exitX-500){
      const type=pick1(pool);
      if(ENEMY[type].fly){ spawns.push({type,x,y:GY-210,mini:false}); }
      else if(plats.some(p=>p.kind==='ground' && x>=p.x+10 && x<=p.x+p.w-10)){
        spawns.push({type,x,y:GY,mini:false});
      }
      x+=(330-w*25)*rnd(0.7,1.3);
    }
    if(l===4){
      const mx=W*0.6;
      if(plats.some(p=>p.kind==='ground' && mx>=p.x+10 && mx<=p.x+p.w-10)) spawns.push({type:'blindado',x:mx,y:GY,mini:true});
    }
  }

  const modIdx=Math.floor(r()*MODS.length);
  const mod = isBoss ? 'nenhum' : MODS[modIdx];
  const cps=[700,1400,2100,2800].filter(c=>c<W-300);
  const obj = isBoss ? {type:'boss',text:'Derrote '+WORLDS[w].boss}
    : l===1 ? {type:'kill',target:8+w*2,text:'Elimine inimigos e entre na saída'}
    : l===2 ? {type:'exit',text:'Chegue à saída'}
    : l===3 ? {type:'chipsExit',target:5,text:'Colete os chips e chegue à saída'}
    : {type:'survive',target:60+w*5,text:'Sobreviva ao ataque'};
  if(obj.type==='kill' && spawns.length<obj.target+2) obj.target=Math.max(4,spawns.length-2);

  return {n,w,l,W,isBoss,exitX,plats,crates,spikes,items,spawns,movers,cps,mod,obj,
          name:isBoss?WORLDS[w].boss:STAGE_NAMES[l-1]};
}

// =====================================================================
//  FÍSICA
// =====================================================================
function moveBody(b,dt){
  const L=G.level;
  b.vy=Math.min(900,b.vy+GRAV*dt);
  // horizontal
  b.x+=b.vx*dt;
  for(const c of L.crates){
    if(b.x+b.w>c.x && b.x<c.x+c.w && b.y+b.h>c.y+2 && b.y<c.y+c.h){
      if(b.vx>0) b.x=c.x-b.w;
      else if(b.vx<0) b.x=c.x+c.w;
    }
  }
  b.x=clamp(b.x,0,G.W-b.w);
  // vertical
  const prevBottom=b.y+b.h, prevTop=b.y;
  b.y+=b.vy*dt;
  b.onGround=false; b.riding=null;
  if(b.vy>=0){
    for(const s of L.plats){
      if(b.x+b.w>s.x && b.x<s.x+s.w && prevBottom<=s.y+2 && b.y+b.h>=s.y){
        b.y=s.y-b.h; b.vy=0; b.onGround=true;
        if(s.kind==='moving') b.riding=s;
      }
    }
    for(const c of L.crates){
      if(b.x+b.w>c.x && b.x<c.x+c.w && prevBottom<=c.y+2 && b.y+b.h>=c.y){
        b.y=c.y-b.h; b.vy=0; b.onGround=true;
      }
    }
  } else {
    for(const c of L.crates){
      if(b.x+b.w>c.x && b.x<c.x+c.w && prevTop>=c.y+c.h-1 && b.y<=c.y+c.h){
        b.y=c.y+c.h; b.vy=0;
      }
    }
  }
}

function updateMovers(dt){
  for(const m of G.level.plats){
    if(m.kind!=='moving') continue;
    const px=m.x, py=m.y;
    m.t+=dt*m.sp;
    if(m.ax) m.x=m.baseX+Math.sin(m.t)*m.amp;
    else m.y=m.baseY+Math.sin(m.t)*m.amp;
    const dx=m.x-px, dy=m.y-py;
    for(const b of [G.player,...G.enemies]) if(b.riding===m){ b.x+=dx; b.y+=dy; }
  }
}

function groundAt(x){
  return G.level.plats.some(p=>p.kind==='ground' && x>=p.x && x<=p.x+p.w);
}
function crateAt(x,y){
  for(const c of G.level.crates) if(x>=c.x && x<=c.x+c.w && y>=c.y && y<=c.y+c.h) return c;
  return null;
}
function supportAt(x,feetY){
  for(const s of G.level.plats) if(x>=s.x && x<=s.x+s.w && Math.abs(s.y-feetY)<=6) return true;
  for(const c of G.level.crates) if(x>=c.x && x<=c.x+c.w && Math.abs(c.y-feetY)<=6) return true;
  return false;
}
function findSpawn(x){
  for(const dx of [0,-40,40,-80,80,-120,120,-160,160]){
    if(groundAt(x+dx)) return {x:x+dx-12,y:GY-56};
  }
  return {x:Math.max(20,x-12),y:GY-56};
}

// =====================================================================
//  ETAPA: início, estado e conclusão
// =====================================================================
function startStage(n){
  if(n>SAVE.unlocked) return;
  const lay=genStage(n);
  const hero=HEROES.find(h=>h.id===SAVE.hero)||HEROES[0];
  const lv=playerLevel();
  const maxHp=hero.hp+SAVE.upg.hp*10+(lv-1)*3;
  const ammo={};
  WEAPONS.forEach(w=>ammo[w.id]=w.ammo);
  G={
    n, w:lay.w, l:lay.l, W:lay.W, isBoss:lay.isBoss, mod:lay.mod, windDir:Math.random()<0.5?-1:1,
    level:{plats:lay.plats,crates:lay.crates,spikes:lay.spikes,items:lay.items,movers:lay.movers,exitX:lay.exitX,cps:lay.cps},
    obj:{...lay.obj,progress:0}, name:lay.name,
    enemies:[], bullets:[], hazards:[], parts:[], texts:[],
    boss:null, camX:0, time:0, overlay:null,
    kills:0, chips:0, coins:0, score:0, xp:0, timer:lay.obj.target||0, spawnT:6,
    noDmg:true, shake:0, msg:lay.name, msgT:2.4, cpIdx:0, maxX:0,
    ambient:[], bestNew:false, autoNext:null, rings:[], lights:[]
  };
  G.player={x:120,y:GY-56,w:24,h:56,vx:0,vy:0,facing:1,aim:0,hero,
    hp:maxHp,maxHp,lives:3,dead:0,final:false,cool:0,recoil:0,flash:0,invuln:1.2,
    onGround:false,riding:null,cp:{x:120,y:GY-56},
    skillCd:0,shieldT:0,turboT:0,rapidT:0,barrier:0,
    maxJumps:hero.double?2:1,jumps:hero.double?1:0,
    weapon:SAVE.weapon, ammo};
  if(!SAVE.weapons.includes(G.player.weapon)) G.player.weapon='pistola';
  for(const s of lay.spawns) G.enemies.push(makeEnemy(s.type,s.x,s.y,s.mini));
  if(lay.isBoss) G.boss=makeBoss(lay.w);
  initAmbient();
  scene='game';
  resetHeld();
  UI.btns=[];
  G.overlay=null;
  setScene();
  sfx('alarm');
}

function makeEnemy(type,x,y,mini){
  const T=ENEMY[type], s=mini?1.4:1;
  const mult=(1+G.w*0.12)*(mini?3:1);
  const w=T.w*s, h=T.h*s;
  const e={type,mini,x:x-w/2,y:y-h,w,h,vx:0,vy:0,hp:T.hp*mult,maxHp:T.hp*mult,
    speed:T.speed*(1+G.w*0.05),facing:Math.random()<0.5?-1:1,patrol:Math.random()<0.5?-1:1,
    stateT:rnd(1,3),cool:rnd(0.6,1.4),onGround:false,dead:false,flash:0,anim:0,aim:0,
    stun:0,fly:!!T.fly,baseY:y-h,t:Math.random()*6,riding:null};
  if(e.fly) e.y=e.baseY;
  return e;
}

function makeBoss(w){
  const sz=BOSS_SIZE[w];
  return {
    cfg:WORLDS[w], w0:w, x:1500, y:GY-sz[1], w:sz[0], h:sz[1], tx:1350,
    hp:BOSS_HP[w], maxHp:BOSS_HP[w], phase:1, state:'enter', bannerT:3.2,
    atk:null, atkT:2.2, facing:-1, flash:0, anim:0, dyingT:0, contactCd:0, speedMul:1-0.05*w
  };
}

function initAmbient(){
  G.ambient=[];
  const t=WORLDS[G.w].particle;
  for(let i=0;i<60;i++) G.ambient.push({x:rnd(0,GW),y:rnd(0,GH),vx:rnd(-20,20),vy:rnd(10,60),s:rnd(1,3),t,ph:rnd(0,6)});
}

function killPlayer(fall){
  const p=G.player;
  if(p.dead>0) return;
  p.lives=Math.max(0,p.lives-1);
  p.hp=0; p.dead=2.0; p.final=p.lives<=0;
  explosion(p.x+12,p.y+28,fall?8:26);
  sfx(fall?'hurt':'boom');
  G.msg=fall?'CAIU NO BURACO!':'ABATIDO!'; G.msgT=1.4;
  G.noDmg=false;
}
function respawn(){
  const p=G.player;
  p.x=p.cp.x; p.y=p.cp.y; p.vx=0; p.vy=0;
  p.hp=p.maxHp; p.invuln=2.5; p.dead=0;
}
function hurtPlayer(d){
  const p=G.player;
  if(p.invuln>0 || p.dead>0 || p.shieldT>0) return;
  if(p.barrier>0){ const a=Math.min(p.barrier,d); p.barrier-=a; d-=a; }
  if(d<=0) return;
  p.hp=Math.max(0,p.hp-d);
  G.noDmg=false;
  p.flash=0.2; p.invuln=0.5;
  G.shake=Math.max(G.shake,6);
  sfx('hurt');
  burst(p.x+12,p.y+26,'#ff4d4d',8,180);
  if(p.hp<=0) killPlayer(false);
}

// Habilidades de personagem
function useSkill(){
  const p=G.player, id=p.hero.skill.id;
  if(p.skillCd>0) return;
  p.skillCd=p.hero.skill.cd;
  if(id==='escudo'){ p.shieldT=2.5; addText(p.x,p.y-20,'ESCUDO!','#9be7ff'); }
  if(id==='turbo'){ p.turboT=2.2; addText(p.x,p.y-20,'TURBO!','#ffd60a'); }
  if(id==='barreira'){ p.barrier=40; addText(p.x,p.y-20,'BARREIRA +40','#9be7ff'); }
  if(id==='curar'){ p.hp=Math.min(p.maxHp,p.hp+35); addText(p.x,p.y-20,'+35 VIDA','#6ddb5a'); }
  if(id==='rajada'){ p.rapidT=3; addText(p.x,p.y-20,'RAJADA!','#ff7a1a'); }
  if(id==='emp'){
    addText(p.x,p.y-20,'PULSO EMP!','#4cc9f0');
    burst(p.x+12,p.y+28,'#4cc9f0',30,320);
    for(const e of G.enemies){
      if(Math.hypot(e.x-p.x,e.y-p.y)<340) e.stun=2.5;
    }
    G.bullets=G.bullets.filter(b=>b.owner!=='e' || Math.hypot(b.x-p.x,b.y-p.y)>340);
    G.shake=Math.max(G.shake,6);
  }
  sfx('special');
}

function cycleWeapon(){
  const p=G.player;
  const list=SAVE.weapons.slice();
  const i=list.indexOf(p.weapon);
  p.weapon=list[(i+1)%list.length];
  addText(p.x,p.y-24,WEAPON_BY[p.weapon].nome,'#ffe066');
  sfx('tick');
}

function fire(p){
  const W=WEAPON_BY[p.weapon], H=p.hero;
  const left=p.ammo[W.id];
  if(left!==Infinity && left<=0){ p.cool=0.35; return; }
  if(left!==Infinity) p.ammo[W.id]--;
  const lv=SAVE.wlv[W.id]||0;
  const dmgMul=(1+0.15*lv)*(1+0.1*SAVE.upg.dmg);
  const rate=W.rate*(p.rapidT>0?0.33:1);
  const ox=p.x+p.w/2+p.facing*Math.cos(p.aim)*22;
  const oy=p.y+20-Math.sin(p.aim)*22;
  for(let i=0;i<W.pellets;i++){
    const ang=p.aim+(W.spread?rnd(-W.spread,W.spread):0);
    const sp=W.speed*rnd(0.95,1.05);
    G.bullets.push({x:ox,y:oy,vx:p.facing*Math.cos(ang)*sp,vy:-Math.sin(ang)*sp,
      dmg:W.dmg*dmgMul,owner:'p',life:W.life,col:W.color,size:W.size,
      pierce:!!W.pierce,aoe:W.aoe||0,grav:W.grav||0,homing:!!W.homing,hit:new Set()});
  }
  p.cool=rate; p.recoil=1; p.flash=0.08;
  burst(ox,oy,W.color,4,120);
  G.shake=Math.max(G.shake,1.5);
  sfx(W.snd);
}

// =====================================================================
//  INIMIGOS (IA por tipo)
// =====================================================================
function enemyShoot(e,ex,ey,px,py){
  const T=ENEMY[e.type];
  const dx=px-ex, dy=py-ey;
  const sp=e.type==='atirador'?900:520;
  const ang=Math.atan2(dy,dx)+rnd(-0.07,0.07);
  G.bullets.push({x:ex+(dx>0?10:-10),y:ey-6,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,
    dmg:T.dmg,owner:'e',life:2.2,col:e.type==='atirador'?'#ffb703':'#ff4d6d',size:3,hit:new Set()});
  e.facing=dx>=0?1:-1;
  sfx('enemyShot');
}

function updateEnemy(e,dt){
  const T=ENEMY[e.type], p=G.player;
  e.cool-=dt; e.flash=Math.max(0,e.flash-dt); e.anim+=dt; e.stateT-=dt; e.stun=Math.max(0,e.stun-dt);
  if(e.y>GH+120){ killEnemy(e,true); return; }
  const ex=e.x+e.w/2, ey=e.y+e.h*0.4, px=p.x+p.w/2, py=p.y+p.h*0.4;
  const dx=px-ex, dy=py-ey, dist=Math.hypot(dx,dy);
  const alert = p.dead<=0 && dist<T.detect && e.stun<=0;

  // Drone: voa em altura fixa, oscila e atira para baixo
  if(e.fly){
    e.t+=dt;
    e.y=e.baseY+Math.sin(e.t*2)*18;
    if(alert){
      e.facing=dx>=0?1:-1;
      const want=dist>300?e.facing:(dist<200?-e.facing:0);
      e.x+=want*e.speed*dt;
      if(e.cool<=0 && dist<T.range){ enemyShoot(e,ex,ey,px,py); e.cool=T.fire*rnd(0.9,1.2); }
    }
    e.x=clamp(e.x,0,G.W-e.w);
    return;
  }

  let want=0, spd=e.speed;
  if(e.stun>0){ /* travado pelo EMP */ }
  else if(alert){
    e.facing=dx>=0?1:-1;
    e.aim=clamp(Math.atan2(-dy,Math.abs(dx)),-0.6,1.2);
    if(T.kind==='robot'||e.type==='ninja'){
      if(e.type==='ninja' && dist<260) spd*=1.9;
      want=e.facing;
      if(dist<46 && Math.abs(dy)<60 && e.cool<=0){ hurtPlayer(T.melee); e.cool=0.9; }
    } else if(e.type==='soldado'||e.type==='elite'){
      if(dist>240) want=e.facing; else if(dist<170) want=-e.facing*0.5;
      if(e.type==='elite' && dist<500) spd*=1.2;
    } else if(e.type==='blindado'){
      want=dist>200?e.facing:0;
    } else if(e.type==='atirador'){
      if(dist<300) want=-e.facing; else if(dist>460) want=e.facing;
    }
    if(T.range && dist<T.range && e.cool<=0 && Math.abs(dy)<240){
      enemyShoot(e,ex,ey,px,py);
      e.cool=T.fire*rnd(0.9,1.3);
    }
    if(e.onGround && Math.random()<0.006) e.vy=ENEMY_JUMP;
  } else {
    if(e.stateT<=0){ e.patrol=pick1([-1,0,1]); e.stateT=rnd(1.5,3.5); }
    want=e.patrol*0.5;
    if(want!==0) e.facing=want>0?1:-1;
    e.aim=0;
  }

  // Obstáculos: caixas e bordas
  if(want!==0 && e.onGround){
    const fx=e.facing>0 ? e.x+e.w+4 : e.x-4;
    const walled=!!crateAt(fx,e.y+e.h-14);
    const edge=!supportAt(e.x+e.w/2+e.facing*(e.w/2+6),e.y+e.h);
    if(walled){
      if(alert) e.vy=ENEMY_JUMP; else { e.patrol=-e.facing; want=0; }
    }
    if(edge){
      if(alert) want=0; else { e.patrol=-e.facing; want=0; }
    }
  }
  e.vx=want*spd;
  moveBody(e,dt);
}

function updateEnemies(dt){
  for(const e of G.enemies) if(!e.dead) updateEnemy(e,dt);
  G.enemies=G.enemies.filter(e=>!e.dead);
}

function killEnemy(e,queda){
  if(e.dead) return;
  e.dead=true;
  G.kills++; G.obj.progress=G.kills; SAVE.totalKills++;
  G.score+=ENEMY[e.type].pts*(e.mini?3:1);
  G.xp+=ENEMY[e.type].pts/10;
  const cx=e.x+e.w/2, cy=e.y+e.h/2;
  explosion(cx,clamp(cy,20,GH-20),e.type==='blindado'?26:14);
  addText(cx,clamp(e.y-10,20,GH-40),(queda?'QUEDA! ':'')+'+'+ENEMY[e.type].pts,'#ffd60a');
  sfx('boom');
  const chance=e.type==='blindado'||e.mini ? 0.6 : 0.2;
  if(Math.random()<chance) G.level.items.push({type:'med',x:cx-10,y:GY-20,w:20,h:20});
}

// Reforços na etapa "sobreviva"
function spawnNear(){
  const p=G.player;
  const side=Math.random()<0.5?-1:1;
  const x=clamp(p.x+side*rnd(560,760),60,G.W-100);
  const types=['soldado','robo','atirador','voador'].filter(t=>!ENEMY[t].minW||G.w>=ENEMY[t].minW);
  const type=pick1(types);
  if(type==='voador') G.enemies.push(makeEnemy(type,x,GY-210,false));
  else if(groundAt(x)) G.enemies.push(makeEnemy(type,x,GY,false));
}

// =====================================================================
//  CHEFE
// =====================================================================
function bossCenter(b){ return {x:b.x+b.w/2,y:b.y+b.h/2}; }

function startBossAtk(b){
  const list=BOSS_ATKS[b.phase-1]||BOSS_ATKS[0];
  const name=pick1(list);
  b.atk={name,t:0,shots:0,started:false,hit:false,fired:false,jumped:false,landed:false,ty:0};
  b.atkT=(b.phase===3?1.3:(b.phase===2?1.7:2.1))*rnd(0.8,1.2)*b.speedMul;
  if(name!=='summon') sfx('bossRoar');
}

function updateBossAtk(b,dt){
  const a=b.atk, p=G.player, c=bossCenter(b);
  a.t+=dt;
  const pdir=(p.x+p.w/2)>c.x?1:-1;
  if(a.name==='barrage'){
    b.facing=pdir;
    if(a.t>0.5 && a.shots<8 && a.t>0.5+a.shots*0.2){
      const dx=(p.x+p.w/2)-c.x, dy=(p.y+p.h/2)-(c.y-30);
      const ang=Math.atan2(dy,dx)+(a.shots-3.5)*0.07;
      G.bullets.push({x:c.x,y:c.y-30,vx:Math.cos(ang)*560,vy:Math.sin(ang)*560,dmg:14,owner:'e',life:2.5,col:'#ff4d6d',size:4,hit:new Set()});
      a.shots++;
    }
    if(a.t>2.4) b.atk=null;
  }
  else if(a.name==='charge'){
    if(a.t<0.8){ b.facing=pdir; b.flash=0.05; }
    else if(a.t<1.8){
      if(!a.started){ a.started=true; a.dir=b.facing; }
      b.x+=a.dir*640*dt;
      b.x=clamp(b.x,40,G.W-b.w-40);
      if(!a.hit && rectHit(p,b)){ a.hit=true; hurtPlayer(25); }
      if(b.x<=40 || b.x>=G.W-b.w-40) a.t=1.8;
    }
    else b.atk=null;
  }
  else if(a.name==='stomp'){
    b.facing=pdir;
    if(a.t<0.5){ b.flash=0.05; }
    else if(!a.jumped){ a.jumped=true; b.vyB=-860; }
    else if(!a.landed){
      b.vyB=(b.vyB||0)+GRAV*dt;
      b.y+=b.vyB*dt;
      if(b.y>=GY-b.h){
        b.y=GY-b.h; a.landed=true;
        G.shake=Math.max(G.shake,16);
        burst(c.x,GY,'#ffd9a0',30,360);
        G.hazards.push({type:'wave',x:c.x,dir:-1,hit:false,life:1.8});
        G.hazards.push({type:'wave',x:c.x,dir:1,hit:false,life:1.8});
      }
    }
    if(a.landed && a.t>1.2) b.atk=null;
  }
  else if(a.name==='laser'){
    if(a.t<0.8){ a.ty=p.y+p.h*0.5-13; b.facing=pdir; }
    else if(!a.fired){
      a.fired=true;
      G.hazards.push({type:'beam',x:c.x,y:a.ty,dir:b.facing,life:0.9,tick:0,boss:b});
      sfx('special');
    }
    if(a.t>2.0) b.atk=null;
  }
  else if(a.name==='summon'){
    if(!a.fired && a.t>0.5){
      a.fired=true;
      if(G.enemies.length<6){
        G.enemies.push(makeEnemy('robo',b.x-60,GY,false));
        G.enemies.push(makeEnemy('soldado',b.x+b.w+60,GY,false));
      }
      addText(c.x,b.y-10,'REFORÇOS!','#ffd60a');
    }
    if(a.t>1.2) b.atk=null;
  }
  if(a.name!=='stomp' && a.name!=='charge') b.x=clamp(b.x,40,G.W-b.w-40);
}

function updateBoss(dt){
  const b=G.boss; if(!b) return;
  const p=G.player;
  b.flash=Math.max(0,b.flash-dt); b.anim+=dt;
  b.bannerT=Math.max(0,b.bannerT-dt);
  b.contactCd=Math.max(0,b.contactCd-dt);
  if(b.state==='enter'){
    b.x=Math.max(b.tx,b.x-320*dt);
    if(b.x<=b.tx+0.5){ b.state='fight'; }
    return;
  }
  if(b.state==='fight'){
    b.phase = b.hp>b.maxHp*0.66 ? 1 : (b.hp>b.maxHp*0.33 ? 2 : 3);
    if(!b.atk){
      b.atkT-=dt;
      if(b.atkT<=0) startBossAtk(b);
    } else updateBossAtk(b,dt);
    if(b.atk && b.atk.name==='stomp' && b.atk.jumped && !b.atk.landed){ /* em voo */ }
    else if(!b.atk || b.atk.name==='barrage' || b.atk.name==='summon' || b.atk.name==='laser'){
      if(b.y<GY-b.h) b.y=GY-b.h;
    }
    if(p.dead<=0 && b.contactCd<=0 && rectHit(p,b)){
      b.contactCd=0.8; hurtPlayer(15);
    }
    // ritmo do chefe: fase 3 aumenta o número de ataques
    if(b.phase===3 && b.hp<b.maxHp*0.2 && Math.random()<dt*0.2) addText(b.x+b.w/2,b.y-20,'FÚRIA!','#ff4d6d');
  }
  else if(b.state==='dying'){
    b.dyingT-=dt;
    if(Math.random()<0.35) explosion(b.x+rnd(0,b.w),b.y+rnd(0,b.h),10);
    if(b.dyingT<=0){ b.state='dead'; G.hazards=[]; onBossDefeated(); }
  }
}

function damageBoss(d){
  const b=G.boss;
  if(!b || b.state!=='fight') return;
  b.hp=Math.max(0,b.hp-d);
  b.flash=0.1;
  burst(b.x+b.w/2,b.y+b.h*0.4,'#fff3b0',6,200);
  if(b.hp<=0){
    b.state='dying'; b.dyingT=2.6; b.atk=null;
    sfx('bossDie');
    G.shake=Math.max(G.shake,20);
  }
}

function updateHazards(dt){
  const p=G.player;
  for(const h of G.hazards){
    if(h.type==='wave'){
      h.x+=h.dir*480*dt; h.life-=dt;
      if(!h.hit && p.dead<=0 && p.onGround && p.x+p.w>h.x-20 && p.x<h.x+20){
        h.hit=true; hurtPlayer(20); p.vy=-250;
      }
      if(h.x<-40||h.x>G.W+40) h.life=0;
    }
    else if(h.type==='beam'){
      h.life-=dt; h.tick-=dt;
      const b=h.boss;
      const x1=h.dir>0? b.x+b.w : 0, x2=h.dir>0? G.W : b.x;
      if(h.tick<=0 && p.dead<=0 && p.y<h.y+26 && p.y+p.h>h.y && p.x+p.w>x1 && p.x<x2){
        hurtPlayer(22); h.tick=0.35;
      }
      if(h.life<=0) h.dead=true;
    }
  }
  G.hazards=G.hazards.filter(h=>!h.dead && h.life>0);
}

// =====================================================================
//  PROJÉTEIS
// =====================================================================
function explodeAt(x,y,r,d){
  burst(x,y,'#ffb703',18,320);
  G.shake=Math.max(G.shake,10);
  sfx('boom');
  for(const e of G.enemies){
    if(!e.dead && Math.hypot(e.x+e.w/2-x,e.y+e.h/2-y)<r+e.w/2){ e.hp-=d; e.flash=0.12; if(e.hp<=0) killEnemy(e); }
  }
  if(G.boss && G.boss.state==='fight'){
    const b=G.boss;
    if(x>b.x-r && x<b.x+b.w+r && y>b.y-r && y<b.y+b.h+r) damageBoss(d);
  }
  for(const c of [...G.level.crates]){
    if(Math.hypot(c.x+c.w/2-x,c.y+c.h/2-y)<r) damageCrate(c,d);
  }
}

function damageCrate(c,d){
  c.hp-=d;
  burst(c.x+c.w/2,c.y+c.h/2,'#c58b4a',5,160);
  if(c.hp<=0){
    G.level.crates=G.level.crates.filter(k=>k!==c);
    burst(c.x+c.w/2,c.y+c.h/2,'#a8692f',14,220);
    if(c.secret){ addText(c.x,c.y-10,'ÁREA SECRETA!','#ff7a1a'); G.level.items.push({type:'coin',x:c.x+c.w/2,y:c.y-20,w:14,h:14,v:20}); }
    else if(Math.random()<0.3) G.level.items.push({type:'coin',x:c.x+c.w/2,y:c.y+c.h/2,w:14,h:14,v:5});
          }}

function updateBullets(dt){
  const p=G.player;
  const wind = G.mod==='vento' ? 40*G.windDir : 0;
  for(const b of G.bullets){
    if(b.dead) continue;
    if(b.homing && b.owner==='p'){
      let best=null, bd=500;
      for(const e of G.enemies){ if(e.dead) continue; const d=Math.hypot(e.x+e.w/2-b.x,e.y+e.h/2-b.y); if(d<bd){bd=d;best=e;} }
      if(best){
        const sp=Math.hypot(b.vx,b.vy)||1;
        const dx=best.x+best.w/2-b.x, dy=best.y+best.h/2-b.y, dd=Math.hypot(dx,dy)||1;
        b.vx+=((dx/dd)*sp-b.vx)*dt*4; b.vy+=((dy/dd)*sp-b.vy)*dt*4;
      }
    }
    b.vx+=wind*dt;
    b.vy+=(b.grav||0)*dt;
    b.life-=dt; b.x+=b.vx*dt; b.y+=b.vy*dt;
    if(b.life<=0 || b.x<-60 || b.x>G.W+60 || b.y>GH+60 || b.y<-120){
      if(b.aoe && b.owner==='p') explodeAt(b.x,b.y,b.aoe,b.dmg);
      b.dead=true; continue;
    }
    if(b.y>=GY && b.grav){ if(b.aoe) explodeAt(b.x,GY,b.aoe,b.dmg); b.dead=true; continue; }
    const c=crateAt(b.x,b.y);
    if(c){
      if(b.aoe) explodeAt(b.x,b.y,b.aoe,b.dmg);
      else if(b.owner==='p') damageCrate(c,b.dmg);
      b.dead=true; continue;
    }
    if(b.owner==='p'){
      // chefe
      if(G.boss && G.boss.state==='fight' && !b.hit.has('boss')){
        const bo=G.boss;
        if(b.x>bo.x && b.x<bo.x+bo.w && b.y>bo.y && b.y<bo.y+bo.h){
          b.hit.add('boss');
          if(b.aoe) explodeAt(b.x,b.y,b.aoe,b.dmg); else damageBoss(b.dmg);
          if(!b.pierce){ b.dead=true; continue; }
        }
      }
      for(const e of G.enemies){
        if(e.dead || b.hit.has(e)) continue;
        if(b.x>e.x && b.x<e.x+e.w && b.y>e.y && b.y<e.y+e.h){
          b.hit.add(e);
          if(b.aoe){ explodeAt(b.x,b.y,b.aoe,b.dmg); b.dead=true; break; }
          let d=b.dmg;
          if(e.shield && Math.sign(b.vx)===-e.facing){ d*=0.25; sfx('clink'); }
          e.hp-=d; e.flash=0.12;
          burst(b.x,b.y,'#fff3b0',5,160);
          if(e.hp<=0) killEnemy(e);
          if(!b.pierce){ b.dead=true; break; }
        }
      }
    } else {
      if(p.dead<=0 && p.invuln<=0 && b.x>p.x && b.x<p.x+p.w && b.y>p.y && b.y<p.y+p.h){
        b.dead=true; hurtPlayer(b.dmg);
      }
    }
  }
  G.bullets=G.bullets.filter(b=>!b.dead);
}

// =====================================================================
//  ITENS, OBJETIVO, CONCLUSÃO
// =====================================================================
function updatePickups(){
  const p=G.player;
  for(const it of G.level.items){
    if(it.taken || p.dead>0 || !rectHit(p,it)) continue;
    it.taken=true;
    if(it.type==='coin'){
      G.coins+=it.v; sfx('coin');
      addText(it.x,it.y-10,'+'+it.v,'#ffd60a');
      if(it.secret){ G.msg='ÁREA SECRETA!'; G.msgT=2; }
    } else if(it.type==='ammo'){
      for(const W of WEAPONS) if(p.ammo[W.id]!==Infinity) p.ammo[W.id]+=Math.round(W.ammo*0.25);
      sfx('pick'); addText(it.x,it.y-10,'MUNIÇÃO','#ffe066');
    } else if(it.type==='med'){
      p.hp=Math.min(p.maxHp,p.hp+35);
      sfx('pick'); addText(it.x,it.y-10,'+VIDA','#6ddb5a');
    } else if(it.type==='chip'){
      G.chips++; sfx('pick'); addText(it.x,it.y-10,'CHIP '+G.chips+'/5','#4cc9f0');
    }
    burst(it.x+8,it.y+8,it.type==='coin'?'#ffd60a':'#6ddb5a',10,140);
  }
  G.level.items=G.level.items.filter(i=>!i.taken);
}

function updateCamera(dt){
  const p=G.player;
  const target=clamp(p.x+p.w/2-GW*0.45,0,G.W-GW);
  G.camX+=(target-G.camX)*Math.min(1,dt*6);
}

function checkCheckpoints(){
  const p=G.player;
  while(G.cpIdx<G.level.cps.length && p.x>G.level.cps[G.cpIdx]+20){
    p.cp=findSpawn(G.level.cps[G.cpIdx]);
    G.cpIdx++;
    G.msg='PONTO DE CONTROLE'; G.msgT=1.6;
  }
}

function portalRect(){ return {x:G.level.exitX,y:GY-90,w:50,h:90}; }
function objectiveReady(){
  const o=G.obj;
  switch(o.type){
    case 'kill': return G.kills>=o.target;
    case 'exit': return true;
    case 'chipsExit': return G.chips>=o.target;
    case 'survive': return G.timer<=0;
  }
  return false;
}
function objectiveDone(){
  const o=G.obj;
  if(o.type==='boss') return false;
  if(o.type==='survive') return G.timer<=0;
  return objectiveReady() && rectHit(G.player,portalRect());
}

function updateObjective(dt){
  if(G.obj.type==='survive'){
    G.timer-=dt;
    G.spawnT-=dt;
    if(G.spawnT<=0 && G.player.dead<=0 && G.enemies.length<6){ spawnNear(); G.spawnT=rnd(3,5); }
  }
  if(!G.overlay && G.obj.type!=='boss' && G.obj.type!=='survive'){
    if(rectHit(G.player,portalRect()) && !objectiveReady() && G.msgT<=0){
      G.msg='Derrote os inimigos para abrir a saída'; G.msgT=2.2;
    }
  }
  if(objectiveDone() && !G.overlay){ stageClear(false); }
}

function onBossDefeated(){
  SAVE.worlds=Math.max(SAVE.worlds,G.w+1);
  stageClear(true);
}

function stageClear(boss){
  if(G.overlay) return;
  const n=G.n;
  const reward=40+n*8+G.coins;
  const xpGain=120+n*15+Math.round(G.xp);
  G.score+=Math.round(G.timer>0?0:0)+(G.noDmg?500:0);
  addCoins(reward);
  SAVE.xp+=xpGain;
  SAVE.cleared[n]=true;
  SAVE.stageBest[n]=Math.max(SAVE.stageBest[n]||0,G.score);
  SAVE.unlocked=Math.max(SAVE.unlocked,Math.min(TOTAL,n+1));
  if(G.noDmg) SAVE.perfect=(SAVE.perfect||0)+1;
  for(const W of WEAPONS){
    if(W.stage<=SAVE.unlocked && !SAVE.weapons.includes(W.id)){
      SAVE.weapons.push(W.id); toast('NOVA ARMA: '+W.nome);
    }
  }
  for(const h of HEROES){
    if(h.req && h.req.world && SAVE.worlds>=h.req.world && !SAVE.heroes.includes(h.id)){
      SAVE.heroes.push(h.id); toast('PERSONAGEM LIBERADO: '+h.nome);
    }
  }
  addRecord(G.score,n,true);
  checkAch();
  persist();
  G.reward={coins:reward,xp:xpGain,score:G.score};
  G.overlay = boss ? 'worldclear' : 'clear';
  G.autoNext = boss ? null : 4;
  G.bestNew = (SAVE.stageBest[n]===G.score);
  resetHeld();
  sfx(boss?'win':'phase');
  setOverlayButtons(G.overlay);
  setScene();
}

function defeat(){
  if(!G || G.overlay) return;
  G.overlay='defeat';
  addRecord(G.score,G.n,false);
  checkAch();
  persist();
  resetHeld();
  sfx('lose');
  setOverlayButtons('defeat');
  setScene();
}

function openPause(){
  if(!G || G.overlay) return;
  G.overlay='pause';
  resetHeld();
  setOverlayButtons('pause');
  setScene();
}
function resumeGame(){
  if(!G) return;
  G.overlay=null; resetHeld(); UI.btns=[]; setScene();
}

function setOverlayButtons(kind){
  let b=[];
  if(kind==='pause') b=[{x:GW/2-230,y:300,w:210,h:50,label:'CONTINUAR',act:'resume'},{x:GW/2+20,y:300,w:210,h:50,label:'MENU',act:'menu'}];
  if(kind==='clear') b=[{x:GW/2-330,y:400,w:200,h:50,label:'PRÓXIMA',act:'next'},{x:GW/2-100,y:400,w:200,h:50,label:'ETAPAS',act:'campaign'},{x:GW/2+130,y:400,w:200,h:50,label:'MENU',act:'menu'}];
  if(kind==='worldclear') b=[{x:GW/2-230,y:400,w:210,h:50,label:'PRÓXIMO MUNDO',act:'next'},{x:GW/2+20,y:400,w:210,h:50,label:'MENU',act:'menu'}];
  if(kind==='defeat') b=[{x:GW/2-230,y:400,w:210,h:50,label:'TENTAR DE NOVO',act:'retry'},{x:GW/2+20,y:400,w:210,h:50,label:'MENU',act:'menu'}];
  UI.btns=b; UI.sel=0;
}

// =====================================================================
//  REGISTROS
// =====================================================================
function addRecord(score,stage,won){
  const entry={nome:G.player.hero.nome,fase:stage,score,venceu:won,data:new Date().toLocaleDateString('pt-BR')};
  SAVE.records.push(entry);
  SAVE.records.sort((a,b)=>b.score-a.score);
  SAVE.records=SAVE.records.slice(0,8);
  G.bestNew = G.bestNew || SAVE.records.includes(entry);
  persist();
}
function topScore(){ return SAVE.records.length?SAVE.records[0].score:0; }

// =====================================================================
//  EFEITOS, TEXTOS E TOASTS
// =====================================================================
let TOAST=null;
function toast(t){ TOAST={text:t,t:3}; }
function burst(x,y,col,n,spd){
  if(!G) return;
  for(let i=0;i<n;i++){
    const a=rnd(0,Math.PI*2), s=rnd(0.2,1)*spd;
    G.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-40,life:rnd(0.3,0.7),c:col,r:rnd(2,4.5),g:500});
  }
}
function explosion(x,y,n){
  burst(x,y,'#ffb703',n,320);
  burst(x,y,'#ff4d1a',Math.round(n*0.6),220);
  burst(x,y,'#555555',Math.round(n*0.5),90);
  if(G){
    G.shake=Math.max(G.shake,12);
    G.rings.push({x,y,r:6,max:n*4+40,life:0.45});
    G.lights.push({x,y,r:n*9+60,life:0.6,max:0.6});
  }
}
function addText(x,y,s,c){ if(G) G.texts.push({x,y,s,c,life:1,vy:-50}); }
function updateFx(dt){
  if(TOAST){ TOAST.t-=dt; if(TOAST.t<=0) TOAST=null; }
  if(!G) return;
  for(const p of G.parts){ p.vy+=p.g*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt; }
  G.parts=G.parts.filter(p=>p.life>0);
  for(const t of G.texts){ t.y+=t.vy*dt; t.life-=dt; }
  for(const r of G.rings){ r.life-=dt; r.r+=(r.max-r.r)*Math.min(1,dt*10); }
  G.rings=G.rings.filter(r=>r.life>0);
  for(const l of G.lights){ l.life-=dt; }
  G.lights=G.lights.filter(l=>l.life>0);
  G.texts=G.texts.filter(t=>t.life>0);
  for(const a of G.ambient){
    a.x+=(a.vx+Math.sin(time+a.ph)*10)*dt; a.y+=a.vy*dt;
    if(a.y>GH){ a.y=-5; a.x=rnd(0,GW); }
    if(a.x<-10) a.x=GW+10; if(a.x>GW+10) a.x=-10;
  }
}

// =====================================================================
//  ESTADO DE JOGO — ATUALIZAÇÃO
// =====================================================================
function updatePlayer(dt){
  const p=G.player, held=IN.held;
  p.cool-=dt; p.recoil=Math.max(0,p.recoil-dt*9); p.flash=Math.max(0,p.flash-dt);
  p.invuln=Math.max(0,p.invuln-dt); p.shieldT=Math.max(0,p.shieldT-dt);
  p.turboT=Math.max(0,p.turboT-dt); p.rapidT=Math.max(0,p.rapidT-dt); p.skillCd=Math.max(0,p.skillCd-dt);

  if(p.dead>0){
    p.dead-=dt;
    if(p.dead<=0){ if(p.final) defeat(); else respawn(); }
    return;
  }
  const mv=(held.right?1:0)-(held.left?1:0);
  if(mv) p.facing=mv;
  p.vx=mv*p.hero.speed*(p.turboT>0?1.8:1);
  if(held.aimup) p.aim = mv ? 0.7 : 1.35;
  else if(held.aimdown && !p.onGround) p.aim=-0.7;
  else p.aim=0;

  if(held.jump && !IN.prev.jump){
    if(p.onGround){ p.vy=JUMP_V; p.jumps=p.maxJumps-1; sfx('jump'); }
    else if(p.jumps>0){ p.vy=JUMP_V*0.9; p.jumps--; sfx('jump'); addText(p.x,p.y+60,'DUPLO!','#4cc9f0'); }
  }
  if(p.onGround) p.jumps=p.maxJumps-1;
  if(held.skill && !IN.prev.skill) useSkill();
  if(held.swap && !IN.prev.swap) cycleWeapon();
  if(held.shoot && p.cool<=0) fire(p);

  moveBody(p,dt);

  // espinhos
  if(p.invuln<=0){
    for(const s of G.level.spikes){
      if(rectHit(p,s)){ hurtPlayer(25); p.vy=-300; break; }
    }
  }
  if(p.y>GH+40) killPlayer(true);
  if(p.x>G.maxX){ G.score+=Math.floor((p.x-G.maxX)/8); G.maxX=p.x; }
  checkCheckpoints();
  // coleta de camadas de pontuação por moeda já feita em updatePickups
}

function updateGame(dt){
  G.time+=dt;
  G.shake=Math.max(0,G.shake-dt*30);
  if(G.msgT>0) G.msgT-=dt;
  if(G.boss) { /* o chefe atualiza abaixo */ }
  updateMovers(dt);
  updatePlayer(dt);
  updateEnemies(dt);
  updateBoss(dt);
  updateHazards(dt);
  updateBullets(dt);
  updatePickups();
  updateObjective(dt);
  updateCamera(dt);
  if(G.overlay) return;
  if(G.player.dead<=0 && G.enemies.length===0 && G.obj.type==='kill'){ /* aguarda o objetivo */ }
}

// =====================================================================
//  INTERFACE — botões, telas, navegação
// =====================================================================
const UI={btns:[],sel:0};
let scene='menu', selHero=0, selWeapon=0, time=0, G=null, campPage=0;
const IN={held:{},prev:{}};
const KEYS={
  left:['KeyA','ArrowLeft'], right:['KeyD','ArrowRight'],
  jump:['Space','KeyW','ArrowUp'], shoot:['KeyJ','KeyK','KeyX'],
  aimup:['KeyE'], aimdown:['KeyS','ArrowDown'],
  skill:['KeyQ'], swap:['KeyR']
};
function resetHeld(){ for(const k in KEYS) IN.held[k]=false; }

function buildButtons(name){
  if(name==='menu'){
    const L=[['JOGAR CAMPANHA','campaign'],['CONTINUAR','continue'],['PERSONAGENS','heroes'],['ARSENAL','arsenal'],['LOJA','shop']];
    const R=[['CONQUISTAS','ach'],['RECORDES','records'],['CONFIGURAÇÕES','settings'],['COMO JOGAR','help']];
    return [
      ...L.map((l,i)=>({x:110,y:190+i*56,w:300,h:46,label:l[0],act:l[1]})),
      ...R.map((l,i)=>({x:550,y:190+i*56,w:300,h:46,label:l[0],act:l[1]}))
    ];
  }
  if(name==='campaign'){
    const c=[];
    const first=campPage*25+1;
    for(let n=first;n<first+25 && n<=TOTAL;n++){
      const row=Math.floor((n-1)/5)-campPage*5, col=(n-1)%5;
      c.push({x:220+col*140,y:96+row*62,w:124,h:46,card:true,n,act:n<=SAVE.unlocked?'stage:'+n:null});
    }
    c.push({x:30,y:478,w:200,h:44,label:'◀ PÁGINA',act:'camp:-1'});
    c.push({x:730,y:478,w:200,h:44,label:'PÁGINA ▶',act:'camp:1'});
    c.push({x:GW/2-110,y:478,w:220,h:44,label:'VOLTAR',act:'back'});
    return c;
  }
  if(name==='heroes'){
    const c=HEROES.map((h,i)=>({x:30+i*152,y:100,w:140,h:310,card:true,act:'hero:'+i}));
    c.push({x:GW/2-110,y:478,w:220,h:44,label:'VOLTAR',act:'back'});
    return c;
  }
  if(name==='arsenal'){
    const c=WEAPONS.map((w,i)=>({x:37+i*128,y:100,w:118,h:250,card:true,act:'weapon:'+i}));
    c.push({x:GW/2-200,y:370,w:190,h:44,label:'MELHORAR ARMA',act:'upgrade'});
    c.push({x:GW/2+10,y:370,w:190,h:44,label:'VOLTAR',act:'back'});
    return c;
  }
  if(name==='shop'){
    const items=shopItems();
    const c=items.map((it,i)=>({x:GW/2-260,y:110+i*70,w:520,h:56,label:it.label,act:'buy:'+it.id}));
    c.push({x:GW/2-110,y:478,w:220,h:44,label:'VOLTAR',act:'back'});
    return c;
  }
  if(name==='settings'){
    return [
      {x:GW/2-200,y:130,w:400,h:46,label:'MÚSICA: '+(SAVE.settings.music?'LIGADA':'DESLIGADA'),act:'toggle:music'},
      {x:GW/2-200,y:190,w:400,h:46,label:'EFEITOS: '+(SAVE.settings.sfx?'LIGADOS':'DESLIGADOS'),act:'toggle:sfx'},
      {x:GW/2-200,y:250,w:190,h:46,label:'VOL. MÚSICA −',act:'vol:musVol:-1'},
      {x:GW/2+10,y:250,w:190,h:46,label:'VOL. MÚSICA +',act:'vol:musVol:1'},
      {x:GW/2-200,y:310,w:190,h:46,label:'VOL. EFEITOS −',act:'vol:sfxVol:-1'},
      {x:GW/2+10,y:310,w:190,h:46,label:'VOL. EFEITOS +',act:'vol:sfxVol:1'},
      {x:GW/2-200,y:370,w:400,h:46,label:'CONTROLES: '+(SAVE.settings.layout==='invertido'?'INVERTIDOS':'PADRÃO')+' (toque)',act:'toggle:layout'},
      {x:GW/2-110,y:478,w:220,h:44,label:'VOLTAR',act:'back'}
    ];
  }
  if(name==='ach'||name==='records'||name==='help'){
    return [{x:GW/2-110,y:478,w:220,h:44,label:'VOLTAR',act:'back'}];
  }
  return [];
}
function shopItems(){
  const lvl=(k)=>SAVE.upg[k];
  return [
    {id:'hp',label:`VIDA MÁXIMA +10 (nível ${lvl('hp')}/5) — ${upgCost('hp')} moedas`},
    {id:'dmg',label:`DANO GERAL +10% (nível ${lvl('dmg')}/5) — ${upgCost('dmg')} moedas`},
    {id:'ammo',label:`MUNIÇÃO EXTRA (nível ${lvl('ammo')}/5) — ${upgCost('ammo')} moedas`}
  ];
}
function upgCost(k){ return ({hp:150,dmg:200,ammo:120})[k]*(SAVE.upg[k]+1); }

function setScreen(name){
  scene=name;
  if(name!=='game') G=null;
  UI.btns=buildButtons(name);
  UI.sel=0;
  if(name==='heroes') UI.sel=HEROES.findIndex(h=>h.id===SAVE.hero);
  if(name==='arsenal') UI.sel=Math.max(0,WEAPONS.findIndex(w=>w.id===SAVE.weapon));
  setScene();
}

function continueRun(){
  startStage(SAVE.unlocked);
      }function activate(a){
  if(!a) return;
  if(a==='campaign'){ campPage=Math.floor((SAVE.unlocked-1)/25); setScreen('campaign'); return; }
  if(a.startsWith('camp:')){ campPage=clamp(campPage+(+a.slice(5)),0,1); setScreen('campaign'); return; }
  if(a==='continue'){ startStage(SAVE.unlocked); return; }
  if(['heroes','arsenal','shop','ach','records','settings','help'].includes(a)){ setScreen(a); return; }
  if(a==='back'||a==='menu'){ setScreen('menu'); return; }
  if(a==='resume'){ resumeGame(); return; }
  if(a==='retry'){ startStage(G.n); return; }
  if(a==='next'){
    const n=G.n;
    if(n>=TOTAL){ setScreen('menu'); return; }
    startStage(n+1); return;
  }
  if(a.startsWith('stage:')){ startStage(+a.slice(6)); return; }
  if(a.startsWith('hero:')){
    const h=HEROES[+a.slice(5)];
    if(SAVE.heroes.includes(h.id)){ SAVE.hero=h.id; persist(); sfx('select'); setScreen('heroes'); return; }
    if(h.cost && SAVE.coins>=h.cost && SAVE.worlds>=(h.req?h.req.world:0)){
      SAVE.coins-=h.cost; SAVE.heroes.push(h.id); SAVE.hero=h.id;
      toast('PERSONAGEM COMPRADO: '+h.nome);
      checkAch(); persist(); sfx('pick'); setScreen('heroes'); return;
    }
    if(!h.cost && h.req && SAVE.worlds>=h.req.world){
      SAVE.heroes.push(h.id); SAVE.hero=h.id; persist(); setScreen('heroes'); return;
    }
    toast(h.req ? `Conclua o Mundo ${h.req.world} para liberar` : `Faltam ${h.cost-SAVE.coins} moedas`);
    sfx('tick'); return;
  }
  if(a.startsWith('weapon:')){
    const W=WEAPONS[+a.slice(7)];
    if(SAVE.weapons.includes(W.id)){ SAVE.weapon=W.id; persist(); sfx('select'); }
    else toast(`Arma liberada na etapa ${W.stage}`);
    UI.sel=+a.slice(7); return;
  }
  if(a==='upgrade'){
    const W=WEAPON_BY[SAVE.weapon];
    const lv=SAVE.wlv[W.id]||0;
    if(lv>=3){ toast('Arma no nível máximo'); return; }
    const cost=150*(lv+1);
    if(SAVE.coins<cost){ toast(`Faltam ${cost-SAVE.coins} moedas`); return; }
    SAVE.coins-=cost; SAVE.wlv[W.id]=lv+1; persist(); sfx('pick');
    toast(`${W.nome} nível ${lv+1}`); return;
  }
  if(a.startsWith('buy:')){
    const id=a.slice(4), lv=SAVE.upg[id];
    if(lv>=5){ toast('Nível máximo'); return; }
    const cost=upgCost(id);
    if(SAVE.coins<cost){ toast(`Faltam ${cost-SAVE.coins} moedas`); return; }
    SAVE.coins-=cost; SAVE.upg[id]=lv+1; persist(); sfx('pick');
    setScreen('shop'); return;
  }
  if(a==='toggle:layout'){
    SAVE.settings.layout = SAVE.settings.layout==='invertido' ? 'padrao' : 'invertido';
    persist(); applyLayout(); setScreen('settings'); return;
  }
  if(a.startsWith('toggle:')){
    const k=a.slice(7); SAVE.settings[k]=!SAVE.settings[k]; persist(); setScreen('settings'); return;
  }
  if(a.startsWith('vol:')){
    const [,k,d]=a.split(':');
    SAVE.settings[k]=clamp(SAVE.settings[k]+(+d),0,10); persist(); setScreen('settings'); return;
  }
}

function uiKey(code){
  if(code==='Escape'){
    if(scene==='game' && G && G.overlay==='pause') resumeGame();
    else if(scene==='game' && G && !G.overlay) openPause();
    else if(scene!=='menu' && scene!=='game') activate('back');
    return;
  }
  const n=UI.btns.length; if(!n) return;
  if(['ArrowUp','KeyW','ArrowLeft','KeyA'].includes(code)){ UI.sel=(UI.sel+n-1)%n; sfx('tick'); }
  else if(['ArrowDown','KeyS','ArrowRight','KeyD'].includes(code)){ UI.sel=(UI.sel+1)%n; sfx('tick'); }
  else if(['Enter','Space','KeyJ','KeyF'].includes(code)){
    const b=UI.btns[UI.sel]; if(b) activate(b.act);
  }
}

function applyLayout(){
  document.body.classList.toggle('lefty', SAVE.settings.layout==='invertido');
}
function setScene(){
  const inGame = scene==='game' && G && !G.overlay;
  document.body.classList.toggle('game', !!inGame);
  resize();
}

// =====================================================================
//  ENTRADA: teclado, mouse e toque
// =====================================================================
window.addEventListener('keydown',e=>{
  ac();
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
  if(e.repeat) return;
  if(scene==='game' && G && !G.overlay){
    for(const a in KEYS) if(KEYS[a].includes(e.code)) IN.held[a]=true;
    if(e.code==='Escape'||e.code==='KeyP') openPause();
    return;
  }
  if(scene==='game' && G && G.overlay){
    if(e.code==='Escape' && G.overlay==='pause') resumeGame();
    else uiKey(e.code);
    return;
  }
  uiKey(e.code);
});
window.addEventListener('keyup',e=>{
  for(const a in KEYS) if(KEYS[a].includes(e.code)) IN.held[a]=false;
});
window.addEventListener('blur',()=>resetHeld());

cv.addEventListener('pointerdown',e=>{
  ac();
  const r=cv.getBoundingClientRect();
  const x=(e.clientX-r.left)*GW/r.width, y=(e.clientY-r.top)*GH/r.height;
  if(scene==='game' && G && !G.overlay){
    if(x>=GW-52 && x<=GW-16 && y>=92 && y<=124) openPause();
    return;
  }
  for(let i=0;i<UI.btns.length;i++){
    const b=UI.btns[i];
    if(x>=b.x && x<=b.x+b.w && y>=b.y && y<=b.y+b.h){
      UI.sel=i;
      if(b.act) activate(b.act);
      return;
    }
  }
});

document.querySelectorAll('#touch button').forEach(b=>{
  const a=b.dataset.a;
  const on=e=>{ e.preventDefault(); ac(); IN.held[a]=true; b.classList.add('on'); };
  const off=e=>{ e.preventDefault(); IN.held[a]=false; b.classList.remove('on'); };
  b.addEventListener('pointerdown',on);
  b.addEventListener('pointerup',off);
  b.addEventListener('pointercancel',off);
  b.addEventListener('pointerleave',off);
});
if(window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window){
  document.body.classList.add('touch');
}

function resize(){
  const tEl=document.getElementById('touch');
  const showT=document.body.classList.contains('touch') && document.body.classList.contains('game');
  const th=showT ? tEl.offsetHeight+10 : 0;
  const s=Math.max(0.2,Math.min((innerWidth-16)/GW,(innerHeight-th-16)/GH));
  cv.style.width=Math.floor(GW*s)+'px';
  cv.style.height=Math.floor(GH*s)+'px';
}
window.addEventListener('resize',resize);

// =====================================================================
//  DESENHO — UTILITÁRIOS
// =====================================================================
function rr(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}
function line(x1,y1,x2,y2,col,w){
  ctx.strokeStyle=col; ctx.lineWidth=w; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
}
function outText(s,x,y,size,fill,align='center'){
  ctx.font=`bold ${size}px ${FONT}`;
  ctx.textAlign=align; ctx.textBaseline='middle';
  ctx.lineJoin='round'; ctx.lineWidth=Math.max(3,size/6); ctx.strokeStyle='#1a1020';
  ctx.strokeText(s,x,y);
  ctx.fillStyle=fill; ctx.fillText(s,x,y);
}
function drawWrap(text,cx,y,maxW,lh,size,color){
  ctx.font=`${size}px ${FONT}`; ctx.fillStyle=color;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  const words=text.split(' '); const lines=[]; let cur='';
  for(const w of words){
    const t=cur?cur+' '+w:w;
    if(ctx.measureText(t).width>maxW && cur){ lines.push(cur); cur=w; }
    else cur=t;
  }
  if(cur) lines.push(cur);
  lines.slice(0,2).forEach((l,i)=>ctx.fillText(l,cx,y+i*lh));
}

// =====================================================================
//  DESENHO — HUMANOS, ROBÔS, DRONES E CHEFES
// =====================================================================
function drawHuman(L,cx,feet,dir,sc,st){
  ctx.save();
  ctx.translate(cx,feet);
  ctx.scale(sc*dir,sc);
  ctx.lineCap='round';
  if(st.alpha!==undefined) ctx.globalAlpha=st.alpha;
  if(st.hurt) ctx.globalAlpha*=0.7;
  const step=(!st.air && st.walk) ? Math.sin(st.anim*12)*6 : 0;
  if(st.air){
    line(-2,-20,-7,-11,L.pants,6); line(-7,-11,-5,-2,L.pants,6);
    line(2,-20,6,-12,L.pants,6);   line(6,-12,10,-4,L.pants,6);
    ctx.fillStyle=L.boots; ctx.fillRect(-9,-3,8,3); ctx.fillRect(8,-5,8,3);
  } else {
    line(-2,-20,-2-step,0,L.pants,6);
    line(2,-20,2+step,0,L.pants,6);
    ctx.fillStyle=L.boots; ctx.fillRect(-6-step,-3,8,3); ctx.fillRect(-1+step,-3,8,3);
  }
  const sw=(!st.air && st.walk) ? Math.sin(st.anim*12+Math.PI)*5 : 0;
  line(-3,-34,-5+sw,-24,L.skin,5);
  ctx.fillStyle=L.shirt; rr(-7,-38,14,20,4); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(-7,-21,14,2);
  ctx.fillStyle='rgba(255,255,255,0.14)'; ctx.fillRect(-5,-36,3,12);
  ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(3,-36,4,15);
  ctx.fillStyle='#d4a017'; ctx.fillRect(-1,-21,3,3);
  ctx.fillStyle=L.skin; ctx.beginPath(); ctx.arc(0,-46,8,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(-3,-49,3,0,Math.PI*2); ctx.fill();
  if(L.hairStyle==='long'){ ctx.fillStyle=L.hair; rr(-11,-47,7,20,3); ctx.fill(); }
  if(L.hairStyle==='bun'){ ctx.fillStyle=L.hair; ctx.beginPath(); ctx.arc(-3,-55,4.5,0,Math.PI*2); ctx.fill(); }
  if(L.hairStyle==='short'||L.hairStyle==='long'||L.hairStyle==='bun'){
    ctx.fillStyle=L.hair; ctx.beginPath();
    ctx.arc(0,-46,8.6,Math.PI*1.02,Math.PI*1.98); ctx.closePath(); ctx.fill();
  }
  if(L.hat==='helmet'){
    ctx.fillStyle=L.hatCol; ctx.beginPath(); ctx.arc(0,-47,9.5,Math.PI,0); ctx.fill();
    ctx.fillRect(-10,-47.5,20,2.5);
  }
  if(L.hat==='cap'){ ctx.fillStyle=L.hatCol; ctx.fillRect(-8,-53,16,5); ctx.fillRect(0,-49,10,2); }
  if(L.hat==='bandana'){
    ctx.fillStyle=L.hatCol; ctx.fillRect(-9,-50,18,4);
    ctx.beginPath(); ctx.moveTo(-9,-49); ctx.lineTo(-15,-45); ctx.lineTo(-9,-44); ctx.fill();
  }
  ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(4,-46,1.2,0,Math.PI*2); ctx.fill();
  line(3,-41,5.5,-41,'#7a3b2e',1.2);
  if(st.hurt) line(2,-41,5,-41,'#7a3b2e',1.5);
  if(L.glasses){ ctx.strokeStyle='#222'; ctx.lineWidth=0.9; ctx.beginPath(); ctx.arc(4,-46,2.6,0,Math.PI*2); ctx.stroke(); }
  const ro=st.recoil ? st.recoil*2.5 : 0;
  ctx.save();
  ctx.translate(4,-34);
  ctx.rotate(-(st.aim||0));
  line(0,0,10,0,L.skin,5);
  ctx.fillStyle=L.gunCol;
  let end=22;
  if(L.gun==='rifle'){ ctx.fillRect(6-ro,-2,18,4); ctx.fillRect(3-ro,-1,4,5); ctx.fillRect(10-ro,2,3,4); end=24-ro; }
  else if(L.gun==='pistol'){ ctx.fillRect(7-ro,-2,8,4); ctx.fillRect(9-ro,2,3,4); end=15-ro; }
  else { ctx.fillRect(6-ro,-3,15,7); ctx.fillRect(20-ro,-2,4,4); end=24-ro; }
  if(st.flash){
    ctx.globalCompositeOperation='lighter';
    ctx.fillStyle='rgba(255,200,80,0.45)'; ctx.beginPath(); ctx.arc(end+3,0,11,0,Math.PI*2); ctx.fill();
    ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#ffe066'; ctx.beginPath(); ctx.arc(end+3,0,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff7c2'; ctx.beginPath(); ctx.arc(end+3,0,2.5,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

function drawRobot(e){
  const s=e.mini?1.4:1;
  ctx.save();
  ctx.translate(e.x+e.w/2,e.y+e.h);
  ctx.scale(e.facing*s,s);
  const st=Math.sin(e.anim*10)*3;
  ctx.fillStyle='#3a4256';
  ctx.fillRect(-12,-18+st,8,18); ctx.fillRect(4,-18-st,8,18);
  ctx.fillStyle='#5c677d'; rr(-16,-52,32,36,6); ctx.fill();
  ctx.fillStyle='#8d99ae'; ctx.fillRect(-8,-44,16,4);
  ctx.fillStyle='#4a5568'; rr(-12,-72,24,18,4); ctx.fill();
  ctx.fillStyle='#ff4d6d'; ctx.fillRect(-7,-67,14,5);
  ctx.fillStyle='#2b2d42'; ctx.fillRect(10,-44,18,8);
  if(e.type==='mech'){ ctx.fillStyle='#2b2d42'; ctx.fillRect(-26,-52,12,22); ctx.fillStyle='#ffb703'; ctx.fillRect(-24,-46,8,4); }
  ctx.restore();
}
function drawDrone(e){
  const cx=e.x+e.w/2, cy=e.y+e.h/2;
  ctx.save(); ctx.translate(cx,cy);
  ctx.fillStyle='#3a3f58'; ctx.beginPath(); ctx.ellipse(0,0,18,9,0,0,Math.PI*2); ctx.fill();
  const spin=(time*30)%(Math.PI*2);
  line(-22*Math.cos(spin),-12,22*Math.cos(spin),-12,'#9be7ff',2);
  ctx.fillStyle='#ff4d6d'; ctx.beginPath(); ctx.arc(e.facing*6,0,3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#2b2d42'; ctx.fillRect(-2,8,4,8);
  ctx.restore();
}

function drawBoss(){
  const b=G.boss; if(!b || b.state==='dead') return;
  const cfg=WORLDS[b.w0];
  const cx=b.x+b.w/2, bot=b.y+b.h;
  const flash=b.flash>0;
  const body = flash ? '#ffffff' : cfg.theme.plat;
  const acc = cfg.theme.accent;
  const dark='#1a1020';
  ctx.save();
  ctx.translate(cx,bot);
  ctx.scale(b.facing,1);
  ctx.translate(0,Math.sin(b.anim*3)*3);
  if(b.atk && b.atk.t<0.8 && (b.atk.name==='charge'||b.atk.name==='laser'||b.atk.name==='barrage')){
    ctx.fillStyle='rgba(255,60,80,0.3)';
    ctx.beginPath(); ctx.arc(0,-b.h*0.5,b.w*1.1,0,Math.PI*2); ctx.fill();
  }
  if(b.state==='dying' && Math.floor(time*12)%2===0) ctx.globalAlpha=0.6;
  // pernas
  ctx.fillStyle=dark;
  ctx.fillRect(-b.w*0.3,-b.h*0.22,b.w*0.22,b.h*0.22);
  ctx.fillRect(b.w*0.08,-b.h*0.22,b.w*0.22,b.h*0.22);
  // corpo
  ctx.fillStyle=body; rr(-b.w*0.45,-b.h*0.78,b.w*0.9,b.h*0.6,14); ctx.fill();
  // cabeça
  ctx.beginPath(); ctx.arc(0,-b.h*0.88,b.w*0.25,0,Math.PI*2); ctx.fill();
  // detalhes por chefe
  ctx.fillStyle=acc;
  switch(cfg.draw){
    case 'general':
      ctx.fillRect(-b.w*0.5,-b.h*0.8,b.w,8);
      ctx.fillRect(b.w*0.3,-b.h*0.55,b.w*0.5,b.h*0.1);
      break;
    case 'colosso':
      ctx.fillRect(-b.w*0.45,-b.h*0.5,b.w*0.9,8);
      ctx.fillRect(-b.w*0.2,-b.h*0.95,b.w*0.4,6);
      break;
    case 'cacador':
      ctx.globalAlpha*=0.55; ctx.beginPath(); ctx.moveTo(-b.w*0.4,-b.h*0.7); ctx.lineTo(-b.w*1.1,-b.h*1.05); ctx.lineTo(-b.w*0.5,-b.h*0.3); ctx.fill();
      ctx.beginPath(); ctx.moveTo(b.w*0.4,-b.h*0.7); ctx.lineTo(b.w*1.1,-b.h*1.05); ctx.lineTo(b.w*0.5,-b.h*0.3); ctx.fill();
      ctx.globalAlpha=1;
      break;
    case 'comandante':
      ctx.fillRect(-b.w*0.35,-b.h*0.92,b.w*0.7,b.h*0.08);
      ctx.fillStyle='#2b2d42'; ctx.fillRect(b.w*0.25,-b.h*0.6,b.w*0.5,b.h*0.1);
      break;
    case 'titan':
      ctx.fillStyle='#9be7ff';
      for(let k=-2;k<=2;k++){ ctx.beginPath(); ctx.moveTo(k*b.w*0.2,-b.h*0.78); ctx.lineTo(k*b.w*0.2+8,-b.h*0.95); ctx.lineTo(k*b.w*0.2+16,-b.h*0.78); ctx.fill(); }
      break;
    case 'serpente':
      ctx.fillStyle=acc;
      for(let k=1;k<=4;k++){ ctx.beginPath(); ctx.arc(k*b.w*0.22,-b.h*0.25,b.w*0.16,0,Math.PI*2); ctx.fill(); }
      break;
    case 'vulcao':
      ctx.strokeStyle='#ff7b00'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(-b.w*0.3,-b.h*0.5); ctx.lineTo(0,-b.h*0.3); ctx.lineTo(b.w*0.25,-b.h*0.6); ctx.stroke();
      break;
    case 'orbital':
      ctx.strokeStyle=acc; ctx.lineWidth=4;
      ctx.beginPath(); ctx.ellipse(0,-b.h*0.55,b.w*0.8,b.h*0.12,0,0,Math.PI*2); ctx.stroke();
      break;
    case 'vazio':
      ctx.fillStyle='rgba(199,125,255,0.5)';
      for(let k=0;k<4;k++){ const a=b.anim*1.5+k*1.6; ctx.beginPath(); ctx.arc(Math.cos(a)*b.w*0.9,-b.h*0.5+Math.sin(a)*b.h*0.3,6,0,Math.PI*2); ctx.fill(); }
      break;
    case 'imperador':
      ctx.strokeStyle=acc; ctx.lineWidth=5;
      ctx.beginPath(); ctx.ellipse(0,-b.h*1.02,b.w*0.35,10,0,0,Math.PI*2); ctx.stroke();
      break;
  }
  // olhos
  ctx.fillStyle=cfg.draw==='imperador'||cfg.draw==='cacador' ? '#ff4d4d' : acc;
  ctx.fillRect(-b.w*0.12,-b.h*0.9,b.w*0.08,b.h*0.03);
  ctx.fillRect(b.w*0.04,-b.h*0.9,b.w*0.08,b.h*0.03);
  ctx.restore();
                  }// =====================================================================
//  DESENHO — CENÁRIO
// =====================================================================
function drawLayer(off,col,depth,wi){
  const span=240;
  ctx.fillStyle=col;
  const k0=Math.floor(off/span)-1;
  for(let k=k0;k<k0+Math.ceil(GW/span)+3;k++){
    const sx=k*span-off;
    const seed=((k*7919)%97+97)%97;
    if(wi===0){
      const h=100+seed*1.6+depth*30;
      ctx.fillRect(sx+10,GH-h-70,110,h+70);
      ctx.fillStyle='rgba(255,220,120,0.4)';
      for(let wy=GH-h-40;wy<GH-110;wy+=26){ ctx.fillRect(sx+30,wy,12,12); ctx.fillRect(sx+72,wy,12,12); }
      ctx.fillStyle=col;
    } else if(wi===1){
      ctx.beginPath(); ctx.ellipse(sx+120,GH-70,180,40+seed*0.4+depth*10,0,Math.PI,Math.PI*2); ctx.fill();
      ctx.fillRect(sx+200,GH-150-seed*0.3,12,80);
    } else if(wi===2){
      const h=120+seed*1.2+depth*40;
      ctx.fillRect(sx+100,GH-h-20,16,h+20);
      ctx.beginPath(); ctx.arc(sx+108,GH-h-20,50+seed*0.2,0,Math.PI*2); ctx.fill();
    } else if(wi===3){
      const h=140+seed*0.8;
      ctx.fillRect(sx,GH-h*0.6,240,12);
      ctx.fillRect(sx+30,GH-h*0.6,12,h*0.6);
      ctx.fillStyle='rgba(255,77,109,0.5)';
      ctx.fillRect(sx+150,GH-h*0.6+4,20,6);
      ctx.fillStyle=col;
    } else if(wi===4){
      ctx.beginPath(); ctx.moveTo(sx,GH-60); ctx.lineTo(sx+120,GH-200-seed); ctx.lineTo(sx+240,GH-60); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.moveTo(sx+120,GH-200-seed); ctx.lineTo(sx+150,GH-170-seed); ctx.lineTo(sx+90,GH-170-seed); ctx.fill();
      ctx.fillStyle=col;
    } else {
      ctx.fillRect(sx+60,GH-200-seed*0.6,20,140+seed*0.4);
      ctx.fillStyle='rgba(255,106,0,0.35)';
      ctx.beginPath(); ctx.arc(sx+70,GH-200-seed*0.6,40,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=col;
    }
  }
}
// ===== CENÁRIO EM CAMADAS (parallax com silhuetas, névoa e animação) =====
function hash(n){ const s=Math.sin(n*127.1+311.7)*43758.5453; return s-Math.floor(s); }
function fogBand(y0,y1,c0,c1){
  const g=ctx.createLinearGradient(0,y0,0,y1);
  g.addColorStop(0,c0); g.addColorStop(1,c1);
  ctx.fillStyle=g; ctx.fillRect(0,y0,GW,y1-y0);
}
function farNew(sx,k,h,wi,T){
  ctx.fillStyle=T.far;
  if(wi===6){ // cais com navio e guindaste
    ctx.fillRect(sx,GH-190,170,40); ctx.fillRect(sx+30,GH-230,90,40);
    ctx.fillRect(sx+150,GH-290-h*40,6,100); ctx.fillRect(sx+100,GH-290-h*40,60,4);
  } else if(wi===7){ // vulcão com topo incandescente
    ctx.beginPath(); ctx.moveTo(sx,GH-120); ctx.lineTo(sx+140,GH-300-h*120); ctx.lineTo(sx+280,GH-120); ctx.fill();
    ctx.fillStyle='rgba(255,123,0,0.6)'; ctx.beginPath(); ctx.arc(sx+140,GH-300-h*120,8,0,Math.PI*2); ctx.fill();
  } else if(wi===8){ // planeta com anel
    ctx.fillStyle='rgba(144,224,239,0.25)'; ctx.beginPath(); ctx.arc(sx+120,GH-260-h*40,60,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(144,224,239,0.35)'; ctx.lineWidth=5;
    ctx.beginPath(); ctx.ellipse(sx+120,GH-260-h*40,100,18,-0.2,0,Math.PI*2); ctx.stroke();
  } else { // fragmentos flutuantes do vazio
    ctx.beginPath(); ctx.moveTo(sx+40,GH-300-h*100); ctx.lineTo(sx+90,GH-220-h*60); ctx.lineTo(sx+30,GH-200-h*60); ctx.fill();
    ctx.beginPath(); ctx.moveTo(sx+170,GH-260-h*80); ctx.lineTo(sx+210,GH-230-h*80); ctx.lineTo(sx+160,GH-200-h*80); ctx.fill();
  }
}
function farShape(sx,k,h,wi,T){
  if(wi>=6){ farNew(sx,k,h,wi,T); return; }
  ctx.fillStyle=T.far;
  if(wi===0){ // skyline em ruínas, com antenas e janelas acesas
    const w=70+h*70, top=GH-230-h*170;
    ctx.fillRect(sx,top,w,GH-top);
    ctx.fillRect(sx+w*0.45,top-28,3,28);
    ctx.fillStyle='rgba(255,210,120,0.35)';
    for(let y=top+12;y<GH-150;y+=22){ ctx.fillRect(sx+w*0.2+((y*3)%2)*4,y,6,8); }
  } else if(wi===1){ // mesas do deserto
    ctx.beginPath(); ctx.moveTo(sx,GH-110); ctx.lineTo(sx+40,GH-230-h*70);
    ctx.lineTo(sx+200,GH-230-h*70); ctx.lineTo(sx+250,GH-110); ctx.fill();
  } else if(wi===2){ // montanhas com névoa azulada
    ctx.beginPath(); ctx.moveTo(sx,GH-120); ctx.lineTo(sx+130+h*60,GH-280-h*90); ctx.lineTo(sx+270,GH-120); ctx.fill();
    ctx.fillStyle='rgba(180,240,255,0.12)';
    ctx.beginPath(); ctx.moveTo(sx+130+h*60,GH-280-h*90); ctx.lineTo(sx+170+h*60,GH-240-h*90); ctx.lineTo(sx+90+h*60,GH-240-h*90); ctx.fill();
  } else if(wi===3){ // complexo industrial
    ctx.fillRect(sx,GH-300-h*60,150,200+h*60);
    ctx.fillStyle='rgba(0,0,0,0.25)';
    for(let y=GH-290;y<GH-120;y+=20) ctx.fillRect(sx,y,150,2);
  } else if(wi===4){ // montanhas nevadas
    ctx.beginPath(); ctx.moveTo(sx,GH-120); ctx.lineTo(sx+140+h*50,GH-300-h*90); ctx.lineTo(sx+280,GH-120); ctx.fill();
    ctx.fillStyle='#ffffff';
    ctx.beginPath(); ctx.moveTo(sx+140+h*50,GH-300-h*90); ctx.lineTo(sx+175+h*50,GH-258-h*90); ctx.lineTo(sx+105+h*50,GH-258-h*90); ctx.fill();
  } else { // torres do núcleo com brilho de lava
    ctx.beginPath(); ctx.moveTo(sx+30,GH-120); ctx.lineTo(sx+60,GH-260-h*140); ctx.lineTo(sx+90,GH-120); ctx.fill();
    ctx.fillStyle='rgba(255,106,0,0.5)'; ctx.fillRect(sx+58,GH-150-h*140,4,80);
  }
}
function midNew(sx,k,h,wi,T){
  ctx.fillStyle=T.mid;
  if(wi===6){ // bóias e pilares do cais
    ctx.fillRect(sx+20,GH-200,8,80); ctx.fillRect(sx+120,GH-200,8,80);
    ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(sx+24,GH-190); ctx.lineTo(sx+124,GH-190); ctx.stroke();
  } else if(wi===7){ // rochas com rachaduras de lava
    ctx.beginPath(); ctx.moveTo(sx,GH-120); ctx.lineTo(sx+60,GH-200-h*60); ctx.lineTo(sx+140,GH-120); ctx.fill();
    ctx.strokeStyle='rgba(255,123,0,'+(0.5+0.4*Math.sin(time*3+k))+')'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(sx+60,GH-200-h*60); ctx.lineTo(sx+70,GH-160); ctx.lineTo(sx+60,GH-130); ctx.stroke();
  } else if(wi===8){ // painéis solares e antena
    ctx.fillRect(sx+60,GH-240,90,50);
    ctx.fillStyle='rgba(144,224,239,0.4)'; ctx.fillRect(sx+62,GH-238,86,46);
    ctx.fillStyle=T.mid; ctx.fillRect(sx+100,GH-190,6,70);
  } else { // pilares flutuantes com runas
    ctx.fillRect(sx+60,GH-240-h*30,26,130);
    ctx.strokeStyle='rgba(199,125,255,0.6)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(sx+73,GH-170-h*30,12+Math.sin(time*2+k)*2,0,Math.PI*2); ctx.stroke();
  }
}
function midShape(sx,k,h,wi,T){
  if(wi>=6){ midNew(sx,k,h,wi,T); return; }
  ctx.fillStyle=T.mid;
  if(wi===0){ // ruína com fumaça subindo
    const w=90+h*40, top=GH-170-h*90;
    ctx.beginPath(); ctx.moveTo(sx,GH-120); ctx.lineTo(sx,top); ctx.lineTo(sx+w*0.3,top+20);
    ctx.lineTo(sx+w*0.5,top-10); ctx.lineTo(sx+w,top+6); ctx.lineTo(sx+w,GH-120); ctx.fill();
    ctx.fillStyle='rgba(255,200,120,0.5)'; ctx.fillRect(sx+w*0.2,top+30,8,10);
    const sy=top-10-((time*30+h*200)%160);
    ctx.fillStyle='rgba(120,110,130,0.14)';
    ctx.beginPath(); ctx.arc(sx+w*0.5,sy,18+(sy%30)*0.2,0,Math.PI*2); ctx.fill();
  } else if(wi===1){ // cactos e rochas
    rr(sx+40,GH-220,16,100,8); ctx.fill();
    rr(sx+22,GH-180,12,40,6); ctx.fill();
    rr(sx+56,GH-160,12,30,6); ctx.fill();
    ctx.beginPath(); ctx.ellipse(sx+170,GH-120,60,28,0,Math.PI,Math.PI*2); ctx.fill();
  } else if(wi===2){ // pinheiros
    for(let j=0;j<3;j++){
      const y=GH-120-j*40, w=50-j*8;
      ctx.beginPath(); ctx.moveTo(sx+100,y-90+j*10); ctx.lineTo(sx+100+w,y); ctx.lineTo(sx+100-w,y); ctx.fill();
    }
    ctx.fillRect(sx+97,GH-120,6,30);
  } else if(wi===3){ // tubulações e vigas
    ctx.fillRect(sx,GH-250,240,12); ctx.fillRect(sx+30,GH-250,12,130); ctx.fillRect(sx+180,GH-250,12,130);
    ctx.fillStyle='rgba(255,77,109,0.45)'; ctx.fillRect(sx+40,GH-200+Math.sin(time*5+k)*2,6,6);
  } else if(wi===4){ // iglu e pilar de gelo
    ctx.beginPath(); ctx.arc(sx+120,GH-120,70,Math.PI,0); ctx.fill();
    ctx.fillStyle='#e0fbfc';
    ctx.beginPath(); ctx.moveTo(sx+30,GH-120); ctx.lineTo(sx+40,GH-220-h*40); ctx.lineTo(sx+60,GH-120); ctx.fill();
  } else { // pilar com runas pulsantes
    ctx.fillRect(sx+60,GH-240,30,120);
    ctx.strokeStyle='rgba(255,106,0,0.55)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(sx+75,GH-180,16+Math.sin(time*2+k)*3,0,Math.PI*2); ctx.stroke();
  }
}
function nearNew(sx,k,h,wi,T){
  if(wi===6){ // ondas na frente do cais
    ctx.fillStyle='rgba(60,140,200,0.35)';
    ctx.beginPath(); ctx.moveTo(sx,GH);
    for(let x=0;x<=420;x+=30) ctx.lineTo(sx+x,GH-30+Math.sin(time*2+x*0.05+k)*6);
    ctx.lineTo(sx+420,GH); ctx.fill();
  } else if(wi===7){
    ctx.fillStyle='rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.moveTo(sx,GH); ctx.lineTo(sx+50,GH-60-h*40); ctx.lineTo(sx+110,GH); ctx.fill();
  } else if(wi===8){
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(sx+30,GH-120,300,6); ctx.fillRect(sx+80,GH-120,6,120);
  } else {
    ctx.fillStyle='rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.moveTo(sx+40,GH); ctx.lineTo(sx+90,GH-90-h*40); ctx.lineTo(sx+140,GH); ctx.fill();
  }
}
function nearShape(sx,k,h,wi,T){
  if(wi>=6){ nearNew(sx,k,h,wi,T); return; }
  ctx.fillStyle='rgba(0,0,0,0.35)';
  if(wi===2){
    for(let j=0;j<4;j++){
      const x=sx+j*60+h*20;
      ctx.beginPath(); ctx.moveTo(x,GH); ctx.lineTo(x+14,GH-40-h*30); ctx.lineTo(x+28,GH); ctx.fill();
    }
  } else if(wi===3||wi===5){
    ctx.fillRect(sx+10,GH-190,20,260);
  } else {
    ctx.beginPath(); ctx.moveTo(sx,GH); ctx.lineTo(sx+30,GH-30-h*40); ctx.lineTo(sx+60,GH); ctx.fill();
  }
}
function drawScenery(cam,T,wi){
  const sg=ctx.createRadialGradient(GW*0.72,GH*0.22,10,GW*0.72,GH*0.22,GW*0.6);
  sg.addColorStop(0,T.accent+'66'); sg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=sg; ctx.fillRect(0,0,GW,GH);
  // camada distante (0.12)
  let off=cam*0.12, k0=Math.floor(off/300)-1;
  for(let k=k0;k<k0+Math.ceil(GW/300)+3;k++) farShape(k*300-off,k,hash(k),wi,T);
  fogBand(GH-260,GH-120,T.sky2+'00',T.sky2+'99');
  // camada do meio (0.3)
  off=cam*0.3; k0=Math.floor(off/260)-1;
  for(let k=k0;k<k0+Math.ceil(GW/260)+3;k++) midShape(k*260-off,k,hash(k+100),wi,T);
  fogBand(GH-150,GH-100,T.sky2+'00',T.sky2+'66');
  // detalhes próximos (0.55), escuros e translúcidos
  off=cam*0.55; k0=Math.floor(off/420)-1;
  for(let k=k0;k<k0+Math.ceil(GW/420)+3;k++) nearShape(k*420-off,k,hash(k+200),wi,T);
}

function drawBackground(){
  const T=WORLDS[G.w].theme, cam=G.camX;
  const g=ctx.createLinearGradient(0,0,0,GH);
  g.addColorStop(0,T.sky1); g.addColorStop(1,T.sky2);
  ctx.fillStyle=g; ctx.fillRect(0,0,GW,GH);
  ctx.globalAlpha=0.5; ctx.fillStyle=T.accent;
  ctx.beginPath(); ctx.arc(720,110,46,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=1;
  drawScenery(cam,T,G.w);
}
function drawAmbient(){
  for(const a of G.ambient){
    ctx.globalAlpha=0.5;
    if(a.t==='snow'||a.t==='dust'||a.t==='sand'){ ctx.fillStyle=a.t==='snow'?'#ffffff':'#e6c89a'; ctx.beginPath(); ctx.arc(a.x,a.y,a.s,0,Math.PI*2); ctx.fill(); }
    else if(a.t==='leaf'){ ctx.fillStyle='#6ddb5a'; ctx.fillRect(a.x,a.y,a.s*2,a.s); }
    else if(a.t==='spark'){ ctx.fillStyle='#4cc9f0'; ctx.fillRect(a.x,a.y,a.s,a.s); }
    else { ctx.fillStyle='#ff6a00'; ctx.beginPath(); ctx.arc(a.x,a.y,a.s,0,Math.PI*2); ctx.fill(); }
  }
  ctx.globalAlpha=1;
}
function drawLevel(){
  const T=WORLDS[G.w].theme, cam=G.camX, L=G.level;
  for(const s of L.plats){
    if(s.x+s.w<cam-10 || s.x>cam+GW+10) continue;
    if(s.kind==='ground'){
      const gg=ctx.createLinearGradient(0,s.y,0,GH);
      gg.addColorStop(0,T.plat2); gg.addColorStop(1,'rgba(0,0,0,0.6)');
      ctx.fillStyle=gg; ctx.fillRect(s.x,s.y,s.w,GH-s.y);
      ctx.fillStyle='rgba(0,0,0,0.25)';
      for(let by=s.y+24,row=0;by<GH;by+=24,row++){
        ctx.fillRect(s.x,by,s.w,2);
        for(let bx=s.x+((row%2)*30);bx<s.x+s.w;bx+=60) ctx.fillRect(bx,by-22,2,22);
      }
      ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(s.x,s.y+12,s.w,2);
      ctx.fillStyle=T.plat; ctx.fillRect(s.x,s.y,s.w,10);
      for(let gx=s.x;gx<s.x+s.w;gx+=16){
        ctx.beginPath(); ctx.moveTo(gx,s.y); ctx.lineTo(gx+5,s.y-5-hash(gx)*4); ctx.lineTo(gx+10,s.y); ctx.fill();
      }
    } else {
      ctx.fillStyle=s.secret ? '#ff7a1a' : T.plat;
      rr(s.x,s.y,s.w,s.h,5); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.fillRect(s.x+3,s.y+2,s.w-6,3);
      ctx.fillStyle=T.plat2; ctx.fillRect(s.x+6,s.y+s.h,4,6); ctx.fillRect(s.x+s.w-10,s.y+s.h,4,6);
    }
  }
  for(const c of L.crates){
    if(c.x+c.w<cam || c.x>cam+GW) continue;
    const dmg=1-c.hp/c.max;
    ctx.fillStyle=`rgb(${168-dmg*40|0},${105-dmg*30|0},${47})`;
    ctx.fillRect(c.x,c.y,c.w,c.h);
    ctx.strokeStyle='#6b3f19'; ctx.lineWidth=2; ctx.strokeRect(c.x+1,c.y+1,c.w-2,c.h-2);
    line(c.x,c.y,c.x+c.w,c.y+c.h,'#6b3f19',3);
    line(c.x+c.w,c.y,c.x,c.y+c.h,'#6b3f19',3);
  }
  for(const s of L.spikes){
    if(s.x+s.w<cam || s.x>cam+GW) continue;
    ctx.fillStyle='#9aa0b4';
    for(let k=0;k<s.w;k+=8){ ctx.beginPath(); ctx.moveTo(s.x+k,s.y+s.h); ctx.lineTo(s.x+k+4,s.y); ctx.lineTo(s.x+k+8,s.y+s.h); ctx.fill(); }
    ctx.fillStyle='#e63946'; ctx.fillRect(s.x,s.y+s.h-3,s.w,3);
  }
  // saída
  const ex=L.exitX;
  if(!G.isBoss && ex>cam-60 && ex<cam+GW+60){
    const pulse=0.5+0.5*Math.sin(time*4);
    const ready=objectiveReady();
    ctx.fillStyle=ready?`rgba(109,219,90,${0.2+pulse*0.2})`:'rgba(120,120,120,0.2)';
    ctx.beginPath(); ctx.arc(ex+25,GY-45,60,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#2b2d42'; ctx.fillRect(ex,GY-90,50,90);
    ctx.fillStyle=ready?'#6ddb5a':'#444'; ctx.fillRect(ex+6,GY-82,38,78);
    ctx.fillStyle='#1a1020'; ctx.font=`bold 11px ${FONT}`; ctx.textAlign='center'; ctx.fillText(ready?'SAÍDA':'FECHADA',ex+25,GY-100);
  }
}

// ===== TOCHAS (iluminação decorativa ao longo da etapa) =====
function torchPositions(){
  const list=[];
  for(let x=120;x<G.W-120;x+=420) if(groundAt(x)) list.push(x);
  return list;
}
function drawTorches(){
  for(const x of torchPositions()){
    if(x<G.camX-60 || x>G.camX+GW+60) continue;
    const top=GY-70, fl=Math.sin(time*13+x)*2+Math.sin(time*7+x*0.3)*1.5;
    ctx.fillStyle='#3e2723'; ctx.fillRect(x-3,top,6,70);
    ctx.fillStyle='#5d4037'; ctx.fillRect(x-6,top-4,12,6);
    ctx.fillStyle='#ff9f1c';
    ctx.beginPath(); ctx.ellipse(x,top-12+fl*0.3,5,9+fl*0.3,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffe066';
    ctx.beginPath(); ctx.ellipse(x,top-11,2.5,5,0,0,Math.PI*2); ctx.fill();
    ctx.globalCompositeOperation='lighter';
    const g=ctx.createRadialGradient(x,top-10,4,x,top-10,95);
    g.addColorStop(0,'rgba(255,170,70,0.35)'); g.addColorStop(1,'rgba(255,120,30,0)');
    ctx.fillStyle=g; ctx.fillRect(x-95,top-105,190,190);
    ctx.globalCompositeOperation='source-over';
  }
}

function drawItems(){
  for(const it of G.level.items){
    const bob=Math.sin(time*4+it.x)*3;
    if(it.type==='coin'){
      ctx.fillStyle='rgba(255,214,10,0.35)'; ctx.beginPath(); ctx.arc(it.x+7,it.y+7+bob,12,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#ffd60a'; ctx.beginPath(); ctx.arc(it.x+7,it.y+7+bob,7,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff3b0'; ctx.fillRect(it.x+5,it.y+3+bob,2,6);
    } else if(it.type==='ammo'){
      ctx.fillStyle='#8d5524'; ctx.fillRect(it.x,it.y+bob,18,18);
      ctx.fillStyle='#ffe066'; ctx.fillRect(it.x+3,it.y+4+bob,4,10); ctx.fillRect(it.x+9,it.y+4+bob,4,10);
    } else if(it.type==='med'){
      ctx.fillStyle='rgba(109,219,90,0.35)'; ctx.beginPath(); ctx.arc(it.x+10,it.y+10+bob,16,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#ffffff'; rr(it.x,it.y+bob,20,20,4); ctx.fill();
      ctx.fillStyle='#e63946'; ctx.fillRect(it.x+8,it.y+4+bob,4,12); ctx.fillRect(it.x+4,it.y+8+bob,12,4);
    } else if(it.type==='chip'){
      ctx.fillStyle='rgba(76,201,240,0.4)'; ctx.beginPath(); ctx.arc(it.x+8,it.y+8+bob,13,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#4cc9f0'; ctx.fillRect(it.x,it.y+bob,16,16);
      ctx.fillStyle='#fff'; ctx.fillRect(it.x+4,it.y+4+bob,8,8);
    }
  }
}
function drawBullets(){
  for(const b of G.bullets){
    ctx.globalCompositeOperation='lighter';
    line(b.x-b.vx*0.05,b.y-b.vy*0.05,b.x,b.y,b.col,Math.max(2,b.size*0.7));
    ctx.fillStyle=b.col; ctx.globalAlpha=0.35;
    ctx.beginPath(); ctx.arc(b.x,b.y,b.size*1.8,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(b.x,b.y,b.size*0.4,0,Math.PI*2); ctx.fill();
  }
}
function drawEnemies(){
  for(const e of G.enemies){
    const T=ENEMY[e.type];
    if(T.kind==='robot') drawRobot(e);
    else if(T.kind==='drone') drawDrone(e);
    else {
      drawHuman(T.look,e.x+e.w/2,e.y+e.h,e.facing,T.sc*(e.mini?1.4:1),{
        walk:Math.abs(e.vx)>10, air:!e.onGround, anim:e.anim, aim:e.aim, hurt:e.flash>0
      });
    }
    if(e.type==='blindado'){
      ctx.fillStyle='rgba(155,231,255,0.55)';
      ctx.fillRect(e.facing>0?e.x+e.w:e.x-6,e.y+e.h*0.25,6,e.h*0.6);
    }
    if(e.stun>0){ ctx.fillStyle='#4cc9f0'; ctx.fillText('EMP',e.x+e.w/2,e.y-8); }
    if(e.hp<e.maxHp){
      const r=clamp(e.hp/e.maxHp,0,1);
      ctx.fillStyle='#2a1f33'; ctx.fillRect(e.x+e.w/2-16,e.y-12,32,5);
      ctx.fillStyle='#ff4d4d'; ctx.fillRect(e.x+e.w/2-16,e.y-12,32*r,5);
    }
  }
}
function drawPlayer(){
  const p=G.player;
  if(p.dead>0) return;
  if(p.invuln>0 && Math.floor(time*20)%2===0) return;
  if(p.shieldT>0){
    ctx.strokeStyle='rgba(155,231,255,0.8)'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(p.x+12,p.y+30,40,0,Math.PI*2); ctx.stroke();
  }
  drawHuman(p.hero.look,p.x+p.w/2,p.y+p.h,p.facing,1,{
    walk:Math.abs(p.vx)>10, air:!p.onGround, anim:G.time, aim:p.aim, recoil:p.recoil, flash:p.flash>0
  });
  if(p.barrier>0){ ctx.fillStyle='rgba(155,231,255,0.25)'; ctx.fillRect(p.x-4,p.y-4,p.w+8,p.h+8); }
}
function drawParts(){
  for(const p of G.parts){
    ctx.globalAlpha=Math.max(0,Math.min(1,p.life*2.5));
    ctx.fillStyle=p.c; ctx.fillRect(p.x,p.y,p.r,p.r);
  }
  ctx.globalAlpha=1;
}
function drawRings(){
  for(const r of G.rings){
    const a=Math.max(0,r.life/0.45);
    ctx.strokeStyle=`rgba(255,220,140,${a*0.9})`; ctx.lineWidth=4*a+1;
    ctx.beginPath(); ctx.arc(r.x,r.y,r.r,0,Math.PI*2); ctx.stroke();
    ctx.globalCompositeOperation='lighter';
    ctx.fillStyle=`rgba(255,160,60,${a*0.25})`;
    ctx.beginPath(); ctx.arc(r.x,r.y,r.r*0.7,0,Math.PI*2); ctx.fill();
    ctx.globalCompositeOperation='source-over';
  }
}
function drawTexts(){
  for(const t of G.texts){
    ctx.globalAlpha=Math.max(0,Math.min(1,t.life*2));
    outText(t.s,t.x,t.y,18,t.c);
  }
  ctx.globalAlpha=1;
}
function drawHazards(){
  for(const h of G.hazards){
    if(h.type==='wave'){
      ctx.fillStyle='rgba(255,214,140,0.85)';
      ctx.fillRect(h.x-14,GY-18,28,18);
      ctx.fillStyle='rgba(255,122,26,0.5)';
      ctx.fillRect(h.x-14,GY-26,28,8);
    } else if(h.type==='beam'){
      const b=h.boss;
      const x1=h.dir>0?b.x+b.w:0, x2=h.dir>0?G.W:b.x;
      const pulse=0.6+0.4*Math.sin(time*40);
      ctx.fillStyle=`rgba(255,77,109,${0.3+0.5*pulse})`;
      ctx.fillRect(x1,h.y,x2-x1,26);
      ctx.fillStyle='#ffffff';
      ctx.fillRect(x1,h.y+10,x2-x1,6);
    }
  }
}
function drawBossEnterAndBar(){
  const b=G.boss; if(!b) return;
  if(b.bannerT>0 && b.state!=='dead'){
    const a=Math.min(1,b.bannerT*2);
    ctx.globalAlpha=a;
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,GH/2-60,GW,120);
    outText('CHEFE',GW/2,GH/2-30,18,'#ff7a1a');
    outText(WORLDS[b.w0].boss,GW/2,GH/2,42,'#ffd60a');
    outText(WORLDS[b.w0].titulo,GW/2,GH/2+32,16,'#ffffff');
    ctx.globalAlpha=1;
  }
}function drawLighting(){
  if(G.mod!=='escuro') return;
  const p=G.player;
  const off=document.createElement('canvas');
  off.width=GW; off.height=GH;
  const o=off.getContext('2d');
  o.fillStyle='rgba(0,0,10,0.72)'; o.fillRect(0,0,GW,GH);
  const sx=p.x+p.w/2-G.camX, sy=p.y+p.h/2;
  const g=o.createRadialGradient(sx,sy,30,sx,sy,190);
  g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(1,'rgba(0,0,0,0)');
  o.globalCompositeOperation='destination-out';
  o.fillStyle=g; o.fillRect(0,0,GW,GH);
  ctx.drawImage(off,0,0);
}

function drawHUD(){
  const p=G.player;
  ctx.fillStyle='rgba(0,0,0,0.5)'; rr(12,12,260,78,10); ctx.fill();
  ctx.font=`bold 12px ${FONT}`; ctx.fillStyle='#ffe8cc'; ctx.textAlign='left'; ctx.textBaseline='middle';
  ctx.fillText('VIDA',24,26);
  ctx.fillStyle='#2a1f33'; ctx.fillRect(24,34,236,16);
  const r=clamp(p.hp/p.maxHp,0,1);
  ctx.fillStyle=r>0.5?'#6ddb5a':r>0.25?'#ffd23f':'#ff4d4d';
  ctx.fillRect(24,34,236*r,16);
  if(p.barrier>0){ ctx.fillStyle='#9be7ff'; ctx.fillRect(24,34,Math.min(236,p.barrier*236/40),4); }
  ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.strokeRect(24,34,236,16);
  for(let k=0;k<p.lives;k++){
    ctx.fillStyle=p.hero.look.skin; ctx.beginPath(); ctx.arc(34+k*24,66,7,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=p.hero.look.shirt; ctx.fillRect(28+k*24,72,12,6);
  }
  const skill=p.hero.skill;
  ctx.fillStyle=p.skillCd>0?'#777':'#ffd60a'; ctx.font=`bold 11px ${FONT}`; ctx.textAlign='right';
  ctx.fillText(p.skillCd>0?`${skill.nome} ${Math.ceil(p.skillCd)}s`:`${skill.nome} [Q]`,262,66);

  // arma e munição
  const W=WEAPON_BY[p.weapon];
  const am=p.ammo[W.id];
  ctx.fillStyle='rgba(0,0,0,0.5)'; rr(GW-260,12,248,62,10); ctx.fill();
  ctx.font=`bold 12px ${FONT}`; ctx.fillStyle='#ffe8cc'; ctx.textAlign='left';
  ctx.fillText('ARMA [R] '+W.nome,GW-248,28);
  ctx.fillStyle='#ffd60a'; ctx.font=`bold 14px ${FONT}`;
  ctx.fillText(am===Infinity?'∞ munição':`${am} munição`,GW-248,50);
  ctx.fillStyle='#ffe8cc'; ctx.font=`bold 12px ${FONT}`; ctx.textAlign='right';
  ctx.fillText('MOEDAS '+G.coins,GW-26,28);
  ctx.fillText('NÍVEL '+playerLevel(),GW-26,50);

  // etapa e objetivo
  ctx.fillStyle='rgba(0,0,0,0.5)'; rr(GW/2-200,12,400,50,10); ctx.fill();
  ctx.fillStyle='#ffffff'; ctx.font=`bold 14px ${FONT}`; ctx.textAlign='center';
  ctx.fillText(`ETAPA ${G.n} · ${G.name}`,GW/2,28);
  ctx.fillStyle='#ffe066'; ctx.font=`bold 13px ${FONT}`;
  let ot=G.obj.text;
  if(G.obj.type==='kill') ot+=` (${G.kills}/${G.obj.target})`;
  if(G.obj.type==='chipsExit') ot+=` (${G.chips}/5)`;
  if(G.obj.type==='survive') ot+=` (${Math.max(0,Math.ceil(G.timer))}s)`;
  ctx.fillText(ot,GW/2,48);

  // chefe: barra de vida
  if(G.boss && G.boss.state!=='dead'){
    const b=G.boss;
    ctx.fillStyle='rgba(0,0,0,0.5)'; rr(GW/2-260,70,520,34,8); ctx.fill();
    ctx.fillStyle='#ffd60a'; ctx.font=`bold 12px ${FONT}`; ctx.textAlign='center';
    ctx.fillText(WORLDS[b.w0].boss+` · FASE ${b.phase}/3`,GW/2,80);
    ctx.fillStyle='#2a1f33'; ctx.fillRect(GW/2-240,88,480,10);
    ctx.fillStyle='#ff4d6d'; ctx.fillRect(GW/2-240,88,480*clamp(b.hp/b.maxHp,0,1),10);
  }

  // pontuação
  ctx.fillStyle='rgba(0,0,0,0.5)'; rr(12,98,190,40,8); ctx.fill();
  ctx.fillStyle='#ffd60a'; ctx.font=`bold 18px ${FONT}`; ctx.textAlign='left';
  ctx.fillText('PONTOS '+G.score,24,118);

  // progresso no mapa
  ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,GH-14,GW,14);
  ctx.fillStyle='#ff7a1a'; ctx.fillRect(0,GH-14,GW*clamp(p.x/G.W,0,1),14);
  for(const c of G.level.cps){ ctx.fillStyle='#fff'; ctx.fillRect(GW*c/G.W,GH-14,2,14); }

  // botão de pausa
  ctx.fillStyle='rgba(0,0,0,0.5)'; rr(GW-52,92,36,32,8); ctx.fill();
  ctx.strokeStyle='#ffd60a'; ctx.lineWidth=2; rr(GW-52,92,36,32,8); ctx.stroke();
  ctx.fillStyle='#ffd60a'; ctx.fillRect(GW-40,100,4,16); ctx.fillRect(GW-30,100,4,16);

  if(G.msgT>0){
    ctx.globalAlpha=Math.min(1,G.msgT*2);
    outText(G.msg,GW/2,GH/2-120,30,'#ffd60a');
    ctx.globalAlpha=1;
  }
}

function drawGame(){
  drawBackground();
  ctx.save();
  ctx.translate(-G.camX+rnd(-G.shake,G.shake), rnd(-G.shake,G.shake)*0.6);
  drawLevel();
  drawTorches();
  drawItems();
  drawHazards();
  drawBullets();
  drawEnemies();
  drawBoss();
  drawPlayer();
  drawParts();
  drawRings();
  drawTexts();
  ctx.restore();
  drawAmbient();
  drawLighting();
  drawHUD();
  drawBossEnterAndBar();
  if(G.overlay) drawOverlay();
}

function drawOverlay(){
  ctx.fillStyle='rgba(8,4,16,0.72)'; ctx.fillRect(0,0,GW,GH);
  const o=G.overlay;
  const titles={pause:'PAUSA',clear:'ETAPA CONCLUÍDA!',worldclear:'MUNDO '+(G.w+1)+' CONCLUÍDO!',defeat:'DERROTA'};
  const cols={pause:'#ffd60a',clear:'#6ddb5a',worldclear:'#ff7a1a',defeat:'#ff4d4d'};
  outText(titles[o],GW/2,130,50,cols[o]);
  if(o==='pause'){
    outText('Sua partida continua daqui a pouco.',GW/2,200,18,'#fff');
  }
  if(o==='clear' || o==='worldclear'){
    const R=G.reward||{coins:0,xp:0,score:G.score};
    outText(`PONTUAÇÃO: ${R.score}`,GW/2,200,24,'#ffd60a');
    outText(`+${R.coins} moedas   ·   +${R.xp} XP   ·   nível ${playerLevel()}`,GW/2,240,18,'#fff');
    if(G.noDmg) outText('Sem perder vida! +500 pontos',GW/2,270,16,'#9be7ff');
    if(o==='worldclear') outText(`${WORLDS[G.w].boss} derrotado! Novo personagem e armas liberados.`,GW/2,300,15,'#ffe8cc');
    if(G.n<TOTAL && o==='clear') outText('Próxima etapa desbloqueada.',GW/2,300,15,'#ffe8cc');
    if(G.autoNext) outText('Indo para a próxima etapa em '+Math.ceil(G.autoNext)+'s...',GW/2,350,16,'#6ddb5a');
    if(G.n>=TOTAL) outText('VITÓRIA FINAL! A zona está livre.',GW/2,320,22,'#ffd60a');
  }
  if(o==='defeat'){
    outText('Sua jornada termina aqui. Tente de novo com mais preparo.',GW/2,200,16,'#fff');
    outText(`Pontuação: ${G.score}`,GW/2,240,22,'#ffd60a');
  }
  drawButtons();
}

// =====================================================================
//  DESENHO — MENUS
// =====================================================================
function drawMenuBG(){
  const g=ctx.createLinearGradient(0,0,0,GH);
  g.addColorStop(0,'#1b1030'); g.addColorStop(0.55,'#7a2e3b'); g.addColorStop(1,'#ff7a1a');
  ctx.fillStyle=g; ctx.fillRect(0,0,GW,GH);
  ctx.fillStyle='rgba(255,220,120,0.85)';
  ctx.beginPath(); ctx.arc(GW/2,330,120,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#120a1e';
  for(let k=0;k<12;k++){
    const x=((k*120-time*30)%(GW+160))-80;
    const h=90+((k*57)%120);
    ctx.fillRect(x,GH-h,90,h);
  }
  // vinheta
  const v=ctx.createRadialGradient(GW/2,GH/2,GH*0.3,GW/2,GH/2,GW*0.7);
  v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.55)');
  ctx.fillStyle=v; ctx.fillRect(0,0,GW,GH);
}

function drawBtn(b,sel){
  const g=ctx.createLinearGradient(0,b.y,0,b.y+b.h);
  const off=!b.act;
  g.addColorStop(0, off?'#2a2a33':(sel?'#ffd60a':'#3b2a4f'));
  g.addColorStop(1, off?'#1a1a22':(sel?'#ff7a1a':'#1e1530'));
  ctx.fillStyle=g; rr(b.x,b.y,b.w,b.h,12); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.13)'; rr(b.x+3,b.y+3,b.w-6,b.h*0.45,9); ctx.fill();
  ctx.strokeStyle=sel?'#ffffff':'#ff7a1a'; ctx.lineWidth=2.5; rr(b.x,b.y,b.w,b.h,12); ctx.stroke();
  ctx.fillStyle=sel?'#1a1020':(off?'#666':'#ffffff');
  ctx.font=`bold 18px ${FONT}`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(b.label,b.x+b.w/2,b.y+b.h/2+1);
  if(sel){
    ctx.fillStyle='#1a1020';
    ctx.beginPath(); ctx.moveTo(b.x+14,b.y+b.h/2-7); ctx.lineTo(b.x+22,b.y+b.h/2); ctx.lineTo(b.x+14,b.y+b.h/2+7); ctx.fill();
  }
}
function drawButtons(){
  UI.btns.forEach((b,i)=>{ if(!b.card) drawBtn(b,i===UI.sel); });
}

function drawToast(){
  if(!TOAST) return;
  const a=Math.min(1,TOAST.t*2);
  ctx.globalAlpha=a;
  ctx.fillStyle='rgba(0,0,0,0.75)'; rr(GW/2-300,GH-60,600,36,10); ctx.fill();
  outText(TOAST.text,GW/2,GH-42,15,'#ffd60a');
  ctx.globalAlpha=1;
}

function drawMenu(){
  drawMenuBG();
  outText('ZONA DE COMBATE',GW/2,80+Math.sin(time*2)*3,56,'#ffd60a');
  outText('OPERAÇÃO APOCALIPSE',GW/2,130,20,'#ffe8cc');
  drawButtons();
  const lv=playerLevel();
  outText(`Nível ${lv}  ·  ${SAVE.coins} moedas  ·  Etapa mais avançada: ${SAVE.unlocked}/${TOTAL}`,GW/2,470,15,'#ffe8cc');
  outText(`Personagem: ${(HEROES.find(h=>h.id===SAVE.hero)||HEROES[0]).nome}   ·   Arma: ${WEAPON_BY[SAVE.weapon].nome}   ·   Recorde: ${topScore()}`,GW/2,498,14,'#ffd60a');
  drawToast();
}

function drawCampaign(){
  drawMenuBG();
  outText('CAMPANHA — '+TOTAL+' ETAPAS  ·  PÁGINA '+(campPage+1)+'/2',GW/2,50,28,'#ffd60a');
  for(let w=campPage*5;w<campPage*5+5;w++){
    const y=96+(w-campPage*5)*62;
    ctx.fillStyle='rgba(20,10,30,0.7)'; rr(20,y,190,46,8); ctx.fill();
    ctx.fillStyle='#ffe8cc'; ctx.font=`bold 13px ${FONT}`; ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText('MUNDO '+(w+1),30,y+15);
    ctx.font=`12px ${FONT}`; ctx.fillText(WORLDS[w].nome,30,y+33);
  }
  UI.btns.forEach((b)=>{
    if(!b.card) return;
    const n=b.n, locked=n>SAVE.unlocked, cleared=!!SAVE.cleared[n];
    const isBoss=n%5===0;
    const g=ctx.createLinearGradient(0,b.y,0,b.y+b.h);
    g.addColorStop(0,locked?'#2a2a33':(cleared?'#2e7d4f':(isBoss?'#7a1f2b':'#3b2a4f')));
    g.addColorStop(1,locked?'#17171d':'#1e1530');
    ctx.fillStyle=g; rr(b.x,b.y,b.w,b.h,10); ctx.fill();
    if(!locked && !cleared){
      const pa=0.25+0.2*Math.sin(time*4);
      ctx.strokeStyle=`rgba(255,214,10,${pa})`; ctx.lineWidth=6;
      rr(b.x-3,b.y-3,b.w+6,b.h+6,12); ctx.stroke();
    }
    if(n===SAVE.unlocked && !locked && !cleared){
      ctx.fillStyle='#ffd60a'; ctx.font=`bold 10px ${FONT}`; ctx.textAlign='center';
      ctx.fillText('NOVO',b.x+b.w-18,b.y+8);
    }
    ctx.strokeStyle=locked?'#444':(isBoss?'#ff4d6d':'#ff7a1a'); ctx.lineWidth=2; rr(b.x,b.y,b.w,b.h,10); ctx.stroke();
    ctx.fillStyle=locked?'#666':'#fff'; ctx.font=`bold 15px ${FONT}`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(locked?'🔒 '+n:(isBoss?'BOSS '+n:'ETAPA '+n),b.x+b.w/2,b.y+15);
    ctx.font=`11px ${FONT}`; ctx.fillStyle=locked?'#555':'#ffe8cc';
    ctx.fillText(cleared?'★ concluída':(locked?'bloqueada':(SAVE.stageBest[n]?'melhor '+SAVE.stageBest[n]:'disponível')),b.x+b.w/2,b.y+33);
  });
  drawButtons();
}

function drawHeroes(){
  drawMenuBG();
  outText('PERSONAGENS',GW/2,58,34,'#ffd60a');
  HEROES.forEach((H,i)=>{
    const b=UI.btns[i], x=b.x, y=b.y;
    const owned=SAVE.heroes.includes(H.id), sel=SAVE.hero===H.id;
    ctx.fillStyle='rgba(20,10,30,0.85)'; rr(x,y,b.w,b.h,14); ctx.fill();
    ctx.strokeStyle=sel?'#ffd60a':(owned?'#ff7a1a':'#444'); ctx.lineWidth=sel?4:2; rr(x,y,b.w,b.h,14); ctx.stroke();
    drawHuman(H.look,x+b.w/2,y+150,1,2.2,{anim:time,walk:false,air:false,aim:0});
    ctx.fillStyle='#fff'; ctx.font=`bold 14px ${FONT}`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(H.nome,x+b.w/2,y+170);
    drawWrap(H.desc,x+b.w/2,y+190,b.w-14,15,11,'#ffe8cc');
    ctx.fillStyle='#ffd60a'; ctx.font=`bold 11px ${FONT}`;
    ctx.fillText('HAB: '+H.skill.nome,x+b.w/2,y+228);
    const stats=[['VIDA',H.hp/160],['VELOC',H.speed/300],['DANO',H.dmg/25]];
    stats.forEach((s,k)=>{
      const yy=y+248+k*16;
      ctx.fillStyle='#fff'; ctx.font=`bold 10px ${FONT}`; ctx.textAlign='left';
      ctx.fillText(s[0],x+12,yy);
      ctx.fillStyle='#2a1f33'; ctx.fillRect(x+60,yy-4,68,8);
      ctx.fillStyle='#ff7a1a'; ctx.fillRect(x+60,yy-4,68*clamp(s[1],0,1),8);
    });
    let status;
    if(sel) status='★ SELECIONADO';
    else if(owned) status='TOQUE PARA USAR';
    else if(H.req) status=`MUNDO ${H.req.world} CONCLUÍDO`;
    else status=`COMPRAR: ${H.cost} moedas`;
    ctx.fillStyle=sel?'#ffd60a':'#ffe8cc'; ctx.font=`bold 10px ${FONT}`; ctx.textAlign='center';
    ctx.fillText(status,x+b.w/2,y+b.h-12);
  });
  drawButtons();
  drawToast();
}

function drawArsenal(){
  drawMenuBG();
  outText('ARSENAL',GW/2,58,34,'#ffd60a');
  WEAPONS.forEach((W,i)=>{
    const b=UI.btns[i], x=b.x, y=b.y;
    const owned=SAVE.weapons.includes(W.id), sel=SAVE.weapon===W.id, lv=SAVE.wlv[W.id]||0;
    ctx.fillStyle='rgba(20,10,30,0.85)'; rr(x,y,b.w,b.h,12); ctx.fill();
    ctx.strokeStyle=sel?'#ffd60a':(owned?'#ff7a1a':'#444'); ctx.lineWidth=sel?4:2; rr(x,y,b.w,b.h,12); ctx.stroke();
    // ícone da arma
    ctx.fillStyle=owned?W.color:'#444';
    rr(x+12,y+30,94,22,6); ctx.fill();
    ctx.fillStyle='#1a1020'; ctx.fillRect(x+12,y+46,20,10);
    ctx.fillStyle='#fff'; ctx.font=`bold 12px ${FONT}`; ctx.textAlign='center'; ctx.textBaseline='middle';
    drawWrap(W.nome,x+b.w/2,y+96,b.w-12,14,12,'#fff');
    const rows=[`DANO ${Math.round(W.dmg*(1+0.15*lv))}`,`CADÊNCIA ${(1/W.rate).toFixed(1)}/s`,W.ammo===Infinity?'MUNIÇÃO ∞':`MUNIÇÃO ${W.ammo}`,`NÍVEL ${lv}/3`];
    rows.forEach((t,k)=>{ ctx.fillStyle='#ffe8cc'; ctx.font=`11px ${FONT}`; ctx.fillText(t,x+b.w/2,y+140+k*18); });
    ctx.fillStyle=sel?'#ffd60a':(owned?'#ffe8cc':'#888');
    ctx.font=`bold 11px ${FONT}`;
    ctx.fillText(sel?'★ EQUIPADA':(owned?'TOQUE PARA EQUIPAR':'ETAPA '+W.stage),x+b.w/2,y+b.h-14);
  });
  const W=WEAPON_BY[SAVE.weapon];
  const lv=SAVE.wlv[W.id]||0;
  ctx.fillStyle='#ffe8cc'; ctx.font=`bold 15px ${FONT}`; ctx.textAlign='center';
  ctx.fillText(lv>=3?`${W.nome} no nível máximo`:`Melhorar ${W.nome}: ${150*(lv+1)} moedas (+15% de dano)`,GW/2,350);
  drawButtons();
  drawToast();
}

function drawShop(){
  drawMenuBG();
  outText('LOJA',GW/2,58,34,'#ffd60a');
  outText(`Moedas disponíveis: ${SAVE.coins}`,GW/2,92,18,'#ffe8cc');
  drawButtons();
  drawToast();
}

function drawSettings(){
  drawMenuBG();
  outText('CONFIGURAÇÕES',GW/2,60,34,'#ffd60a');
  outText(`Volume música: ${SAVE.settings.musVol}/10   ·   Volume efeitos: ${SAVE.settings.sfxVol}/10`,GW/2,430,16,'#ffe8cc');
  drawButtons();
}

function drawAch(){
  drawMenuBG();
  outText('CONQUISTAS',GW/2,58,34,'#ffd60a');
  ACH.forEach((a,i)=>{
    const y=92+i*42, got=!!SAVE.ach[a.id];
    ctx.fillStyle='rgba(20,10,30,0.85)'; rr(120,y,720,38,8); ctx.fill();
    ctx.strokeStyle=got?'#ffd60a':'#444'; ctx.lineWidth=2; rr(120,y,720,38,8); ctx.stroke();
    ctx.textBaseline='middle'; ctx.textAlign='left';
    ctx.fillStyle=got?'#6ddb5a':'#777'; ctx.font=`bold 15px ${FONT}`;
    ctx.fillText((got?'✔ ':'○ ')+a.nome,136,y+19);
    ctx.fillStyle=got?'#ffe8cc':'#888'; ctx.font=`13px ${FONT}`; ctx.textAlign='right';
    ctx.fillText(a.desc,824,y+19);
  });
  drawButtons();
}

function drawRecords(){
  drawMenuBG();
  outText('RECORDES',GW/2,58,34,'#ffd60a');
  if(!SAVE.records.length) outText('Nenhum recorde ainda. Jogue uma etapa!',GW/2,240,20,'#fff');
  SAVE.records.forEach((r,i)=>{
    const y=100+i*40;
    ctx.fillStyle='rgba(20,10,30,0.85)'; rr(140,y,680,34,8); ctx.fill();
    ctx.font=`bold 15px ${FONT}`; ctx.textBaseline='middle';
    ctx.fillStyle='#ffd60a'; ctx.textAlign='left'; ctx.fillText(`${i+1}º`,156,y+17);
    ctx.fillStyle='#fff'; ctx.fillText(r.nome,200,y+17);
    ctx.fillStyle='#ffe8cc'; ctx.fillText('Etapa '+r.fase+(r.venceu?' ✔':''),420,y+17);
    ctx.fillStyle='#ffd60a'; ctx.textAlign='right'; ctx.fillText(String(r.score),800,y+17);
  });
  drawButtons();
}

function drawHelp(){
  drawMenuBG();
  outText('COMO JOGAR',GW/2,58,34,'#ffd60a');
  const lines=[
    'Objetivo: cumpra o objetivo de cada etapa. Derrote o chefe de todo quinto nível.',
    'Andar: A/D ou ←/→    Pular: Espaço, W ou ↑ (Doutor Chip pula duas vezes)',
    'Atirar: J, K ou X    Mirar para cima: segure E    Mirar para baixo no ar: segure S',
    'Trocar arma: R    Habilidade do personagem: Q    Pausa: Esc ou P',
    'No celular: botões na tela. Gire para o modo paisagem.',
    'Caixas podem ser destruídas a tiros. Algumas escondem áreas secretas.',
    'Moedas compram personagens, munição e melhorias na LOJA.',
    'Você tem 3 vidas por etapa. Ao morrer, volta ao último ponto de controle.',
    'O progresso é salvo automaticamente ao concluir cada etapa.'
  ];
  ctx.fillStyle='#ffffff'; ctx.font=`15px ${FONT}`; ctx.textAlign='left'; ctx.textBaseline='middle';
  lines.forEach((l,i)=>ctx.fillText(l,60,110+i*36));
  drawButtons();
}

// =====================================================================
//  LOOP PRINCIPAL
// =====================================================================
function update(dt){
  time+=dt;
  updateFx(dt);
  if(scene==='game' && G && !G.overlay) updateGame(dt);
  if(scene==='game' && G && G.overlay==='clear' && G.autoNext){
    G.autoNext-=dt;
    if(G.autoNext<=0){ G.autoNext=null; activate('next'); }
  }
  if(TOAST) { /* atualizado em updateFx */ }
  IN.prev={...IN.held};
}

function draw(){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.save();
  if(scene==='menu') drawMenu();
  else if(scene==='campaign') drawCampaign();
  else if(scene==='heroes') drawHeroes();
  else if(scene==='arsenal') drawArsenal();
  else if(scene==='shop') drawShop();
  else if(scene==='settings') drawSettings();
  else if(scene==='ach') drawAch();
  else if(scene==='records') drawRecords();
  else if(scene==='help') drawHelp();
  else if(scene==='game' && G){ drawGame(); drawToast(); }
  ctx.restore();
}

let last=performance.now();
function frame(now){
  const dt=Math.min(0.033,(now-last)/1000);
  last=now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

applyLayout();
UI.btns=buildButtons('menu');
setScene();
requestAnimationFrame(frame);
