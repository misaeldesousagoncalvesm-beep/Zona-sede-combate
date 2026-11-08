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
