const cv=document.getElementById('c'),g=cv.getContext('2d');cv.width=320;cv.height=180;

const isT = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
if (isT) document.body.classList.add('t');

let S,D,pops=[],parts=[],bub=null,AC;
const K={};
let playerName='Lucas';
let titleSel = 0; // Menu de Título Selecionado

const nameScreen=document.getElementById('nameScreen'),nameInput=document.getElementById('nameInput'),startBtn=document.getElementById('startBtn'),nameError=document.getElementById('nameError');
const helpScreen=document.getElementById('helpScreen'),closeHelpBtn=document.getElementById('closeHelpBtn');

function init(){
  S={mode:'title',name:playerName,scene:'room',spawnPoint:{sc:'room',x:160,y:112},eq:50,en:100,t:0,p:{x:160,y:112,d:'d',f:1,ft:0,mov:0,it:0,ht:0,dash:0,dx:0,dy:0,atkCd:0},cam:0,done:{},items:{},colls:{},expl:{},sel:0,fade:0,fd:0,fcb:null,sh:100,W:320,ymin:58,objs:[],solids:[],lights:[],duvs:[],attacks:[],boss:null,obj:'',flags:{},dis:0,endingTitle:'',endingText:''};
  pops=[];parts=[];bub=null;D=null;
}

function fit(){
  const padEl = document.getElementById('pad');
  const ph = (isT && padEl) ? padEl.offsetHeight : 0;
  let s = Math.min(innerWidth / 320, (innerHeight - ph) / 180);
  if(s >= 1) s = Math.floor(s);
  cv.style.width = (320 * s) + 'px';
  cv.style.height = (180 * s) + 'px';
}
addEventListener('resize',fit);fit();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),hyp=Math.hypot;

const MOTIVATIONAL_QUOTES = [
  "EU CONSIGO!",
  "SOU CAPAZ!",
  "EU POSSO!",
  "CORAGEM!",
  "TUDO PASSA!",
  "ACREDITE!",
  "SOU SUFICIENTE!",
  "VOU SUPERAR!",
  "RESPIRA E VAI!",
  "TENHO FORÇA!"
];

function openNameScreen(){nameScreen.style.display='flex';nameInput.value=playerName;nameError.textContent='';setTimeout(()=>nameInput.focus(),50)}
function startGameWithName(){
  const n=nameInput.value.replace(/\s+/g,' ').trim();
  if(n.length<2){nameError.textContent='Digite um nome com pelo menos 2 caracteres.';nameInput.focus();return}
  playerName=n.slice(0,16);nameScreen.style.display='none';
  init();S.mode='play';load('room');
  say([[playerName,'Onde eu estou?'],['Voz','Você está dentro de você mesmo.'],[playerName,'Isso não faz sentido...'],['Voz','Encontre seus sentimentos e use seus pensamentos para recuperar o equilíbrio.']]);
}
function normalizeLines(lines){return lines.map(a=>[a[0]==='Lucas'?playerName:a[0],String(a[1]).replace(/\bLucas\b/g,playerName)])}

/* Efeitos sonoros */
let soundOn=true;
function beep(f=440,d=.06,v=.03,ty='square'){
  if(!soundOn)return;
  try{
    AC=AC||new(window.AudioContext||window.webkitAudioContext)();
    const o=AC.createOscillator(),n=AC.createGain();
    o.type=ty;o.frequency.value=f;n.gain.value=v;o.connect(n);n.connect(AC.destination);
    o.start();n.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);o.stop(AC.currentTime+d)
  }catch(e){}
}

function tone(f1,f2,d,v,ty,dl){if(!soundOn)return;setTimeout(()=>{try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),n=AC.createGain(),t=AC.currentTime;o.type=ty||'square';o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,f2),t+d);n.gain.setValueAtTime(v||.04,t);n.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(n);n.connect(AC.destination);o.start(t);o.stop(t+d)}catch(e){}},dl||0)}
function sfx(k){const m={dash:()=>tone(520,160,.14,.04,'sine'),hit:()=>{tone(900,400,.1,.05,'square');tone(300,120,.12,.04,'sawtooth',30)},hurt:()=>tone(220,80,.25,.06,'sawtooth'),collect:()=>[660,880,1175,1568].forEach((f,i)=>tone(f,f,.14,.045,'triangle',i*70)),choice:()=>{tone(600,900,.08,.04,'square');tone(900,1200,.08,.04,'square',70)},scene:()=>tone(240,720,.4,.035,'sine'),win:()=>[523,659,784,1047,1319].forEach((f,i)=>tone(f,f,.25,.05,'triangle',i*120)),lose:()=>[330,262,196,147].forEach((f,i)=>tone(f,f*.97,.3,.05,'sawtooth',i*160)),slam:()=>tone(120,40,.3,.08,'sawtooth'),ok:()=>tone(520,780,.12,.04,'sine')};(m[k]||(()=>{}))()}
function puff(x,y,n){const c={room:'#6a5a8a',forest:'#6a5a44',city:'#9a9cb6',garden:'#e8d8a8',shadow:'#4a3a6a'}[S.scene]||'#999';for(let i=0;i<n;i++)if(parts.length<200)parts.push({x:x+(Math.random()-.5)*8,y:y-1,vx:(Math.random()-.5)*.5,vy:-.1-Math.random()*.2,l:14+(Math.random()*8|0),c,tw:0})}
function hurtFx(){S.shake=Math.max(S.shake||0,3.5);S.hurtF=14;burst(S.p.x,S.p.y-10,'#ff5a6a',10,0);sfx('hurt')}
function push(dx,dy){for(let i=0;i<4;i++){mv(dx/4,0);mv(0,dy/4)}}
function npcDir(x,y){const p=S.p,dx=p.x-x,dy=p.y-y;if(hyp(dx,dy)>90)return'd';return Math.abs(dx)>Math.abs(dy)*1.4?(dx>0?'r':'l'):(dy>0?'d':'u')}
function chg(n){if(!n)return;S.eq=clamp(S.eq+n,0,100);S.bp=n>0?14:-14;pops.push({t:(n>0?'+':'')+n+' EQUILÍBRIO',x:S.p.x-32,y:S.p.y-28,l:80,c:n>0?'#8fffa0':'#ff8a8a'});for(let i=0;i<(n>0?10:8);i++)if(parts.length<200)parts.push({x:S.p.x+(Math.random()-.5)*14,y:S.p.y-8-Math.random()*8,vx:(Math.random()-.5)*.4,vy:n>0?-.5-Math.random()*.4:.35+Math.random()*.3,l:34,c:n>0?(i%2?'#8fffa0':'#fff'):'#6a3a8a',tw:0});beep(n>0?660:180,.12,.04)}

function upd(){
  const s=S.scene, c=Object.keys(S.colls).length;
  if(s==='room')S.obj=S.flags.door?'Atravesse a porta no armário.':'Explore o quarto ('+Math.min(4,Object.keys(S.expl).length)+'/4).';
  else if(s==='forest')S.obj=S.flags.bossDefeated?'Siga para a direita.':'Ache os 3 fragmentos ('+Math.min(3,c)+'/3).';
  else if(s==='city')S.obj=S.flags.bridge?'Encontre Pedro.':'Ajude os moradores ('+['n1','n2','n3'].filter(k=>S.expl[k]).length+'/3).';
  else if(s==='garden')S.obj='Faça atividades ('+['mus','cam','des'].filter(k=>S.expl[k]).length+'/3).';
  else if(s==='shadow')S.obj='Enfrente a Sombra.';else S.obj='';
}

function saveGame(show=true){
  try{
    const data={name:playerName,scene:S.scene,spawnPoint:S.spawnPoint,eq:S.eq,p:{x:S.p.x,y:S.p.y,d:S.p.d},done:S.done,items:S.items,colls:S.colls,expl:S.expl,flags:S.flags};
    localStorage.setItem('dentroDaMenteSave',JSON.stringify(data));
    if(show)say([['Sistema','Progresso salvo com sucesso.']]);
    return true;
  }catch(e){if(show)say([['Sistema','Não foi possível salvar neste navegador.']]);return false}
}

function loadGame(){
  try{
    const data=JSON.parse(localStorage.getItem('dentroDaMenteSave')||'null');
    if(!data)return false;
    playerName=data.name||'Jogador'; init();
    S.mode='play'; S.name=playerName; S.eq=data.eq??50; S.done=data.done||{}; S.items=data.items||{}; S.colls=data.colls||{}; S.expl=data.expl||{}; S.flags=data.flags||{};
    if(data.spawnPoint)S.spawnPoint=data.spawnPoint;
    load(data.scene||'room',data.p?.x,data.p?.y);
    upd(); say([['Sistema','Progresso carregado! Bem-vindo de volta, '+playerName+'.']]);
    return true;
  }catch(e){return false}
}

/* Diálogos */
function say(lines,cb){D={l:normalizeLines(lines),i:0,sh:0,cb,ch:null,sel:0};S.mode='dialog';beep(520,.05)}
function ask(who,text,opts,cb){D={l:normalizeLines([[who,text]]),i:0,sh:0,cb:null,ch:opts,sel:0,chcb:cb};S.mode='dialog'}
function choose(i){if(S.mode!=='dialog'||!D||!D.ch||i<0||i>=D.ch.length)return;const o=D.ch[i],cb=D.chcb;S.mode='play';S.banner={v:o.eq||0,l:70};sfx('choice');chg(o.eq||0);cb(i)}

/* Ações de Batalha e Movimento */
function dodge(){
  if(S.mode!=='play'||S.p.dash>0) return;
  const dirs={r:[1,0],l:[-1,0],u:[0,-1],d:[0,1]};
  const d=dirs[S.p.d]||[1,0];
  S.p.dash=12; S.p.dx=d[0]*3.5; S.p.dy=d[1]*3.5;
  sfx('dash');puff(S.p.x,S.p.y,6);S.shake=Math.max(S.shake||0,1);S.zoom=1.03;
}

function attack(){
  if(S.mode!=='play'||S.p.atkCd>0) return false;
  S.p.atkCd = 110; // Delay entre tiros (~1.8s)

  beep(880,.08,.05,'sine');
  beep(1100,.1,.04,'triangle');S.shake=Math.max(S.shake||0,1.1);
  const dirs={r:[1,0],l:[-1,0],u:[0,-1],d:[0,1]};
  const d=dirs[S.p.d]||[1,0];
  
  const text = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
  const forwardOffset = 28;
  const startX = S.p.x + d[0] * forwardOffset;
  const startY = (S.p.y - 10) + d[1] * forwardOffset;

  S.attacks.push({
    x: startX, y: startY,
    vx: d[0] * 2.2, vy: d[1] * 2.2,
    text: text, r: 14, l: 55, maxL: 55,
    rot: (Math.random() - 0.5) * 0.15
  });

  for(let i = 0; i < 4; i++){
    parts.push({
      x: S.p.x + (Math.random() - 0.5) * 8,
      y: S.p.y - 18 + (Math.random() - 0.5) * 8,
      vy: -0.3 - Math.random() * 0.4,
      l: 25, c: '#ffe28a', tw: 1
    });
  }
  return true;
}

function press(){
  const m=S.mode;
  if(m==='title'){
    beep(660,.08);
    if(titleSel===0){ openNameScreen(); }
    else if(titleSel===1){ if(!loadGame()){ say([['Sistema','Nenhum jogo salvo foi encontrado.']]); } }
    else if(titleSel===2){ helpScreen.style.display='flex'; }
    else if(titleSel===3){ soundOn = !soundOn; beep(500,.05); }
    else if(titleSel===4){ S.mode='credits'; S.t=0; S.creditStage=0; S.creditPage=0; }
    return;
  }
  if(m==='gameover'){
    S.mode='play'; S.eq=50;
    load(S.spawnPoint.sc, S.spawnPoint.x, S.spawnPoint.y);
    say([['Voz','Você ressurgiu. Respire fundo e siga em frente.']]);
    return;
  }
  if(m==='end'){endPress();return}
  if(m==='credits'){ if((S.creditStage||0)<2){S.creditStage=(S.creditStage||0)+1;S.creditPage=0;S.t=0;sfx('scene');}else{init();S.mode='title';} return}
  if(m==='menu'){
    beep(600,.05);
    if(S.sel===0){S.mode='play';return}
    if(S.sel===1){saveGame(true);return}
    if(S.sel===2){if(!loadGame())say([['Sistema','Ainda não existe um progresso salvo.']]);return}
    if(S.sel===3){soundOn=!soundOn;return}
    if(S.sel===4){S.mode='credits';S.t=0;S.creditStage=0;S.creditPage=0;return}
    if(S.sel===5){init();S.mode='title';return}
  }
  if(m==='dialog'){
    const L=D.l[D.i][1];
    if(D.sh<L.length){D.sh=L.length;return}
    if(D.ch) return choose(D.sel);
    beep(520,.04); D.i++;
    if(D.i>=D.l.length){S.mode='play';D.cb&&D.cb()}
    return;
  }
  if(m==='play'&&!S.fd){
    const o=near();
    if(o){ S.p.it=20; beep(400,.05); o.act(); }
    else { attack(); }
  }
}

function menu(){if(S.mode==='play'){S.mode='menu';S.sel=0}else if(S.mode==='menu')S.mode='play'}

const KM={w:'u',arrowup:'u',s:'d',arrowdown:'d',a:'l',arrowleft:'l',d:'r',arrowright:'r'};
startBtn.addEventListener('click',startGameWithName);
nameInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();startGameWithName()}});
closeHelpBtn.addEventListener('click',()=>helpScreen.style.display='none');

/* Event Listeners de Teclado */
addEventListener('keydown',e=>{
  if(e.target===nameInput||e.target===startBtn)return;
  const k=e.key.toLowerCase();

  // Navegação no Menu Inicial
  if(S.mode==='title'&&(k==='w'||k==='arrowup'||k==='s'||k==='arrowdown')){
    titleSel = (titleSel + (k==='w'||k==='arrowup'?-1:1) + 5) % 5;
    beep(500,.03); e.preventDefault(); return;
  }
  // Navegação na Escolha de Diálogo
  if(S.mode==='dialog'&&D&&D.ch&&(k==='w'||k==='arrowup'||k==='s'||k==='arrowdown')){
    D.sel=(D.sel+(k==='w'||k==='arrowup'?-1:1)+D.ch.length)%D.ch.length;
    beep(500,.03); e.preventDefault(); return;
  }
  // Navegação SOMENTE nos créditos
  if(S.mode==='credits'&&(k==='w'||k==='arrowup'||k==='s'||k==='arrowdown')){
    if((S.creditStage||0)===0){
      const max=4;
      S.creditPage=(S.creditPage+(k==='w'||k==='arrowup'?-1:1)+max)%max;
      beep(500,.03);
    }
    e.preventDefault(); return;
  }

  // Navegação no Menu de Pausa
  if(S.mode==='menu'&&(k==='w'||k==='arrowup'||k==='s'||k==='arrowdown')){
    S.sel=(S.sel+((k==='w'||k==='arrowup')?-1:1)+6)%6;
    beep(500,.03); e.preventDefault(); return;
  }

  if(KM[k]){K[KM[k]]=1;e.preventDefault();return}
  if(k===' '){e.preventDefault(); if(S.mode==='play') dodge(); else press(); return;}
  if(k==='e'||k==='enter'){e.preventDefault(); press(); return;}
  if(k==='escape'){if(S.mode==='credits'){init();S.mode='title';return;}menu();return}
});
addEventListener('keyup',e=>{const k=e.key.toLowerCase();if(KM[k])K[KM[k]]=0});

document.querySelectorAll('[data-k]').forEach(b=>{
  const k=b.dataset.k;
  b.addEventListener('pointerdown',e=>{e.preventDefault();K[k]=1});
  ['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>K[k]=0));
});
document.getElementById('ea').addEventListener('pointerdown',e=>{e.preventDefault();press()});
document.getElementById('ed').addEventListener('pointerdown',e=>{e.preventDefault();if(S.mode==='play')dodge();else press()});
document.getElementById('mn').addEventListener('pointerdown',e=>{e.preventDefault();menu()});

/* Cliques diretos na Tela (Canvas Touch Hitboxes) */
cv.addEventListener('pointerdown', e => {
  const rect = cv.getBoundingClientRect();
  const cx = (e.clientX - rect.left) * (320 / rect.width);
  const cy = (e.clientY - rect.top) * (180 / rect.height);

  if (S.mode === 'end') { press(); return; }
  if (S.mode === 'credits') { press(); return; }
  if (S.mode === 'title') {
    const startY = 82;
    const itemH = 16;
    for (let i = 0; i < 5; i++) {
      const yMin = startY + i * itemH;
      const yMax = yMin + itemH;
      if (cx >= 60 && cx <= 260 && cy >= yMin && cy <= yMax) {
        titleSel = i;
        press();
        break;
      }
    }
  } else if (S.mode === 'menu') {
    if (cx >= 50 && cx <= 270) {
      const startY = 64;
      const itemH = 17;
      for (let i = 0; i < 6; i++) {
        const yMin = startY + i * itemH;
        const yMax = yMin + itemH;
        if (cy >= yMin && cy <= yMax) {
          S.sel = i;
          press();
          break;
        }
      }
    }
  } else if (S.mode === 'dialog' && D && D.ch && D.oy) {
    if (cx >= 12 && cx <= 308) {
      for (let i = 0; i < D.ch.length; i++) {
        const yMin = D.oy + i * 11 - 2;
        const yMax = yMin + 12;
        if (cy >= yMin && cy <= yMax) {
          D.sel = i;
          choose(i);
          break;
        }
      }
    }
  }
});

function near(){
  let b=null,bd=1e9;
  for(const o of S.objs){
    if(!o.act||(o.vis&&!o.vis()))continue;
    const p=S.p;
    const cx=clamp(p.x,o.x,o.x+o.w);
    const cy=clamp(p.y,o.y,o.y+o.h);
    const d=hyp(p.x-cx,p.y-cy);
    if(d<=(o.radius||24)){
      const centerD=hyp(p.x-(o.x+o.w/2),p.y-(o.y+o.h/2));
      if(centerD<bd){bd=centerD;b=o}
    }
  }
  return b;
}

function seed(n){let s=n;return()=>(s=s*16807%2147483647)/2147483647}

function load(sc,px,py){
  S.scene=sc; S.objs=[]; S.solids=[]; S.lights=[]; S.duvs=[]; S.attacks=[]; parts=[]; S.boss=null;
  const O=S.objs, Sd=S.solids;
  const ob=(x,y,w,h,act,o)=>O.push(Object.assign({x,y,w,h,act,radius:24},o||{}));

  if(sc==='room'){
    S.W=320; S.ymin=62; S.p.x=px||160; S.p.y=py||112;
    S.spawnPoint={sc:'room',x:S.p.x,y:S.p.y};
    Sd.push([0,0,320,58],[14,52,56,34],[112,44,64,18],[262,22,40,60]);
    const ex=(id,txt,n)=>()=>{say(txt,()=>{if(n&&!S.expl[id]){S.expl[id]=1;if(Object.keys(S.expl).length>=4&&!S.flags.door){S.flags.door=1;say([['Voz','Uma porta misteriosa apareceu dentro do armário. Talvez seja hora de sair.']])}upd()}})};
    ob(14,52,56,34,ex('cama',[['Lucas','Passei horas aqui, mas minha cabeça não me deixou descansar.']],1));
    ob(122,28,22,18,ex('pc',[['COMPUTADOR','Há várias notificações.'],['Lucas','Parece que todo mundo está vivendo melhor do que eu.']],1),{radius:32,id:'pc'});
    ob(158,46,10,10,ex('cel',[['Lucas','Tenho várias mensagens que ainda não respondi.']],1));
    ob(198,6,44,32,ex('jan',[['JANELA','Lá fora, tudo parece normal.'],['Lucas','Talvez eu não precise fingir que está tudo bem o tempo todo.']],1),{radius:32,id:'jan'});
    ob(262,22,40,60,()=>{ if(S.flags.door){ beep(300,.2); go('forest'); } else { ex('arm',[['Lucas','Roupas que quase não uso mais.']])(); } },{door:1});
  }
  else if(sc==='forest'){
    S.W=480; S.ymin=40; S.p.x=px||20; S.p.y=py||100; S.lights=[[110,100,30],[250,85,30],[370,125,30]];
    S.spawnPoint={sc:'forest',x:20,y:100};
    const r=seed(11),keep=[[20,100],[150,45],[270,150],[400,60],[110,100],[250,85],[370,125],[470,100],[300,100]];S.trees=[];
    for(let i=0;i<30;i++){const x=20+r()*450,y=44+r()*130;if(keep.some(k=>hyp(k[0]-x,k[1]-y)<34))continue;S.trees.push([x|0,y|0]);Sd.push([x-4,y-5,8,7])}
    Sd.push([476,0,10,180]);

    const fr=[
      ['coragem','FRAGMENTO DA CORAGEM',150,45,'#6ff3ff','Lucas','Dá medo, mas eu posso dar um passo de cada vez.'],
      ['esperanca','FRAGMENTO DA ESPERANÇA',270,150,'#ffb347','Lucas','Nem tudo que penso de ruim é verdade.'],
      ['calma','FRAGMENTO DA CALMA',400,60,'#ff8ad0','Lucas','Eu posso respirar e me acalmar.']
    ];
    fr.forEach(f=>ob(f[2]-7,f[3]-7,14,14,()=>{
      S.colls[f[0]]=1; chg(10); burst(f[2],f[3],f[4]);sfx('collect');S.zoom=1.05;
      const qtd=Object.keys(S.colls).length;
      say([['Item','Você encontrou o '+f[1]+'! ('+qtd+'/3)'],[f[5],f[6]]],()=>{
        if(qtd===3) say([['Voz','Você reuniu todas as memórias da floresta!']]);
        upd();
      });
    },{vis:()=>!S.colls[f[0]],frag:f}));

    ob(220,45,14,12,()=>{
      if(!S.items.bau1){ S.items.bau1=1; chg(10); say([['Baú','Você encontrou um baú secreto e fortaleceu seu Equilíbrio!']]); }
      else say([['Baú','O baú está vazio.']]);
    });

    S.duvs=[{x:180,y:90,sp:0.4,hp:2},{x:320,y:120,sp:0.5,hp:2}];
    S.boss={x:430,y:90,sp:0.6,hp:4,maxHp:4,active:true};
  }
  else if(sc==='city'){
    S.W=480; S.ymin=76; S.p.x=px||20; S.p.y=py||120;
    S.spawnPoint={sc:'city',x:20,y:120};
    Sd.push([0,0,480,72],[400,72,32,120]);
    const np=(id,x,y,c,hr,fn,nm)=>ob(x-8,y-14,16,18,fn,{npc:{x,y,c,hr},id,nm});

    np('n1',90,112,'#8a5a8a','#c9a35a',()=>{
      if(S.expl.n1) return say([['Homem','Obrigado por me ouvir.']]);
      ask('Homem','Eu digo que está tudo bem porque não quero preocupar ninguém.',[
        {t:'Você pode conversar comigo.',eq:15}, {t:'Todo mundo tem problemas.',eq:0}
      ],i=>{ S.expl.n1=1; if(i===0)S.flags.p1=1; upd(); if(S.expl.n1&&S.expl.n2&&S.expl.n3) S.flags.bridge=1; });
    });
    np('n2',220,110,'#4a9a7a','#3a2a1a',()=>{
      if(S.expl.n2) return say([['Garoto','Vou parar de me comparar tanto.']]);
      ask('Garoto','Parece que todo mundo é mais feliz do que eu.',[
        {t:'Às vezes a gente só vê o que as pessoas mostram.',eq:15}, {t:'Talvez você tenha razão.',eq:-5}
      ],i=>{ S.expl.n2=1; if(i===0)S.flags.p2=1; upd(); if(S.expl.n1&&S.expl.n2&&S.expl.n3) S.flags.bridge=1; });
    });
    np('n3',345,120,'#c9604a','#222',()=>{
      if(S.expl.n3) return say([['Mulher','Pedir ajuda foi o primeiro passo.']]);
      ask('Mulher','Eu achei que precisava resolver tudo sozinha.',[
        {t:'Talvez ninguém precise fazer isso sozinho.',eq:15}, {t:'Boa sorte com isso.',eq:-10}
      ],i=>{ S.expl.n3=1; if(i===0)S.flags.p3=1; upd(); if(S.expl.n1&&S.expl.n2&&S.expl.n3) S.flags.bridge=1; });
    });

    ob(360,90,40,40,()=>{
      if(S.flags.bridge) go('garden');
      else say([['Lucas','A ponte está quebrada. Preciso escutar e ajudar os 3 moradores.']]);
    },{vis:()=>true,bridge:1});
  }
  else if(sc==='garden'){
    S.W=320; S.ymin=60; S.p.x=px||40; S.p.y=py||100;
    S.spawnPoint={sc:'garden',x:40,y:100};
    Sd.push([0,0,320,52],[142,76,36,22],[34,112,32,12]);

    const act=(id,x,y,w,h,msg)=>ob(x,y,w,h,()=>{
      if(!S.expl[id]){ S.expl[id]=1; chg(10); burst(x+w/2,y+h/2,'#ffd0f0',20,0); sfx('ok'); }
      say([['Lucas',msg]],()=>{
        upd();
        if(S.expl.mus&&S.expl.cam&&S.expl.des&&!S.fd) setTimeout(()=>go('shadow'),300);
      });
    });

    act('mus',244,100,16,16,'Essa música me acalma. Fazia tempo que não ouvia.');
    act('cam',52,66,16,16,'Caminhar sem pressa também é cuidar de mim.');
    act('des',34,112,32,12,'Descansar não é desistir. É recuperar as forças.');
  }
  else if(sc==='shadow'){
    S.W=320; S.ymin=60; S.p.x=px||70; S.p.y=py||140;
    S.spawnPoint={sc:'shadow',x:70,y:140};
    S.sh=100; S.dis=0;
    setTimeout(()=>finalBoss(),600);
  }
  upd(); S.cam=clamp(S.p.x-160,0,S.W-320); if(sc!=='forest'){S.dk=0} S.area={t:{room:'O QUARTO',forest:'FLORESTA DOS PENSAMENTOS',city:'CIDADE DA SOLIDÃO',garden:'JARDIM DO EQUILÍBRIO',shadow:'A SOMBRA'}[sc],l:150}; S.zoom=1;
}

function go(sc,px,py){S.fd=1;S.fto=sc;sfx('scene');S.fcb=()=>load(sc,px,py)}

function finalBoss(){
  ask('A SOMBRA','Você realmente acha que tudo vai ficar bem?',[
    {t:'Não posso mudar o passado, mas posso cuidar de mim hoje.',eq:15},
    {t:'Eu não sei... mas quero tentar.',eq:5},
    {t:'Talvez seja inútil...',eq:-15}
  ],(i)=>{
    S.flags.shadowChoice=i+1;
    const id=pickEnding();
    saveGame(false);
    startEnding(id);
  });
}

function mv(dx,dy){const p=S.p,x=p.x+dx,y=p.y+dy;if(x<6||x>S.W-6||y<S.ymin||y>176)return;for(const s of S.solids)if(x+4>s[0]&&x-4<s[0]+s[2]&&y+1>s[1]&&y-3<s[1]+s[3])return;p.x=x;p.y=y}

function update(){
  S.t++; const p=S.p; npcTick(); if(S.mode==='end')endStep();
  if(S.fd){
    S.fade+=S.fd*.04;
    if(S.fade>=1&&S.fd>0){S.fade=1;S.fd=-1;S.fcb&&S.fcb();S.fcb=null;S.cam=0}
    else if(S.fade<=0&&S.fd<0){S.fade=0;S.fd=0}
  }

  if(S.mode==='play'&&!S.fd){
    if(p.dash>0){
      p.dash--; mv(p.dx,0); mv(0,p.dy); p.mov=true;
      if(parts.length<200)parts.push({x:p.x+(Math.random()-.5)*6,y:p.y-4-Math.random()*8,vx:-p.dx*.15,vy:-p.dy*.15,l:12,c:'#cfe8ff',tw:0});
      if(p.dash===0){p.vx=p.dx*.5;p.vy=p.dy*.5;puff(p.x,p.y,6);S.shake=Math.max(S.shake||0,.8)}
    } else {
      let dx=(K.r?1:0)-(K.l?1:0), dy=(K.d?1:0)-(K.u?1:0);
      if(dx&&dy){dx*=.7071;dy*=.7071}
      const acc=(dx||dy)?.38:.3;
      p.vx=(p.vx||0)+(dx*1.2-(p.vx||0))*acc; p.vy=(p.vy||0)+(dy*1.2-(p.vy||0))*acc;
      if(Math.abs(p.vx)<.04)p.vx=0; if(Math.abs(p.vy)<.04)p.vy=0;
      const sp=hyp(p.vx,p.vy); p.mov=sp>.2;
      if(dx||dy){ if(dx)p.d=dx>0?'r':'l'; else p.d=dy>0?'d':'u'; }
      if(p.mov){mv(p.vx,0);mv(0,p.vy);p.ft+=sp/1.1;p.f=Math.floor(p.ft/3.5)%8;p.dc=(p.dc||0)+1;if(p.dc%9===0&&S.scene!=='room')puff(p.x,p.y,1)} else p.f=1;
    }
    if(p.it>0)p.it--; if(p.ht>0)p.ht--; if(p.atkCd>0)p.atkCd--;

    for(let i=S.attacks.length-1; i>=0; i--){
      const a=S.attacks[i];
      a.x+=a.vx; a.y+=a.vy; a.l--;
      
      if(S.t % 2 === 0){
        parts.push({
          x: a.x + (Math.random() - 0.5) * 6,
          y: a.y + (Math.random() - 0.5) * 6,
          vy: -0.2, l: 15, c: '#fff3a8', tw: 0
        });
      }

      if(a.l<=0){ S.attacks.splice(i,1); continue; }

      if(S.scene==='forest'){
        for(let j=S.duvs.length-1; j>=0; j--){
          const d=S.duvs[j];
          if(hyp(a.x-d.x, a.y-d.y)<a.r+12){
            d.hp--; d.hit=10; d.kvx=a.vx*2.4; d.kvy=a.vy*2.4; d.pz=30; S.shake=Math.max(S.shake||0,1.8); sfx('hit');
            
            for(let pCount = 0; pCount < 8; pCount++){
              parts.push({
                x: d.x, y: d.y - 5,
                vy: (Math.random() - 0.5) * 1.5,
                l: 20, c: '#8fffa0', tw: 1
              });
            }

            if(d.hp<=0){
              pops.push({t:'Pensamento positivo venceu!',x:d.x-30,y:d.y-12,l:75,c:'#8fffa0'});
              burst(d.x,d.y-6,'#8fffa0',16,0);burst(d.x,d.y,'#2a1a3a',10,0);S.duvs.splice(j,1);
            } else {
              pops.push({t:a.text,x:d.x-20,y:d.y-10,l:50,c:'#ffe28a'});
            }
            S.attacks.splice(i,1); break;
          }
        }
        
        if(S.boss&&S.boss.active&&hyp(a.x-S.boss.x, a.y-S.boss.y)<a.r+16){
          S.boss.hp--; S.boss.hit=12; S.boss.kvx=a.vx*1.6; S.boss.kvy=a.vy*1.6; S.shake=Math.max(S.shake||0,2.4); sfx('hit');
          pops.push({t:a.text,x:S.boss.x-25,y:S.boss.y-18,l:55,c:'#ffe28a'});
          
          for(let pCount = 0; pCount < 10; pCount++){
            parts.push({
              x: S.boss.x, y: S.boss.y - 10,
              vy: (Math.random() - 0.5) * 2,
              l: 25, c: '#ffd24a', tw: 1
            });
          }

          if(S.boss.hp<=0){
            S.boss.active=false; S.flags.bossDefeated=1; burst(S.boss.x,S.boss.y,'#ffe28a'); S.flash=14; S.shake=6; S.zoom=1.08; sfx('win');
            pops.push({t:'O MEDO FOI SUPERADO!',x:S.boss.x-35,y:S.boss.y-25,l:100,c:'#8fffa0'});
            upd();
          }
          S.attacks.splice(i,1);
        }
      }
    }

    if(S.scene==='forest'){
      S.duvs.forEach(d=>{
        d.kvx=(d.kvx||0)*.82; d.kvy=(d.kvy||0)*.82; d.x=clamp(d.x+d.kvx,8,S.W-8); d.y=clamp(d.y+d.kvy,48,172);
        const ds=hyp(p.x-d.x, p.y-d.y)||1; d.cl=(d.cl||60)-1; d.pz=d.pz||0;
        if(d.cl<=0){d.cl=80+Math.random()*70;d.pz=24}
        d.atk=ds<34;
        if(d.pz>0)d.pz--; else if(ds<120){const k=d.sp*(.55+.45*Math.sin(S.t/13+d.x)); d.x+=(p.x-d.x)/ds*k; d.y+=(p.y-d.y)/ds*k}
        if(ds<14 && p.ht<=0){
          p.ht=40; chg(-10); beep(150,.2,.06,'sawtooth'); hurtFx();
          pops.push({t:'DÚVIDA TE ATINGIU!',x:p.x-20,y:p.y-20,l:50,c:'#ff4a6a'});
          push((p.x-d.x)/ds*16, (p.y-d.y)/ds*16);
        }
      });
      if(S.boss&&S.boss.active){
        const ds=hyp(p.x-S.boss.x, p.y-S.boss.y)||1;
        const B=S.boss; B.kvx=(B.kvx||0)*.85; B.kvy=(B.kvy||0)*.85; B.x=clamp(B.x+B.kvx,10,S.W-12); B.y=clamp(B.y+B.kvy,48,172);
        B.wu=B.wu||0; if(B.cd===undefined)B.cd=120;
        if(B.wu>0){B.wu--;if(B.wu===0){B.cd=170;B.ring=14;S.shake=5;sfx('slam');burst(B.x,B.y,'#7a1a4a',14,0);if(ds<38&&p.ht<=0&&p.dash<=0){p.ht=40;chg(-15);hurtFx();pops.push({t:'O MEDO TE ATINGIU!',x:p.x-20,y:p.y-20,l:50,c:'#ff4a6a'})}}}
        else{B.cd--;if(ds<140&&ds>16){const k=B.sp*(.8+.2*Math.sin(S.t/20));B.x+=(p.x-B.x)/ds*k;B.y+=(p.y-B.y)/ds*k} if(B.cd<=0&&ds<75)B.wu=38}
        if(ds<18 && p.ht<=0){
          p.ht=40; chg(-15); beep(150,.2,.06,'sawtooth'); hurtFx();
          pops.push({t:'O MEDO TE ATINGIU!',x:p.x-20,y:p.y-20,l:50,c:'#ff4a6a'});
          push((p.x-S.boss.x)/ds*20, (p.y-S.boss.y)/ds*20);
        }
      }
      if(p.x>466&&S.flags.bossDefeated){ go('city'); }
      else if(p.x>462&&!S.flags.bossDefeated&&S.t%120===0) pops.push({t:'Derrote o Medo para passar!',x:p.x-30,y:p.y-26,l:80,c:'#ffe28a'});
    }

    if(S.eq<=0){S.mode='gameover';sfx('lose')}
  }

  p.ax=(p.ax||0)+(((p.mov&&(p.d==='r'||p.d==='l'))?(p.d==='r'?22:-22):0)-(p.ax||0))*.05;S.shake=(S.shake||0)*.84;if(S.shake<.05)S.shake=0;S.zoom=1+((S.zoom||1)-1)*.93;if(S.hurtF>0)S.hurtF--;if(S.bp)S.bp*=.9;if(S.area&&S.area.l>0)S.area.l--;if(S.banner&&S.banner.l>0)S.banner.l--;S.eqd=S.eqd===undefined?S.eq:S.eqd;S.eqd+=(S.eq-S.eqd)*.14;if(Math.abs(S.eq-S.eqd)<.1)S.eqd=S.eq;S.eqt=S.eqt===undefined?S.eq:S.eqt;S.eqt=S.eqt>S.eqd?Math.max(S.eqd,S.eqt-.3):S.eqd;
  {const tg=clamp(p.x-160+p.ax,0,S.W-320);S.cam=(S.W<=320)?0:S.cam+(tg-S.cam)*.12;if(Math.abs(tg-S.cam)<.3)S.cam=tg} spawnAmb();
  parts.forEach(a=>{a.y+=a.vy;a.x+=a.vx||0;a.l--;if(a.tw)a.x+=Math.sin(S.t/20+a.y)*.2}); parts=parts.filter(a=>a.l>0);
  pops.forEach(a=>{a.y-=.3;a.l--}); pops=pops.filter(a=>a.l>0);
}

/* ===== SPRITES REMASTERIZADOS: contorno, sombreamento, cabelos, acessórios, animações ===== */
/* ===== COMPORTAMENTO DOS NPCs: parado / esperando / observando / caminhando / conversando ===== */
const NROUTE={n1:{x0:76,x1:112,y0:108,y1:118,sp:.32,wt:[50,130],walkP:.8},n2:{x0:212,x1:230,y0:106,y1:114,sp:.22,wt:[110,260],walkP:.35},n3:{x0:330,x1:352,y0:114,y1:126,sp:.28,wt:[70,170],walkP:.6}};
function npcBlocked(x,y){if(x<6||x>S.W-6||y<S.ymin+4||y>172)return 1;for(const s of S.solids)if(x+4>s[0]&&x-4<s[0]+s[2]&&y+1>s[1]&&y-3<s[1]+s[3])return 1;return 0}
function npcTick(){
 if(S.scene!=='city')return;const p=S.p;
 for(const o of S.objs){if(!o.npc)continue;const n=o.npc,R_=NROUTE[o.id];if(!R_)continue;
  if(!n.st){n.st='wait';n.tm=40+(o.id.charCodeAt(1)*37%60);n.d='d';n.ft=0;n.f=1;n.hx=n.x;n.hy=n.y;n.seen=!!S.expl[o.id];n.hop=0;n.rs=o.id.charCodeAt(1)*9973}
  const rnd=()=>(n.rs=n.rs*16807%2147483647)/2147483647;
  const dist=hyp(p.x-n.x,p.y-n.y),face=()=>{const dx=p.x-n.x,dy=p.y-n.y;return Math.abs(dx)>Math.abs(dy)*1.4?(dx>0?'r':'l'):(dy>0?'d':'u')};
  if(!!S.expl[o.id]!==n.seen){n.seen=!!S.expl[o.id];if(n.seen)n.hop=18}
  if(n.hop>0)n.hop--;
  if(S.mode==='dialog'){ // conversando: para e olha para o jogador
   if(dist<48){n.st='talk';n.d=face();n.f=1;if(dist<40){const dx=n.x-p.x,dy=n.y-p.y;p.d=Math.abs(dx)>Math.abs(dy)*1.4?(dx>0?'r':'l'):(dy>0?'d':'u')}}
   continue}
  if(S.mode!=='play'||S.fd)continue;
  if(n.st==='talk'){n.st='wait';n.tm=50}
  if(dist<34&&n.st==='walk'){n.st='wait';n.tm=40} // percebe o jogador
  if(n.st==='wait'||n.st==='look'){
   n.f=1;n.ft=0;
   if(dist<70)n.d=face();
   if(--n.tm<=0){
    if(rnd()<R_.walkP){const tx=R_.x0+rnd()*(R_.x1-R_.x0),ty=R_.y0+rnd()*(R_.y1-R_.y0);
     if(!npcBlocked(tx,ty)&&hyp(tx-p.x,ty-p.y)>22){n.tx=tx;n.ty=ty;n.ws=0;n.d=Math.abs(tx-n.x)>Math.abs(ty-n.y)?(tx>n.x?'r':'l'):(ty>n.y?'d':'u');n.st='turn';n.tm=9;continue}}
    if(rnd()<.5){n.st='look';n.d=['l','r','d','u'][rnd()*4|0];n.tm=60+rnd()*60|0}else{n.st='wait';n.tm=R_.wt[0]+rnd()*(R_.wt[1]-R_.wt[0])|0}}
  }else if(n.st==='turn'){if(--n.tm<=0)n.st='walk'}
  else if(n.st==='walk'){
   const dx=n.tx-n.x,dy=n.ty-n.y,dd=hyp(dx,dy);
   if(dd<1.2||++n.ws>420){n.st='wait';n.tm=R_.wt[0]+rnd()*(R_.wt[1]-R_.wt[0])|0;n.f=1;continue}
   const vx=dx/dd*R_.sp,vy=dy/dd*R_.sp,nx=n.x+vx,ny=n.y+vy;
   if(npcBlocked(nx,ny)||hyp(nx-p.x,ny-p.y)<16){n.st='wait';n.tm=50;continue}
   n.x=nx;n.y=ny;o.x=n.x-8;o.y=n.y-14;
   n.d=Math.abs(dx)>Math.abs(dy)*1.3?(dx>0?'r':'l'):(dy>0?'d':'u');
   n.ft+=R_.sp/1.1;n.f=Math.floor(n.ft/3.5)%8}
 }}

/* ===== SPRITES v2: ciclo de caminhada de 8 poses por direção, corpo maior e sombreado ===== */
const NSTY={n1:{hs:'long',ac:'scarf',sk:'#f6d6b8',pn:'#4a3a5a'},n2:{hs:'curly',ac:'glasses',sk:'#b9825a',pn:'#5a4632'},n3:{hs:'spiky',ac:'headband',hb:'#ffd86a',sk:'#e9b48c',pn:'#2a2a3a'}};
function person(x,y,d,f,st,t,pal0){
const pal=pal0||{},L=!pal0,hurt=st==='hurt'&&t%6<3,sad=st==='sad',talk=!!pal.npc&&S&&S.mode==='dialog'&&S.p&&hyp(S.p.x-x,S.p.y-y)<34;
const sk=pal.sk||'#f0c39a',hr=pal.hr||'#2a1d2e',sh=pal.sh||'#3a7bd5',pn=pal.pn||'#2d3250',pk=L?'#c9884a':pal.pk,hs=pal.hs||'short',ac=pal.ac;
const dk=c=>mixc(c,'#000000',.32),lt=c=>mixc(c,'#ffffff',.26),OUT='#17121f',H1=hurt?'#ff6a6a':null;
const B=[],D=[],P=(c,a,b,w,h)=>B.push([H1||c,a,b,w,h]),Q=(c,a,b,w,h)=>D.push([H1||c,a,b,w,h]);
const RR=(c,a,b,w,h)=>{P(c,a+1,b,w-2,h);P(c,a,b+1,w,h-2)};
const side=d==='l'||d==='r',sx=d==='r'?1:-1,walk=st==='walk',ph=walk?(f&7)/8*6.2832:0,s=Math.sin(ph),c=Math.cos(ph);
const by=walk?(Math.abs(c)>.9?-1:0):0,br=st==='idle'&&Math.sin(t/32)>.55?1:0;
const hy=by+(sad?1:br)+(talk&&Math.sin(t/4)>.4?-1:0),ay=by+(sad?1:br);
const up=st==='interact'||(talk&&Math.sin(t/9)>.2);
const hairTop=()=>{ // topo do cabelo por estilo
 if(hs==='curly'){RR(hr,-7,-30+hy,14,6);P(hr,-7,-26+hy,3,4);P(hr,4,-26+hy,3,4);Q(lt(hr),-4,-29+hy,2,1);Q(lt(hr),1,-30+hy,2,1)}
 else if(hs==='spiky'){RR(hr,-6,-29+hy,12,5);P(hr,-6,-33+hy,3,4);P(hr,-1,-34+hy,3,5);P(hr,3,-33+hy,3,4)}
 else RR(hr,-6,-30+hy,12,6)};
if(!side){
 const lL=Math.round(Math.max(0,s)*3),lR=Math.round(Math.max(0,-s)*3),aL=Math.round(-s*2),aR=-aL;
 P(dk(pn),-4,-10,4,8-lL);P(pn,0,-10,4,8-lR);P('#f2f0fa',-5,-3-lL,5,3);P('#f2f0fa',0,-3-lR,5,3);
 Q('#4a5ad0',-5,-1-lL,5,1);Q('#4a5ad0',0,-1-lR,5,1);Q(lt(pn),-3,-9,1,3);Q(lt(pn),1,-9,1,3);Q(dk(pn),-3,-6-lL/2|0,2,1);Q(dk(pn),1,-6-lR/2|0,2,1);
 if(pk)RR(dk(pk),-6,-16+ay,12,8);
 RR(sh,-5,-18+ay,10,10);
 if(up&&true){P(sh,5,-23,3,6);P(sk,5,-26,3,3)}else{P(sh,5,-17+aR+ay,3,6);P(sk,5,-11+aR+ay,3,3)}
 P(sh,-8,-17+aL+ay,3,6);P(sk,-8,-11+aL+ay,3,3);
 Q(dk(sh),4,-17+ay,1,9);Q(lt(sh),-4,-17+ay,1,6);Q(dk(sh),-5,-9+ay,10,1);Q(lt(sh),-8,-16+aL+ay,1,4);Q(dk(sh),-8,-12+aL+ay,3,1);Q(dk(sh),5,-12+aR+ay,3,1);
 if(d==='d'){Q(dk(sh),-3,-13+ay,6,1);Q(lt(sh),-3,-12+ay,6,1);Q(dk(sh),-3,-12+ay,1,3);Q(dk(sh),2,-12+ay,1,3);
  if(L){Q('#e8e8f0',-2,-17+ay,1,4);Q('#e8e8f0',1,-17+ay,1,4)}if(pk){Q(dk(pk),-4,-17+ay,1,6);Q(dk(pk),3,-17+ay,1,6)}}
 else if(pk){RR(pk,-6,-18+ay,12,10);Q(lt(pk),-5,-18+ay,10,2);Q(dk(pk),-4,-12+ay,8,4);Q('#e8c860',-1,-11+ay,2,1)}
 P(lt(sh),-4,-20+hy,8,3);Q(dk(sh),-4,-18+hy,8,1);
 if(hs==='long'&&d==='u')RR(hr,-6,-28+hy,12,17);
 RR(sk,-5,-27+hy,10,9);
 if(hs==='long'&&d==='d'){P(hr,-6,-26+hy,2,13);P(hr,4,-26+hy,2,13)}
 hairTop();
 if(d==='u'){RR(hr,-6,-29+hy,12,11);Q(lt(hr),-4,-28+hy,4,1);Q(dk(hr),-5,-20+hy,10,1);if(hs==='spiky'){P(hr,-6,-33+hy,3,4);P(hr,-1,-34+hy,3,5);P(hr,3,-33+hy,3,4)}}
 else{P(hr,-5,-26+hy,2,5);P(hr,3,-26+hy,2,5);Q(hr,-4,-26+hy,8,2);Q(hr,-4,-24+hy,3,1);Q(hr,1,-24+hy,1,1);Q(lt(hr),-3,-29+hy,3,1);
  Q('#17121f',-3,-23+hy,2,3);Q('#17121f',1,-23+hy,2,3);Q('#fff',-3,-23+hy,1,1);Q('#fff',1,-23+hy,1,1);
  Q('#e9967a',-4,-20+hy,1,1);Q('#e9967a',3,-20+hy,1,1);Q(dk(sk),0,-21+hy,1,1);Q(dk(sk),-5,-22+hy,1,2);Q(dk(sk),4,-22+hy,1,2);
  if(sad){Q('#7ab8ff',-3,-20+hy,1,2);Q(dk(sk),-1,-19+hy,2,1);Q(hr,-3,-25+hy,2,1);Q(hr,1,-24+hy,2,1)}else{Q('#a8604a',-1,-19+hy,2,1);Q('#c9806a',-1,-18+hy,0,0)}
  if(ac==='glasses'){Q('#3a3050',-4,-24+hy,4,1);Q('#3a3050',0,-24+hy,4,1);Q('#3a3050',-4,-21+hy,4,1);Q('#3a3050',0,-21+hy,4,1)}
  if(ac==='headband')Q(pal.hb||'#e05a5a',-5,-26+hy,10,1);
  if(ac==='scarf'){Q('#e8c860',-5,-19,10,3);Q('#c8a040',3,-16,3,6)}}
}else{
 const oA=Math.round(s*3.5)*sx,lA=Math.round(Math.max(0,c)*2),lB=Math.round(Math.max(0,-c)*2),aw=Math.round(-s*3)*sx;
 P(dk(pn),-2-oA,-10,4,8-lB);P('#c9c6d6',-2-oA+(sx>0?0:-2),-3-lB,6,3);Q('#4a5ad0',-2-oA+(sx>0?0:-2),-1-lB,6,1);
 if(!(up))P(dk(sh),-1-aw,-17+ay,3,6);
 if(pk){P(pk,sx>0?-8:4,-16+ay,4,9);Q(dk(pk),sx>0?-8:4,-10+ay,4,2)}
 P(pn,-2+oA,-10,4,8-lA);P('#f2f0fa',-2+oA+(sx>0?0:-2),-3-lA,6,3);Q('#4a5ad0',-2+oA+(sx>0?0:-2),-1-lA,6,1);Q(dk(pn),-1+oA,-6-lA/2|0,2,1);
 RR(sh,-4,-18+ay,8,10);Q(dk(sh),sx>0?-4:3,-17+ay,1,9);Q(dk(sh),-4,-9+ay,8,1);Q(lt(sh),sx>0?2:-3,-17+ay,1,5);Q(dk(sh),sx>0?1:-3,-13+ay,3,1);
 if(hs==='long')RR(hr,sx>0?-7:3,-27+hy,4,15);
 if(ac==='scarf')Q('#e8c860',-4,-19,8,3);
 if(up){P(sh,sx>0?3:-6,-22,3,6);P(sk,sx>0?3:-6,-25,3,3)}else{P(sh,-1+aw,-17+ay,3,6);P(sk,-1+aw,-11+ay,3,3);Q(dk(sh),-1+aw,-12+ay,3,1)}
 P(lt(sh),-3,-20+hy,6,3);
 RR(sk,-5,-27+hy,10,9);P(sk,sx>0?5:-6,-23+hy,1,2);
 hairTop();
 P(hr,sx>0?-6:1,-26+hy,5,8);
 Q(hr,sx>0?0:-5,-26+hy,5,2);Q(lt(hr),-3,-29+hy,3,1);Q(dk(sk),sx>0?-2:1,-22+hy,1,2);
 Q('#17121f',sx>0?2:-4,-23+hy,2,3);Q('#fff',sx>0?3:-4,-23+hy,1,1);Q('#e9967a',sx>0?0:-1,-20+hy,1,1);
 Q(sad?dk(sk):'#a8604a',sx>0?3:-4,-19+hy,2,1);if(sad)Q('#7ab8ff',sx>0?2:-3,-20+hy,1,2);
 if(ac==='glasses')Q('#3a3050',sx>0?1:-5,-24+hy,4,1);
 if(ac==='headband')Q(pal.hb||'#e05a5a',-5,-26+hy,10,1);
}
g.save();g.translate(Math.round(x),Math.round(y));
ell(0,1,8,2,'rgba(0,0,0,.30)');
g.fillStyle=OUT;for(const r of B)g.fillRect(r[1]-1,r[2]-1,r[3]+2,r[4]+2);
for(const r of B){g.fillStyle=r[0];g.fillRect(r[1],r[2],r[3],r[4])}
for(const r of D){g.fillStyle=r[0];g.fillRect(r[1],r[2],r[3],r[4])}
g.restore()}

/* ===== REMASTER VISUAL (somente renderização; a lógica do jogo é a mesma) ===== */
const R=(c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
const H=n=>{n=Math.sin(n*127.1+311.7)*43758.5453;return n-Math.floor(n)};
const lerp=(a,b,t)=>a+(b-a)*t;
const shd=(x,y,w,h,a)=>{g.fillStyle='rgba(0,0,0,'+(a||.3)+')';g.fillRect(Math.round(x-w/2),Math.round(y),w,h);g.fillRect(Math.round(x-w/2+2),Math.round(y+h),w-4,1)};
const ell=(cx,cy,rx,ry,c)=>{g.fillStyle=c;for(let d=-ry;d<=ry;d++){const w=Math.round(rx*Math.sqrt(1-d*d/(ry*ry)));g.fillRect(Math.round(cx-w),Math.round(cy+d),w*2,1)}};
const dia=(cx,cy,hw,hh,c)=>{g.fillStyle=c;for(let d=-hh;d<=hh;d++){const w=Math.round(hw*(1-Math.abs(d)/hh));g.fillRect(Math.round(cx-w),Math.round(cy+d),w*2+1,1)}};
const hx=h=>[1,3,5].map(i=>parseInt(h.substr(i,2),16));
const mixc=(a,b,t)=>{const A=hx(a),B=hx(b);return'rgb('+A.map((v,i)=>Math.round(lerp(v,B[i],t))).join()+')'};
const rgbOf=h=>hx(h).join();
function burst(x,y,c,n,fl){n=n||26;if(parts.length>180)n=Math.min(n,5);for(let i=0;i<n;i++){const a=i/n*6.283+H(i+y),sp=.5+H(i+x)*1.2;parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,l:26+(H(i)*20|0),c:i%3?c:'#fff',tw:0})}if(fl!==0)S.flash=8}

function duvida(x,y,t,boss,o){o=o||{};const k=boss?1.8:1,w=Math.sin(t/12)*1.5,hit=o.hit>0&&t%4<2;
shd(x,y+3,boss?36:20,boss?5:3,boss?.5:.38);
g.save();g.translate(Math.round(x),Math.round(y+Math.sin(t/16)*2));g.scale(k,k);
const c1=hit?'#fff':boss?'#2a0a1c':'#140a22',c2=hit?'#ffd0d0':boss?'#4a1236':'#26143c';
g.globalAlpha=.92;R(c1,-9,-18+w,18,16);R(c1,-11,-14+w,22,10);R(c1,-4,-21+w,8,4);
for(let i=0;i<4;i++)R(c1,-9+i*5,-2,4,3+Math.round(Math.sin(t/8+i*2)*2));
R(c2,-8,-17+w,6,2);R(c2,-10,-13+w,2,6);R(c2,5,-17+w,3,2);
if(boss){R(c1,-10,-24+w,3,5);R(c1,7,-24+w,3,5);R(c2,-9,-23+w,1,3)}
g.globalAlpha=1;R('#fff',-6,-14+w,4,4);R('#fff',2,-14+w,4,4);R('#ff4a6a',-4,-13+w,2,2);R('#ff4a6a',4,-13+w,2,2);
if(o.atk){R('#000',-4,-7+w,8,3);R('#fff',-3,-7+w,1,1);R('#fff',2,-7+w,1,1)}
g.restore()}
function glow(x,y,r,c,a=.25){const q=g.createRadialGradient(x,y,1,x,y,r);q.addColorStop(0,c.replace('ALPHA',a));q.addColorStop(1,c.replace('ALPHA',0));g.fillStyle=q;g.fillRect(x-r,y-r,r*2,r*2)}

/* ---------- QUARTO ---------- */
function drawRoom(){const t=S.t;
R('#3a2e58',0,0,320,58);for(let x=0;x<320;x+=10)R('rgba(255,255,255,.035)',x,0,5,40);
R('#2a2042',0,40,320,14);R('#5a4a80',0,40,320,1);for(let x=0;x<320;x+=20)R('rgba(0,0,0,.2)',x,41,1,13);
R('#1c1430',0,54,320,5);R('#4a3a70',0,54,320,1);
for(let y=59,i=0;y<180;y+=12,i++){R(i%2?'#4f3f6e':'#56467a',0,y,320,12);R('rgba(0,0,0,.2)',0,y,320,1);for(let x=(i%2)*28;x<320;x+=56)R('rgba(0,0,0,.15)',x,y,1,12)}
// tapete
R('rgba(0,0,0,.2)',94,160,136,3);R('#7a3b5a',92,112,136,48);R('#a85a74',92,112,136,2);R('#a85a74',92,158,136,2);R('#a85a74',92,112,2,48);R('#a85a74',226,112,2,48);
for(let i=0;i<8;i++){R('#5f2c48',104+i*16,124,8,24);R('#d08a94',107+i*16,132,2,8)}
// janela + cortinas
R('#d9c9a0',196,4,48,36);R('#0f1a4a',200,8,40,28);R('#16286a',200,8,40,10);R('#fff6c8',226,12,7,7);R('#0f1a4a',229,12,4,6);
[[206,14],[212,26],[236,28],[208,30],[218,12]].forEach((a,i)=>{if((t/20+i)%5>.5)R('#cfd8ff',a[0],a[1],1,1)});
R('#d9c9a0',219,8,2,28);R('#d9c9a0',200,21,40,2);R('#b8a880',196,38,48,3);
R('#8a3050',192,2,10,40);R('#a84068',194,2,2,40);R('#8a3050',238,2,10,40);R('#6a2040',244,2,2,40);R('#c0c0d0',190,0,60,3);
// posters / quadros / prateleira
R('#c4506a',80,6,24,30);R('#ffd24a',84,10,16,6);R('#222',84,20,16,12);R('#7a8ad0',86,22,12,3);R('#fff',90,26,4,4);R('rgba(255,255,255,.2)',80,6,2,30);
R('#4a9ae0',110,14,14,20);R('#e0e0ff',113,17,8,8);R('#2a4a8a',113,28,8,3);
R('#5a3e2a',40,18,34,3);R('#3a2a1a',40,21,34,1);['#c04a4a','#4a8ac0','#d8b040','#6aa860','#8a5ac0'].forEach((c,i)=>R(c,42+i*5,10+i%2,4,8-i%2));
R('#eee',146,10,14,12);R('#7a9ac0',148,12,10,8);R('#8aaa6a',148,17,10,3);
R('#222',100,48,4,5);R('#555',101,49,1,1);R('#555',101,51,1,1);R('#111',104,50,10,1);R('#111',113,50,1,8);
// cama
shd(42,86,66,4,.38);R('#4a3220',12,50,60,38);R('#d8d0f0',14,52,56,34);R('#6a5a8a',14,52,56,2);
R('#fff',16,54,18,10);R('#e4e0f4',16,62,18,2);R('#fff',16,54,18,1);
R('#3a4a9a',14,64,56,22);R('#2e3c82',14,76,56,10);R('#5a6ac0',14,64,56,2);
[[22,68,3,12],[34,70,2,14],[46,66,3,16],[58,70,2,12]].forEach(a=>{R('#2a3678',a[0],a[1],a[2],a[3]);R('#5a6ac0',a[0]+a[2],a[1],1,a[3]-2)});
R('#2a3678',14,84,56,2);R('#4a3220',12,86,60,4);R('#2e2018',12,88,60,2);
R('#9a8a60',46,56,10,7);R('#c8b880',47,57,8,2); // livro aberto
// criado-mudo + copo
R('rgba(0,0,0,.3)',76,76,16,3);R('#6a4228',76,62,14,14);R('#8a5a3a',76,62,14,2);R('#4a2e1a',77,68,12,1);R('#d8b060',82,71,2,2);R('#9ad0e8',80,56,5,6);R('#cdeaf6',81,57,1,4);
// mesa
shd(144,63,70,4,.35);R('#8a5a3a',112,44,64,18);R('#a67048',112,44,64,2);R('#6a4228',112,58,64,4);R('#4a2e1a',114,60,4,12);R('#4a2e1a',170,60,4,12);
// monitor
R('#1a1a1e',121,27,24,19);R('#2a2a30',121,27,24,1);const fl=.85+Math.sin(t/7)*.07;
R(mixc('#143040','#4af0d0',fl),123,29,20,13);R('rgba(255,255,255,.15)',124,30,8,3);R('#fff',125,33,10,1);R('#aaf',125,36,14,1);R('#7af',125,38,8,1);R('#444',130,46,6,2);R('#333',127,47,12,1);
// teclado / mouse / papéis / copo / livros
R('#2a2a34',125,49,17,4);for(let i=0;i<5;i++)R('#6a6a80',126+i*3,50,2,1);R('#2a2a34',146,50,3,4);
R('#eee',152,46,9,7);R('#aac',153,48,7,1);R('#aac',153,50,5,1);R('#ddd',150,48,8,6);
R('#a86a5a',166,40,8,3);R('#5a8aa8',167,37,7,3);R('#c8a850',166,34,8,3);
R('#caa',112,40,4,4);R('#fff',113,38,2,2);
// celular
const ph=(Math.sin(t/14)+1)/2;R('#111',158,47,7,9);R(mixc('#3a5a9a','#a8d0ff',ph),159,48,5,6);R('#fff',160,49,3,1);
// cadeira
R('rgba(0,0,0,.3)',126,78,22,3);R('#2a2a3a',128,60,18,12);R('#3a3a50',128,60,18,2);R('#2a2a3a',132,70,10,8);R('#555',134,76,2,5);R('#555',140,76,2,5);
// armário (porta de saída)
shd(282,82,46,4,.35);R('#5a3e2a',260,20,44,62);R('#7a5a3a',260,20,44,3);R('#6a4a30',262,24,18,56);R('#6a4a30',284,24,18,56);R('#46301f',281,24,2,56);R('#46301f',262,24,1,56);
R('#d4b060',277,50,2,5);R('#d4b060',285,50,2,5);R('#8a6a4a',264,26,14,1);R('#8a6a4a',286,26,14,1);R('#b04a4a',296,76,6,4);
// mochila, lixeira, roupas, tomada
shd(36,152,22,3,.35);R('#c0562a',29,138,16,14);R('#a04520',29,146,16,2);R('#7a3418',31,141,12,5);R('#e8c050',35,148,4,3);R('#222',32,136,10,3);
shd(310,86,12,2,.3);R('#444',306,74,10,11);R('#666',305,73,12,2);R('#aaa',308,70,4,3);
R('#6a8ac0',52,150,10,4);R('#c04a6a',58,148,8,3);R('#e8e8f0',48,152,6,3);
R('#ddd',252,52,4,6);R('#444',253,54,2,1);}

function roomFx(){const t=S.t;for(let i=0;i<20;i++){const x=(H(i)*320+t*.06*(.4+H(i+9)))%320,y=40+((H(i+3)*140-t*.03*(.3+H(i+5)))%140+140)%140,lit=x>190&&x<260&&y<130;g.fillStyle='rgba(255,255,255,'+(lit?.55:.18)*(.6+.4*Math.sin(t/25+i))+')';g.fillRect(Math.round(x),Math.round(y),1,1)}}
function roomLights(){const t=S.t;g.globalCompositeOperation='lighter';
g.fillStyle='rgba(120,150,255,.07)';g.beginPath();g.moveTo(200,40);g.lineTo(240,40);g.lineTo(272,132);g.lineTo(170,132);g.fill();
glow(220,30,60,'rgba(110,130,255,ALPHA)',.22);glow(133,40,56,'rgba(70,190,255,ALPHA)',.26+Math.sin(t/7)*.03);
glow(161,52,12+Math.sin(t/14)*4,'rgba(150,200,255,ALPHA)',.4);glow(82,52,18,'rgba(255,220,150,ALPHA)',.08);
if(S.flags.door)glow(282,50,44,'rgba(255,230,150,ALPHA)',.3+.1*Math.sin(t/10));g.globalCompositeOperation='source-over'}
function drawDoor(){const t=S.t;R('#ffe28a',266,26,32,52);R('#fff',268,28,28,48);R('rgba(255,226,138,.5)',270,30,24,46);R('#c9a0ff',288,52,3,3);
for(let i=0;i<5;i++){const y=76-((t*.5+i*11)%50);R('rgba(255,255,255,.8)',270+i*5,y,1,2)}}

/* ---------- FLORESTA ---------- */
let FD=null;
function fpal(m){return{sk:mixc('#06101a','#8fd0d8',m*.8),sk2:mixc('#0e2228','#d8ecb8',m*.7),gr:mixc('#123020','#4aa050',m),gr2:mixc('#0d2416','#3a8444',m),cA:mixc('#0b2416','#2e8a46',m),cB:mixc('#14402a','#5ab864',m),cC:mixc('#06180e','#1f6a34',m),tr:mixc('#2a1c14','#6a4630',m),pa:mixc('#241c14','#b89a68',m)}}
function tree(x,y,v,P,k,i){const s=Math.sin(S.t/30+i)*(.6+k*2),tw=k>.35?Math.sin(i*2)*k*4:0;shd(x+5,y-1,v===5?32:v===4?14:24,4,.3);
if(v===0){R(P.tr,x-3,y-14,6,15);R('rgba(0,0,0,.28)',x+1,y-14,2,15);ell(x+s,y-26,13,11,P.cC);ell(x+s-1,y-28,12,10,P.cA);ell(x+s-4,y-31,6,4,P.cB)}
else if(v===1){R(P.tr,x-2,y-8,4,9);for(let r=0;r<30;r++){const w=2+Math.round(r*.45);R(r%6<3?P.cA:P.cC,x-w+s*r/60,y-36+r,w*2,1)}R(P.cB,x-3+s/2,y-30,2,12)}
else if(v===2){R(P.tr,x-2,y-22,4,23);ell(x+s,y-34,7,13,P.cC);ell(x+s-1,y-36,6,12,P.cA);R(P.cB,x-4+s,y-42,2,8)}
else if(v===3){R('#1a120e',x-3,y-24,6,25);R('#1a120e',x-9+tw,y-24,6,2);R('#1a120e',x-10+tw,y-30,2,8);R('#1a120e',x+3,y-18,8,2);R('#1a120e',x+10-tw,y-26,2,10);R('#241812',x-5,y-34,2,10);R('#241812',x+2,y-36+tw/2,2,12);ell(x-9+tw,y-32,4,3,P.cC);ell(x+11-tw,y-28,3,3,P.cC)}
else if(v===4){R(P.tr,x-2,y-7,4,8);ell(x+s/2,y-12,8,7,P.cC);ell(x+s/2,y-14,7,6,P.cA);ell(x+s/2-2,y-16,3,2,P.cB)}
else if(v===5){R(P.tr,x-5,y-18,10,19);R(P.tr,x-9,y-3,5,4);R(P.tr,x+5,y-3,5,4);R('rgba(0,0,0,.28)',x+1,y-18,4,19);ell(x+s,y-30,17,13,P.cC);ell(x+s-3,y-33,13,10,P.cA);ell(x+s-7,y-37,6,4,P.cB);ell(x+s+9,y-27,7,5,P.cA);for(let j=0;j<4;j++)R(P.cC,x-12+j*8+s,y-20,1,6+j%3*3)}
else{R('#d8d4c8',x-2,y-22,4,23);R('#2a2a2a',x-2,y-18,2,1);R('#2a2a2a',x,y-10,2,1);R('#2a2a2a',x-2,y-5,2,1);ell(x+s,y-30,10,9,P.cA);ell(x+s-2,y-32,8,7,P.cB);ell(x+s-3,y-35,4,3,mixc('#5ab864','#c8f0a0',.4))}}
function forestDeco(){FD=[];for(let i=0;i<80;i++){const k=H(i*7+3);FD.push([k<.3?'g':k<.45?'r':k<.58?'b':k<.68?'m':k<.84?'f':k<.92?'l':'p',(10+H(i*3+1)*460)|0,(46+H(i*5+2)*128)|0,i])}}
function drawForest(){const t=S.t,hl=S.heal||0,dk=S.dk||0,m=clamp(.26+hl*.74-dk*.18,0,1),P=fpal(m);S.P=P;S.m=m;if(!FD)forestDeco();
const gr=g.createLinearGradient(0,0,0,70);gr.addColorStop(0,P.sk);gr.addColorStop(1,P.sk2);g.fillStyle=gr;g.fillRect(0,0,480,180);
R(P.gr2,0,38,480,142);R(P.gr,0,60,480,120);
const cx=S.cam||0;for(let i=0;i<16;i++){const x=i*34-(cx*.4)%34*0+cx*.4-((cx*.4)%34);const xx=i*34+cx*.4-((cx*.4)%34)-34+34*0;R(mixc('#06140c','#2a7a46',m*.7),xx,24+H(i)*8,6,24);ell(xx+3,28+H(i)*8,12,11,mixc('#06140c','#2a7a46',m*.7))}
for(let x=0;x<480;x+=4){const y=96+Math.sin(x/40)*8|0;R(P.pa,x,y,4,14);R('rgba(255,255,255,.07)',x,y,4,1);R('rgba(0,0,0,.2)',x,y+13,4,1)}
for(let i=0;i<60;i++)R(i%2?P.cB:P.gr2,(H(i+50)*480)|0,62+(H(i+60)*116|0),1,2);
FD.forEach(d=>{const[ty,x,y,i]=d,sw=Math.sin(t/25+i)*1;
if(ty==='g'){R(P.cA,x,y-3,1,3);R(P.cB,x+1,y-4+sw*.3,1,4);R(P.cA,x+2,y-2,1,2)}
else if(ty==='r'){shd(x+3,y,12,2,.3);ell(x+2,y-3,5,3,mixc('#2a2a34','#7a7a84',m));ell(x+1,y-4,3,2,mixc('#3a3a46','#9a9aa4',m))}
else if(ty==='b'){shd(x+4,y,16,2,.3);ell(x+4,y-4,7,5,P.cC);ell(x+4,y-5,5,4,P.cA);R(P.cB,x+2,y-7,3,1)}
else if(ty==='m'){R('#e8e0d0',x+1,y-3,1,3);ell(x+1,y-4,3,2,hl>.5?'#e8a050':'#c04a5a');R('#fff',x,y-5,1,1)}
else if(ty==='f'){const c=['#ffd24a','#ff8ad0','#ffffff','#8ac8ff'][i%4];R(P.cA,x,y-3,1,3);if(m>.55||i%3===0){R(c,x-1+sw,y-5,3,3);R('#fff3a0',x+sw,y-4,1,1)}}
else if(ty==='l'){shd(x+6,y,18,2,.3);R(mixc('#1a120e','#5a3a24',m),x,y-4,14,4);R('#c8a878',x+13,y-4,1,4)}
else{R(mixc('#0a1a2a','#5a9ac0',m),x,y-1,10,2);R('rgba(255,255,255,.3)',x+1+(t/20+i)%6,y-1,2,1)}});
for(let i=0;i<7;i++){const x=40+i*70,v=H(i*11)*20;R(mixc('#0a1a10','#2a7a40',m*.8),x,40,1,20+v);R(mixc('#0a1a10','#2a7a40',m*.8),x+Math.sin(t/30+i)*1,40+v/2,1,10)}
if(hl>.2)for(let i=0;i<30;i++){const x=(H(i+200)*470)|0,y=(70+H(i+210)*100)|0,c=['#ffd24a','#ff8ad0','#fff','#8ac8ff'][i%4];R(c,x,y,2,2)}
R(P.tr,220,45,14,10);R('#5a3a24',220,45,14,2);R('#ffe28a',226,49,2,3);shd(227,55,18,2,.3)}
function drawTrees(front){const P=S.P||fpal(.3),k=S.dk||0,py=S.p.y;(S.trees||[]).map((a,i)=>[a[0],a[1],i]).sort((a,b)=>a[1]-b[1]).forEach(([x,y,i])=>{if((y>py)===!!front)tree(x,y,(i*5+x)%7,P,k,i)})}
function drawFrag(o){const f=o.frag,t=S.t,cx=o.x+7,cy=o.y+7,n=clamp(1-hyp(S.p.x-cx,S.p.y-cy)/70,0,1),b=Math.sin(t/12)*2,id=f[0],c=f[4];shd(cx,cy+12,10-b,2,.3);
if(id==='coragem'){dia(cx,cy+b,5,8,c);dia(cx-1,cy-1+b,2,4,'#fff')}else if(id==='esperanca'){ell(cx,cy+b,6,6,c);R('#fff',cx-2,cy-2+b,3,3);for(let i=0;i<8;i++){const a=i*.785+t/40;R('#ffe28a',cx+Math.cos(a)*9,cy+b+Math.sin(a)*9,2,2)}}else{ell(cx,cy+b,5,6,c);ell(cx+2,cy-2+b,3,4,'#e0b0ff');R('#fff',cx-2,cy-3+b,2,2)}
for(let i=0;i<7;i++){const a=t/(18+i)+i*.9,r=9+n*3+i%3*2;let px=cx+Math.cos(a)*r,py=cy+Math.sin(a)*r*.7;if(id==='esperanca'){py=cy+10-((t*.45+i*9)%26);px=cx+Math.sin(t/20+i)*5}else if(id==='calma'){px=cx+Math.sin(t/32+i*1.3)*9;py=cy+Math.cos(t/26+i)*7+b}
px+=(S.p.x-px)*n*.22;py+=(S.p.y-12-py)*n*.22;R(i%2?'#fff':c,px,py,n>.4?2:1,n>.4?2:1)}}
function forestFx(){const t=S.t,m=S.m||.3,cx=S.cam||0;
for(let i=0;i<14;i++){const x=(H(i+1)*520+t*.18*(.5+H(i+4))+i*37)%520-20,y=(-10+(t*.35*(.6+H(i+9))+H(i+7)*200)%200);R(m>.5?'#9ad060':'#6a8a3a',cx+x,y,2,1);R('rgba(0,0,0,.2)',cx+x+1,y+1,1,1)}
const fa=.05+(1-(S.dk||0))*.05;g.fillStyle='rgba(200,230,220,'+fa*(1-(S.heal||0)*.7)+')';for(let i=0;i<3;i++){const x=((t*.1*(i+1)+i*160)%640)-80+cx;g.fillRect(x,50+i*38,160,16);g.fillRect(x+16,46+i*38,128,24)}}
function forestLights(){const t=S.t,hl=S.heal||0,m=S.m||.3;g.globalCompositeOperation='lighter';
g.fillStyle='rgba(255,240,170,'+(.03+hl*.07)+')';for(let i=0;i<4;i++){const x=40+i*130-(S.cam||0)*.1;g.beginPath();g.moveTo(x,0);g.lineTo(x+22,0);g.lineTo(x+70,150);g.lineTo(x+30,150);g.fill()}
for(let i=0;i<14;i++){const x=(H(i)*470+Math.sin(t/60+i)*14),y=50+H(i+3)*110+Math.cos(t/50+i*2)*8,a=.3+.3*Math.sin(t/12+i*3);R('rgba(255,240,120,'+a+')',x,y,2,2);glow(x+1,y+1,6,'rgba(255,240,120,ALPHA)',a*.4)}
S.objs.forEach(o=>{if(o.frag&&(!o.vis||o.vis())){const f=o.frag,n=clamp(1-hyp(S.p.x-o.x-7,S.p.y-o.y-7)/70,0,1);glow(o.x+7,o.y+7,18+n*22+Math.sin(t/9)*3,'rgba('+rgbOf(f[4])+',ALPHA)',.3+n*.4)}});
if(S.boss&&S.boss.active)glow(S.boss.x,S.boss.y-14,30,'rgba(255,60,100,ALPHA)',.18+Math.sin(t/8)*.05);
if(hl>.3)glow(S.cam+160,60,160,'rgba(255,240,180,ALPHA)',hl*.18);g.globalCompositeOperation='source-over'}

/* ---------- CIDADE ---------- */
function drawCity(){const t=S.t,br=S.flags.bridge;
const sk=g.createLinearGradient(0,0,0,70);sk.addColorStop(0,'#2a2e4a');sk.addColorStop(1,'#6a6e8c');g.fillStyle=sk;g.fillRect(0,0,480,180);
for(let i=0;i<10;i++){const x=i*50+6,h=14+H(i+40)*20;R('#3a3e5a',x,52-h,40,h+24)}
const pal=['#5a4a6a','#4a6a7a','#7a5a4a','#4a5a8a','#6a7a5a','#8a4a5a','#5a6a6a'],B=[];let x=-6;for(let i=0;x<480;i++){const w=34+(H(i+1)*20|0),h=34+(H(i+9)*36|0);B.push([x,w,h,i]);x+=w+2}
B.forEach(([x,w,h,i])=>{const c=pal[i%7],top=76-h;shd(x+w+3,top+4,4,h,.25);R(c,x,top,w,h);R('rgba(255,255,255,.1)',x,top,w,2);R('rgba(0,0,0,.25)',x+w-3,top,3,h);R('#2a2a3a',x-1,top-2,w+2,3);
if(i%3===0){R('#555',x+4,top-7,3,6);for(let j=0;j<3;j++)R('rgba(200,200,210,'+(.35-j*.1)+')',x+4+Math.sin(t/20+j)*2+j,top-9-j*5-((t/3+j*6)%8),3,3)}
for(let a=0;a<Math.floor((w-6)/10);a++)for(let b=0;b<Math.floor((h-24)/12);b++){const lit=H(i*13+a*5+b*3)>.5,fl=lit&&H(i+a+b)>.9&&t%120<60,on=lit&&!fl;R(on?'#ffd88a':'#1a1c2c',x+5+a*10,top+5+b*12,6,7);if(on)R('rgba(255,255,255,.35)',x+5+a*10,top+5+b*12,6,1);R('#222',x+7+a*10,top+5+b*12,1,7)}
const dx=x+(w>>1)-4,sh2=i%3===1;R(sh2?'#8ad0e0':'#3a2a2a',dx-(sh2?5:0),64,sh2?18:8,12);R(['#c04a4a','#4a9a6a','#d8a040'][i%3],x+2,60,w-4,4);R('rgba(0,0,0,.2)',x+2,64,w-4,1);
if(i%2===0){R('#222',x+4,top+h-20,w-8,5);R(['#ffd24a','#8affb0','#ff8ad0'][i%3],x+5,top+h-19,w-10,3)}});
R('#8a8ca6',0,76,480,12);R('#a8aac4',0,76,480,2);R('#6a6c86',0,86,480,2);
for(let x=0;x<480;x+=16)for(let y=90;y<150;y+=14)R((x/16+y/14)%2?'#5e6280':'#666a88',x,y,16,14);
R('#3a3d52',0,150,480,30);R('#8a8ca6',0,148,480,3);for(let x=0;x<480;x+=36)R('#d8d8a0',x,166,20,2);
for(let i=0;i<4;i++){const x=24+i*112,c=['#c04a4a','#4a7ac0','#d8c040','#5aa070'][i];shd(x+14,160,32,3,.35);R(c,x,152,28,9);R('rgba(255,255,255,.2)',x,152,28,2);R('#222',x+4,148,18,5);R('#8ac8e8',x+5,149,7,3);R('#8ac8e8',x+14,149,7,3);R('#111',x+3,159,5,3);R('#111',x+20,159,5,3);if(i%2)R('#ffe28a',x+26,155,2,2)}
[[40,92],[150,96],[260,92],[330,100]].forEach(([x,y],i)=>{R('#2a2a3a',x,y-22,2,24);R('#2a2a3a',x-3,y-24,8,2);R('#ffe9a0',x-2,y-23,6,2)});R('rgba(20,20,30,.5)',0,60,480,1);
for(let i=0;i<3;i++){const x=70+i*140,y=130;shd(x+10,y+16,22,3,.3);R('#5a3e2a',x,y+6,20,4);R('#4a2e1a',x+1,y+10,2,6);R('#4a2e1a',x+17,y+10,2,6);R('#8a5a3a',x,y,20,5)}
[[190,128],[300,132]].forEach(([x,y])=>{shd(x+4,y+10,12,2,.3);R('#3a6a4a',x,y,8,10);R('#5a8a6a',x,y,8,2);R('#2a4a34',x,y+3,8,1)});
[[130,100],[230,92],[430,92]].forEach(([x,y],i)=>{R('#6a6a7a',x,y-14,2,16);R(['#d8b040','#4a8ac0','#c04a4a'][i],x-4,y-18,10,6);R('#fff',x-2,y-16,6,1)});
for(let i=0;i<3;i++){const x=(t*.25*(i+1)+i*150)%480,y=100+i*14;person(x,y,'r',(t/4|0)%8,'walk',t,{hr:'#222',sh:['#555','#7a4a6a','#4a6a6a'][i]});R('rgba(0,0,0,.35)',x-30,y-24,60,0)}
R('#2a6a9a',396,76,40,104);R('#3a8ac0',396,76,40,5);for(let i=0;i<12;i++)R('rgba(255,255,255,.2)',398+(i*7+t/6)%34,84+i*8,6,1);R('#222c3a',392,76,4,104);R('#222c3a',436,76,4,104);
R('#6a4a2a',440,88,40,92);R('#3a8a4a',440,76,40,12);R('#4aa05a',440,76,40,3);
if(br){R('#a8743a',392,100,48,22);for(let i=0;i<12;i++)R(i%2?'#c8944a':'#b8844a',393+i*4,102,3,18);R('#5a3a1a',392,100,48,2);R('#5a3a1a',392,120,48,2);R('#6a4a2a',392,92,3,10);R('#6a4a2a',437,92,3,10);R('#8a5a2a',392,92,48,2);
for(let i=0;i<5;i++){R(['#ff8ad0','#ffd24a','#fff','#8ac8ff','#ff6a6a'][i],396+i*9,97+i%2,3,3);R('#3a8a3a',397+i*9,100,1,2)}for(let i=0;i<4;i++){const y=96+Math.sin(t/20+i)*1;R('#ffe28a',398+i*11,y-4,2,2)}}
else{R('#6a4a2a',392,102,12,18);R('#6a4a2a',430,102,10,18);R('#3a2a14',394,104,2,14);R('#8a6a3a',392,102,12,2);R('#8a6a3a',430,102,10,2);R('#8a5a2a',404,112+Math.sin(t/20),8,3);R('#6a4a2a',422,116+Math.sin(t/17),9,3);R('#5a3a1a',413,122,6,2);for(let i=0;i<3;i++)R('rgba(255,255,255,.4)',400+i*12+Math.sin(t/15+i)*2,121,4,1)}
S.objs.forEach(o=>{if(o.npc){const n=o.npc,sad=!S.expl[o.id],wk=n.st==='walk',hp=n.hop>0?-Math.abs(Math.sin(n.hop/18*Math.PI*2))*2.5:0,close=hyp(S.p.x-n.x,S.p.y-n.y)<=90,dir=n.st&&!close&&n.st!=='talk'?n.d:(n.st==='talk'||close?npcDir(n.x,n.y):'d');person(n.x,n.y+hp+0,n.st==='look'&&!close?n.d:(n.st==='walk'?n.d:dir),wk?n.f:1,wk?'walk':(sad?'sad':'idle'),S.t,Object.assign({hr:n.hr,sh:n.c,npc:1},NSTY[o.id]||{}))}})}
function cityLights(){const t=S.t;g.globalCompositeOperation='lighter';[[40,92],[150,96],[260,92],[330,100]].forEach(([x,y],i)=>glow(x+1,y-21,26,'rgba(255,220,140,ALPHA)',.22+Math.sin(t/30+i)*.02));
glow(250,50,90,'rgba(255,200,140,ALPHA)',.06);if(S.flags.bridge)glow(416,104,40,'rgba(255,226,138,ALPHA)',.3);g.globalCompositeOperation='source-over'}

/* ---------- JARDIM ---------- */
function drawGarden(){const t=S.t;
const sk=g.createLinearGradient(0,0,0,60);sk.addColorStop(0,'#9ad8f0');sk.addColorStop(1,'#d8f0c8');g.fillStyle=sk;g.fillRect(0,0,320,60);
R('#4aa85a',0,36,320,144);R('#62c470',0,52,320,128);for(let x=0;x<320;x+=6){const hh=6+H(x)*5|0;R('#3a8a4a',x,32-hh%4,6,6);ell(x+3,34,5,5,'#3a8a4a')}
for(let i=0;i<130;i++){const x=(H(i)*320)|0,y=(54+H(i+7)*124)|0,sw=Math.sin(t/25+i)>.6?1:0;R(i%3?'#4a9a56':'#7ad484',x+sw,y,1,3)}
for(let x=0;x<320;x+=4){const y=100+Math.sin(x/30)*3|0;R('#e8d29a',x,y,4,14);R('#f4e4b0',x,y,4,1);R('#c8b27a',x,y+13,4,1)}
for(let i=0;i<14;i++)R('#c8b27a',(H(i+100)*320)|0,101+(H(i+110)*12|0),2,1);
// lago
ell(160,86,36,18,'#4a7a60');ell(160,86,34,16,'#4aa8d0');ell(160,85,30,13,'#5ac0e0');
for(let i=0;i<5;i++)R('rgba(255,255,255,.3)',140+(i*13+t/5)%44,76+i*4,6,1);
R('rgba(40,110,60,.5)',130,74,6,12);R('rgba(40,110,60,.5)',136,70,5,16);R('rgba(255,210,200,.3)',172,80,4,9);
ell(150,92,3,2,'#3a9a4a');ell(172,90,3,2,'#3a9a4a');R('#ff9ad0',150,90,2,2);
[[126,92],[194,88],[166,102]].forEach(([x,y])=>{shd(x+2,y,10,2,.25);ell(x+2,y-2,5,3,'#8a8a96');ell(x,y-3,3,2,'#aaaab6')});
// banco (descansar)
shd(50,126,36,3,.3);R('#8a5a3a',34,112,32,5);R('#a67048',34,112,32,1);R('#6a4228',34,117,32,2);R('#4a2e1a',36,119,3,6);R('#4a2e1a',61,119,3,6);R('#8a5a3a',34,104,32,3);R('#4a2e1a',37,107,3,5);R('#4a2e1a',60,107,3,5);
// placa (caminhar)
R('#6a4228',58,66,3,18);R('#a67048',46,62,24,8);R('#c8a068',46,62,24,1);R('#3a2a1a',50,65,14,1);R('#3a2a1a',50,67,10,1);R('#a67048',66,64,6,4);
// toca-discos (música)
shd(252,116,20,2,.3);R('#5a3a2a',244,102,16,14);R('#7a5a3a',244,102,16,2);R('#111',246,104,12,8);ell(252,108,4,3,'#222');R('#c04a4a',251,107,2,2);
for(let i=0;i<3;i++){const y=96-((t*.4+i*8)%22);R('rgba(255,226,138,'+(1-((t*.4+i*8)%22)/22)+')',248+i*4+Math.sin(t/10+i)*2,y,2,2)}
// árvores e arbustos
[[20,60,0],[290,64,1],[110,56,0],[230,52,1],[304,148,0],[14,156,1]].forEach(([x,y,v],i)=>{shd(x+4,y,26,4,.25);R('#6a4630',x-3,y-14,6,15);R('rgba(0,0,0,.2)',x+1,y-14,2,15);const c1=v?'#2e8a46':'#3a9a4a';ell(x,y-26,13,11,'#2a7a3c');ell(x-1,y-28,12,10,c1);ell(x-4,y-31,6,4,'#6ad078');if(v)for(let j=0;j<5;j++)R(['#ff8ad0','#fff','#ffd24a'][j%3],x-9+j*4,y-30+j%3*3,2,2)});
// flores
for(let i=0;i<44;i++){const x=(H(i+300)*310+4)|0,y=(58+H(i+320)*118)|0;if(y>96&&y<116)continue;if(x>124&&x<198&&y>66&&y<106)continue;const sw=Math.sin(t/20+i)*1.2,k=i%5,c=['#ffd24a','#ff8ad0','#fff','#c08aff','#ff6a6a'][k];R('#2a8a3a',x,y-4,1,4);if(k===0){R(c,x-1+sw,y-7,3,3);R('#a06a00',x+sw,y-6,1,1)}else if(k===1){R(c,x-1+sw,y-6,3,1);R(c,x+sw,y-7,1,3);R('#fff',x+sw,y-6,1,1)}else if(k===2){R(c,x-1+sw,y-6,3,3);R('#ffd24a',x+sw,y-5,1,1)}else if(k===3){R(c,x+sw,y-8,1,2);R(c,x+sw,y-6,2,2);R(c,x-1+sw,y-4,1,1)}else{ell(x+sw,y-6,2,2,c);R('#ffd24a',x+sw,y-6,1,1)}}
// bichos
for(let i=0;i<5;i++){const a=t/(30+i*5)+i*2,x=60+i*50+Math.sin(a)*30,y=70+i*12+Math.cos(a*1.3)*14,fl=Math.sin(t/3+i)>0?3:1,c=['#ffd24a','#ff8ad0','#8ac8ff','#fff','#c08aff'][i];R(c,x-fl,y-1,fl,2);R(c,x+1,y-1,fl,2);R('#333',x,y-1,1,3)}
for(let i=0;i<2;i++){const x=((t*.7*(i+1)+i*140)%360)-20,y=24+i*10+Math.sin(t/12+i)*3;R('#333',x,y,3,1);R('#333',x-2,y-1+(t/5%2),2,1);R('#333',x+3,y-1+(t/5%2),2,1)}}
function gardenLights(){const t=S.t;g.globalCompositeOperation='lighter';glow(260,10,150,'rgba(255,240,180,ALPHA)',.22+Object.keys(S.expl).length*.04);
for(let i=0;i<4;i++)R('rgba(255,255,255,.6)',140+H(i+(t/25|0))*40,76+H(i+5+(t/25|0))*20,1,1);
for(let i=0;i<12;i++){const x=(H(i+500)*320+Math.sin(t/50+i)*10),y=50+H(i+520)*120+Math.cos(t/40+i)*6;R('rgba(255,255,200,'+(.3+.3*Math.sin(t/14+i))+')',x,y,1,1)}
g.globalCompositeOperation='source-over'}
function gardenFx(){const t=S.t;for(let i=0;i<9;i++){const x=((t*.5*(.5+H(i))+H(i+1)*380)%380)-30,y=(H(i+3)*140+Math.sin(t/20+i)*8+t*.1)%170;R(i%2?'#ffb8d8':'#8ad070',x,y,2,1)}}

/* ---------- ÁREA DA SOMBRA ---------- */
function drawShadow(){const t=S.t;
const gr=g.createLinearGradient(0,0,0,180);gr.addColorStop(0,'#05030c');gr.addColorStop(1,'#140a26');g.fillStyle=gr;g.fillRect(0,0,320,180);
for(let i=0;i<7;i++){const x=20+i*46+H(i)*10,h=40+H(i+3)*60,sk=(H(i+7)-.5)*14;g.fillStyle='rgba(30,16,56,.7)';g.beginPath();g.moveTo(x,130);g.lineTo(x+sk,130-h);g.lineTo(x+sk+10,130-h+6);g.lineTo(x+14,130);g.fill()}
for(let i=0;i<6;i++){const x=30+H(i+20)*260,y=20+H(i+30)*70,bl=(t+i*40)%200<8?1:5;if((t+i*37)%240<190){R('rgba(255,70,110,.9)',x,y,3,bl);R('rgba(255,70,110,.9)',x+7,y,3,bl)}}
R('#1a1030',0,128,320,52);R('#241640',0,128,320,2);
for(let i=0;i<10;i++){let x=H(i+50)*320,y=132+H(i+60)*44;g.strokeStyle='rgba(0,0,0,.65)';g.beginPath();g.moveTo(x,y);for(let j=0;j<4;j++){x+=(H(i*9+j)-.4)*18;y+=H(i*7+j+1)*8-2;g.lineTo(x,y)}g.stroke()}
for(let i=0;i<4;i++){const x=H(i+70)*300;R('rgba(255,255,255,.04)',x,132+i*10,30,1)}
// A Sombra
const sx=240,sy=146,f=Math.sin(t/20)*2;shd(sx,sy-2,44,6,.6);
g.fillStyle='#000';g.beginPath();g.moveTo(sx-16,sy);g.lineTo(sx-12,sy-30+f);g.lineTo(sx-6,sy-50+f);g.lineTo(sx,sy-56+f);g.lineTo(sx+6,sy-50+f);g.lineTo(sx+12,sy-30+f);g.lineTo(sx+16,sy);for(let i=0;i<5;i++)g.lineTo(sx+14-i*7,sy+4+(i%2)*4);g.fill();
R('#000',sx-24,sy-30+f,10,3);R('#000',sx+14,sy-30+f,10,3);R('#fff',sx-6,sy-46+f,4,3);R('#fff',sx+3,sy-46+f,4,3);R('#a070ff',sx-5,sy-45+f,2,2);R('#a070ff',sx+4,sy-45+f,2,2);
person(70,150,'r',1,S.eq<25?'sad':'idle',t)}
function shadowFx(){const t=S.t,tk=S.mode==='dialog';
for(let i=0;i<4;i++){const x=((t*.2*(i+1)+i*90)%400)-40;g.fillStyle='rgba(60,30,100,.12)';g.fillRect(x,100+i*20,120,14);g.fillRect(x+14,96+i*20,92,22)}
for(let i=0;i<18;i++){const x=H(i)*320,y=(180-((t*.3*(.4+H(i+4))+H(i+8)*200)%200));R('rgba(20,10,40,.8)',x+Math.sin(t/30+i)*6,y,2,2)}
if(tk)for(let i=0;i<3;i++){const r=((t*1.4+i*20)%60);g.strokeStyle='rgba(180,120,255,'+(.5-r/130)+')';g.beginPath();g.ellipse(240,128,r,r*.5,0,0,6.283);g.stroke()}}
function shadowLights(){const t=S.t,tk=S.mode==='dialog';g.globalCompositeOperation='lighter';glow(240,120,70+(tk?10*Math.sin(t/4):0),'rgba(150,90,255,ALPHA)',tk?.4:.25);glow(70,140,32,'rgba(150,130,255,ALPHA)',.1);g.globalCompositeOperation='source-over'}

function drawAttacks(){
  g.font='bold 8px monospace';g.textBaseline='middle';g.textAlign='center';
  S.attacks.forEach(a=>{
    g.save();g.translate(Math.round(a.x),Math.round(a.y));g.rotate(a.rot+Math.sin(S.t/4+a.x)*.05);{const q=(1+Math.sin(S.t/3)*.06)*Math.min(1,.5+(a.maxL-a.l)/6);g.scale(q,q)}
    const w=g.measureText(a.text).width+12,h=14;
    glow(0,0,18,'rgba(255, 230, 140, ALPHA)',0.3);
    g.fillStyle='#ffffff';g.beginPath();if(g.roundRect)g.roundRect(-w/2,-h/2,w,h,6);else g.rect(-w/2,-h/2,w,h);g.fill();
    g.strokeStyle='#9a8aff';g.lineWidth=1;g.stroke();
    g.fillStyle='#ffffff';g.beginPath();g.arc(-w/2+2,h/2+2,2,0,Math.PI*2);g.fill();g.beginPath();g.arc(-w/2-2,h/2+5,1.2,0,Math.PI*2);g.fill();
    g.fillStyle='#2b1b54';g.fillText(a.text,0,0);g.restore();
  });
  g.textAlign='start';
}

function spawnAmb(){
  const sc=S.scene;
  if(S.mode==='title'&&parts.length<40&&Math.random()<.2)parts.push({x:(S.cam||0)+Math.random()*320,y:10+Math.random()*160,vy:-.15,l:200,c:'#ffeea0',tw:1});
  if(S.mode==='play'&&S.eq<30&&parts.length<50&&Math.random()<.05)parts.push({x:S.cam+Math.random()*320,y:-4,vy:.25,l:260,c:'#3a2a5a',tw:1});
  if(S.mode==='play'&&S.eq>70&&parts.length<60&&Math.random()<.05)parts.push({x:S.cam+Math.random()*320,y:176,vy:-.2,l:240,c:'#fff3a8',tw:1});
  if(sc==='garden'&&parts.length<60&&Math.random()<.08)parts.push({x:Math.random()*320,y:-4,vy:.3,l:400,c:'#ffb8d8'});
}

function txt(s,x,y,c,sz){g.font='bold '+(sz||7)+'px Arial, Helvetica, sans-serif';g.textBaseline='top';g.fillStyle='#000';g.fillText(s,x+1,y+1);g.fillStyle=c||'#fff';g.fillText(s,x,y)}
function wrap(t,w){const o=[];let l='';for(const wd of t.split(' ')){const tt=l?l+' '+wd:wd;if(g.measureText(tt).width>w&&l){o.push(l);l=wd}else l=tt}o.push(l);return o}
function bar(x,y,w,v,c){g.fillStyle='#000';g.fillRect(x,y,w,5);g.fillStyle='#2a2a3a';g.fillRect(x+1,y+1,w-2,3);g.fillStyle=c;g.fillRect(x+1,y+1,Math.round((w-2)*v/100),3)}
function hud(){const e=S.eqd===undefined?S.eq:S.eqd,tr=S.eqt===undefined?e:S.eqt,bp=S.bp||0,low=S.eq<30,fw=Math.round(94*e/100),ox=bp<-3?Math.round(Math.sin(S.t)*1):0;
 R('rgba(0,0,0,.4)',5,5,152,44);R('#0c0a1e',3,3,152,44);R('#1a1536',4,4,150,42);g.strokeStyle=bp>2?'#8fffa0':bp<-2?'#ff6a6a':'#9a8aff';g.strokeRect(3.5,3.5,151,43);
 txt((S.name||'Lucas').toUpperCase(),8,6,'#ffe28a',8);
 [['coragem','#6ff3ff'],['esperanca','#ffb347'],['calma','#ff8ad0']].forEach((a,i)=>{const x=108+i*14,got=S.colls&&S.colls[a[0]];dia(x+5,11,3,5,got?a[1]:'#2a2448');if(got)R('#fff',x+4,8,1,2)});
 R('#000',8+ox,15,96,9);R('#241d44',9+ox,16,94,7);if(tr>e)R('#ffb0a0',9+ox,16,Math.round(94*tr/100),7);
 R(low?'#ff8a5a':'#6fe0a0',9+ox,16,fw,7);R('rgba(255,255,255,.35)',9+ox,16,fw,2);for(let i=1;i<4;i++)R('rgba(0,0,0,.35)',9+ox+i*23,16,1,7);
 if(Math.abs(bp)>3)R('rgba(255,255,255,'+Math.abs(bp)/40+')',9+ox,16,fw,7);
 txt('EQUILÍBRIO '+Math.round(S.eq)+'%',8,26,low?'#ffb09a':'#cfe',6);
 txt('▸ '+S.obj,8,35,'#ffe9a8',7)}

function dialogBox(cl){
  const ln=D.l[Math.min(D.i,D.l.length-1)],L=ln[1];
  D.a=cl?Math.max(0,(D.a||0)-.18):Math.min(1,(D.a||0)+.16);
  if(!cl)D.sh=Math.min(L.length,D.sh+.95);
  const ch=D.ch&&D.sh>=L.length&&!cl;
  g.font='9px monospace';const lines=wrap(L.slice(0,Math.floor(D.sh)),270),full=wrap(L,270);
  const h=Math.max(52,18+full.length*11+(D.ch?D.ch.length*11+4:0)),y=Math.round(Math.max(72,176-h)+(1-D.a)*14);
  g.save();g.globalAlpha=D.a;
  R('rgba(0,0,0,.45)',9,y+3,308,h);R('#0a0c22',6,y,308,h);R('#14183a',8,y+2,304,h-4);
  g.strokeStyle='#b8aaff';g.strokeRect(6.5,y+.5,307,h-1);g.strokeStyle='rgba(255,226,138,.3)';g.strokeRect(9.5,y+3.5,301,h-7);
  if(ln[0]){const nw=ln[0].length*6+14;R('#b8aaff',12,y-9,nw,13);R('#2b1b54',13,y-8,nw-2,11);txt(ln[0],18,y-6,'#ffe28a',8)}
  lines.forEach((q,i)=>txt(q,16,y+9+i*11,'#ffffff',9));
  if(!D.ch&&D.sh>=L.length&&!cl&&S.t%40<28)txt('▼',298,y+h-14+Math.round(Math.sin(S.t/6)),'#ffe28a',8);
  if(D.ch&&!cl){D.oy=y+9+full.length*11;if(ch)D.ch.forEach((o,i)=>{const sel=i===D.sel,xo=sel?2+Math.round(Math.sin(S.t/6)):0;
    if(sel){R('rgba(255,226,138,.16)',13,D.oy+i*11-1,294,11);R('#ffe28a',13,D.oy+i*11-1,2,11)}
    txt((sel?'▶ ':'  ')+(i+1)+'. '+o.t,17+xo,D.oy+i*11,sel?'#ffe28a':'#d8d8ea',9)})}
  g.restore();
}

function drawTitle(){
  // Fundo cósmico animado
  const gr = g.createLinearGradient(0, 0, 0, 180);
  gr.addColorStop(0, '#0a081c');
  gr.addColorStop(1, '#1d133b');
  g.fillStyle = gr;
  g.fillRect(0, 0, 320, 180);

  // Brilho do título
  glow(160, 40, 80, 'rgba(154,138,255,ALPHA)', 0.3);

  // Partículas cósmicas
  parts.forEach(p => { g.fillStyle = p.c; g.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); });

  // Título e Subtítulo
  txt('DENTRO DA MENTE', 55, 22, '#ffe28a', 18);
  txt('Uma jornada de autoconhecimento e apoio', 48, 44, '#c8beff', 8);

  // Moldura do Menu Principal
  const mx = 60, my = 75, mw = 200, mh = 92;
  g.fillStyle = 'rgba(12, 9, 28, 0.85)';
  if (g.roundRect) {
    g.beginPath(); g.roundRect(mx, my, mw, mh, 6); g.fill();
    g.strokeStyle = '#9a8aff'; g.lineWidth = 1.2; g.stroke();
  } else {
    g.fillRect(mx, my, mw, mh);
    g.strokeStyle = '#9a8aff'; g.strokeRect(mx, my, mw, mh);
  }

  // Opções do Menu Principal
  const opts = [
    '🎮  NOVO JOGO',
    '📂  CONTINUAR / CARREGAR',
    '❓  COMO JOGAR',
    '🔊  SOM: ' + (soundOn ? 'LIGADO' : 'DESLIGADO'),
    '📜  CRÉDITOS'
  ];

  const startY = my + 8;
  opts.forEach((o, i) => {
    const sel = i === titleSel;
    const itemY = startY + i * 16;

    if (sel) {
      g.fillStyle = 'rgba(255, 226, 138, 0.2)';
      if (g.roundRect) {
        g.beginPath(); g.roundRect(mx + 6, itemY - 1, mw - 12, 14, 4); g.fill();
      } else {
        g.fillRect(mx + 6, itemY - 1, mw - 12, 14);
      }
      g.strokeStyle = '#ffe28a'; g.lineWidth = 1;
      g.strokeRect(mx + 6, itemY - 1, mw - 12, 14);

      txt('►', mx + 10, itemY + 1, '#ffe28a', 8);
      txt(o, mx + 22, itemY + 1, '#ffe28a', 8);
    } else {
      txt(o, mx + 14, itemY + 1, '#c5beeb', 8);
    }
  });
}

function drawMenu(){
  g.fillStyle='rgba(4, 3, 14, 0.88)'; g.fillRect(0,0,320,180);
  
  const mx=50, my=10, mw=220, mh=160;
  g.fillStyle='rgba(0,0,0,0.5)'; g.fillRect(mx+4, my+4, mw, mh);
  
  const gr = g.createLinearGradient(mx, my, mx, my+mh);
  gr.addColorStop(0, '#1d173b');
  gr.addColorStop(1, '#0e0a21');
  g.fillStyle = gr;
  
  if(g.roundRect) {
    g.beginPath(); g.roundRect(mx, my, mw, mh, 8); g.fill();
    g.strokeStyle='#9a8aff'; g.lineWidth=1.5; g.stroke();
    g.strokeStyle='rgba(255,226,138,0.4)'; g.lineWidth=0.8;
    g.strokeRect(mx+2.5, my+2.5, mw-5, mh-5);
  } else {
    g.fillRect(mx, my, mw, mh);
    g.strokeStyle='#9a8aff'; g.strokeRect(mx, my, mw, mh);
  }

  txt('✦ MENU DE PAUSA ✦', mx+58, my+8, '#ffe28a', 9);

  g.fillStyle='rgba(10, 8, 25, 0.7)';
  g.fillRect(mx+10, my+23, mw-20, 20);
  g.strokeStyle='rgba(154, 138, 255, 0.3)';
  g.strokeRect(mx+10, my+23, mw-20, 20);
  
  txt((playerName || 'Lucas').toUpperCase(), mx+15, my+28, '#ffffff', 7);
  bar(mx+85, my+29, 65, S.eq, S.eq<30?'#ff8a5a':'#6fe0a0');
  txt(Math.round(S.eq)+'%', mx+155, my+28, '#ffe28a', 7);

  g.fillStyle='rgba(154, 138, 255, 0.3)';
  g.fillRect(mx+10, my+49, mw-20, 1);

  const opts = [
    '▶  CONTINUAR',
    '💾  SALVAR JOGO',
    '📂  CARREGAR JOGO',
    '🔊  SOM: ' + (soundOn ? 'LIGADO' : 'DESLIGADO'),
    '📜  CRÉDITOS',
    '🚪  SAIR AO INÍCIO'
  ];

  const startY = my + 54;
  opts.forEach((o, i) => {
    const sel = i === S.sel;
    const itemY = startY + i * 17;

    if (sel) {
      g.fillStyle = 'rgba(255, 226, 138, 0.18)';
      if(g.roundRect) {
        g.beginPath(); g.roundRect(mx+10, itemY, mw-20, 15, 4); g.fill();
      } else {
        g.fillRect(mx+10, itemY, mw-20, 15);
      }
      g.strokeStyle = '#ffe28a'; g.lineWidth = 1;
      g.strokeRect(mx+10, itemY, mw-20, 15);

      txt('►', mx+14, itemY+3, '#ffe28a', 8);
      txt(o.substring(3), mx+26, itemY+3, '#ffe28a', 8);
    } else {
      txt(o, mx+16, itemY+3, '#c5beeb', 8);
    }
  });
}

function drawCredits(){
  const stage=S.creditStage||0, page=S.creditPage||0, t=S.t;
  const gr=g.createLinearGradient(0,0,0,180);
  gr.addColorStop(0,'#070912');gr.addColorStop(.55,'#100b20');gr.addColorStop(1,'#1b1030');
  g.fillStyle=gr;g.fillRect(0,0,320,180);

  // Atmosfera dos créditos
  for(let i=0;i<34;i++){
    const x=(H(i+12)*320+Math.sin(t/55+i)*5+320)%320;
    const y=(H(i+31)*180+t*(.08+H(i)*.06))%180;
    const a=.25+.35*Math.sin(t/18+i)*.5;
    g.fillStyle='rgba(210,195,255,'+clamp(a,.08,.6)+')';
    g.fillRect(Math.round(x),Math.round(y),i%4===0?2:1,i%4===0?2:1);
  }
  glow(160,65,90,'rgba(154,138,255,ALPHA)',.16);
  glow(160,125,55,'rgba(255,226,138,ALPHA)',.08);

  const q=MOTIVATIONAL_QUOTES[(Math.floor(t/70)+page)%MOTIVATIONAL_QUOTES.length];
  txt(q,10+(t%360)-40,18,'rgba(255,226,138,.22)',7);

  if(stage===0){
    ctr('✦ CRÉDITOS ✦',20,'#ffe28a',13);
    ctr('DENTRO DA MENTE',37,'#ffffff',10);
    ctr('Uma jornada de autoconhecimento e apoio',50,'#bdb5e8',7);

    const pages=[
      [['CRIADO POR','#ffe28a',10],['Kauã Lima Santos','#ffffff',10],['Emanuel','#ffffff',10],['','#fff',5],['Uma jornada feita para transformar pensamentos','#c8beff',7],['em uma experiência de coragem e superação.','#c8beff',7]],
      [['DESENVOLVIMENTO','#ffe28a',10],['Programação  •  Design','#ffffff',9],['Mecânicas  •  Narrativa','#ffffff',9],['Arte e experiência visual','#ffffff',9],['','#fff',5],['CONCEITO','#ffe28a',10],['Pensamentos, sentimentos, equilíbrio','#c8beff',7],['e a importância de continuar tentando.','#c8beff',7]],
      [['AGRADECIMENTOS ESPECIAIS','#ffe28a',9],['A todos que ajudaram a criar, testar','#ffffff',8],['e melhorar esta jornada.','#ffffff',8],['','#fff',6],['Obrigado por chegar até aqui.','#ffe28a',9],['Cada escolha fez parte da sua história.','#c8beff',8]],
      [['FRASE FINAL','#ffe28a',10],['Você não precisa estar bem todos os dias.','#ffffff',8],['Só precisa continuar.','#ffe28a',11],['','#fff',7],['✦ FIM DA JORNADA ✦','#c8a8ff',10]]
    ];
    const data=pages[page%pages.length];
    let y=70;
    data.forEach(a=>{if(a[0])ctr(a[0],y,a[1],a[2]);y+=13});
    txt('PÁGINA '+(page%pages.length+1)+' / '+pages.length,12,169,'#766e9c',6);
    txt('W/S ou ↑↓  •  E/ENTER AVANÇA',118,169,'#8fffa0',6);
    if(t%70<48)txt(page===pages.length-1?'E  CONTINUAR':'E  PRÓXIMA PÁGINA',108,156,'#ffe28a',7);
  }else if(stage===1){
    ctr('✦ UMA MENSAGEM PARA VOCÊ ✦',28,'#ffe28a',9);
    ctr((playerName||'JOGADOR').toUpperCase(),48,'#ffffff',13);
    ctr('Você chegou até o fim desta jornada.',72,'#d8d2f5',8);
    ctr('Mas cada pessoa percorre um caminho diferente.',86,'#d8d2f5',8);
    ctr('Suas escolhas também fizeram parte desta história.',100,'#c8a8ff',8);
    ctr('Obrigado por jogar.',123,'#ffe28a',10);
    ctr('Que você continue dando um passo de cada vez.',140,'#ffffff',7);
    if(t%70<50)txt('PRESSIONE E PARA CONTINUAR',101,163,'#8fffa0',7);
  }else{
    const d=S.endId&&ENDINGS[S.endId]?ENDINGS[S.endId]:null;
    ctr('✦ SUA JORNADA TERMINOU ASSIM ✦',24,'#ffe28a',8);
    if(d){
      ctr(d.num,43,'#c8beff',7);
      ctr(d.title,59,d.bd,11);
      wrap(d.sub,250).forEach((x,i)=>ctr(x,80+i*11,'#e8e4ff',8));
      if(S.endId==='secreto'){
        ctr('MENSAGEM SECRETA',119,'#c8a8ff',8);
        ctr('Você também faz parte de mim.',134,'#ffffff',8);
      }else if(S.endId==='apoio'){
        ctr('Ser forte também é saber pedir ajuda.',127,'#ffcf9c',7);
      }else if(S.endId==='preso'){
        ctr('Uma frase quebrada ainda pode virar esperança.',127,'#c8a8ff',7);
      }else{
        ctr('Esta história não termina aqui.',127,'#ffe28a',7);
      }
    }else{
      ctr('Obrigado por conhecer',65,'#ffffff',9);
      ctr('DENTRO DA MENTE.',82,'#ffe28a',11);
      ctr('Sua jornada pode começar a qualquer momento.',105,'#c8a8ff',7);
    }
    ctr('Obrigado por jogar.',147,'#ffffff',8);
    if(t%70<50)txt('E  VOLTAR AO MENU',112,166,'#8fffa0',7);
  }
}

function drawGameOver(){g.fillStyle='#120508';g.fillRect(0,0,320,180);txt('SUA MENTE SE EXAUSTOU',55,50,'#ff6a6a',14);txt('Não se preocupe, recomeçar faz parte.',58,82,'#ffd8d8',8);txt('Pressione E ou toque na tela para tentar de novo.',35,120,'#ffe28a',7)}
/* ===== SISTEMA DE FINAIS ===== */
const NPALS={n1:Object.assign({hr:'#c9a35a',sh:'#8a5a8a'},NSTY.n1),n2:Object.assign({hr:'#3a2a1a',sh:'#4a9a7a'},NSTY.n2),n3:Object.assign({hr:'#222',sh:'#c9604a'},NSTY.n3)};
function fragNarr(){const c=S.colls||{},N=[['coragem','a Coragem'],['esperanca','a Esperança'],['calma','a Calma']],got=N.filter(a=>c[a[0]]).map(a=>a[1]),miss=N.filter(a=>!c[a[0]]).map(a=>a[1]);
 if(!got.length)return 'Nenhum dos três fragmentos tinha sido encontrado. Coragem, Esperança e Calma seguiam na floresta, esperando por {n}. Ainda não era tarde para procurá-los.';
 if(!miss.length)return 'Coragem, Esperança e Calma brilhavam juntas no peito de {n}: três partes que, unidas, formavam alguém inteiro.';
 return 'Em {n} brilhavam '+got.join(' e ')+'. '+(miss.length>1?'Ainda faltavam ':'Ainda faltava ')+miss.join(' e ')+': partes que {n} ainda ia descobrir, no seu tempo.'}
const ENDINGS={
 reencontro:{num:'FINAL 1',title:'REENCONTRO CONSIGO MESMO',bd:'#ffe28a',sub:'Eu não preciso vencer quem eu sou. Preciso aprender a me compreender.',beats:[
  [null,'A voz da Sombra ficou em silêncio. Não era um silêncio vazio. {n} respirou fundo e, pela primeira vez, não saiu correndo dele.'],
  ['{n}','Eu passei tanto tempo tentando te calar. Achei que, se eu te vencesse, finalmente ficaria bem.'],
  [null,'A floresta voltou primeiro. O medo ainda estava lá, entre as árvores, mas agora cabia no peito. Coragem nunca foi deixar de sentir.'],
  [null,'Depois, a cidade: pessoas que também carregavam coisas que não mostravam. A esperança chegou devagar, como luzes acendendo janela por janela.'],
  [null,'E o jardim, com sua calma de respiração sem pressa. Nada daquilo apagava o que doía. Só provava que a dor não era a única coisa ali.'],
  ['{n}','Eu não preciso vencer quem eu sou. Preciso aprender a me compreender.'],
  [null,'A Sombra não desapareceu. Ficou ao lado de {n}, menor, mais quieta. E pela primeira vez as duas sombras no chão apontavam para o mesmo lado.']]},
 apoio:{num:'FINAL 2',title:'APRENDER A PEDIR AJUDA',bd:'#ffb870',sub:'Ser forte também significa saber quando pedir ajuda.',beats:[
  [null,'A ponte rangeu sob os passos de {n}, mas aguentou. Do outro lado da rua, alguém acenava.'],
  ['HOMEM','Depois da nossa conversa, contei a verdade em casa. Pela primeira vez, eu não precisei dizer que estava tudo bem.'],
  ['GAROTO','Parei de me medir pela vida dos outros. Hoje mostrei um desenho meu pra um amigo. Ficou horrível. A gente riu muito.'],
  ['MULHER','Eu achava que pedir ajuda era admitir que eu tinha falhado. Acho que era só deixar a porta aberta.'],
  ['{n}','Eu vim ajudar vocês e acabei sendo ajudado. Sempre achei que ser forte era aguentar quieto. Ninguém aqui aguentou sozinho.'],
  ['@F'],
  [null,'A Sombra ainda sussurrava, em algum canto. Mas agora {n} sabia a quem procurar. Ser forte também significa saber quando pedir ajuda.']]},
 agridoce:{num:'FINAL 3',title:'ACEITAR QUE NEM TODO DIA É BOM',bd:'#ffb878',sub:'Talvez eu ainda tenha dias difíceis. E tudo bem.',beats:[
  [null,'Não houve explosão de luz. O dia só começou a clarear, do jeito que sempre começa: sem avisar, um pouquinho de cada vez.'],
  [null,'{n} caminhava devagar. Algumas coisas ainda pesavam. Estranhamente, isso já não parecia prova de que algo estava errado.'],
  ['@F'],
  [null,'A Sombra ficou para trás, pequena, no fim da rua. Não foi vencida. Só deixou de ser o único som dentro da cabeça de {n}.'],
  ['{n}','Talvez eu ainda tenha dias difíceis. E tudo bem. Amanhã pode ser ruim, ou não. Eu não preciso decidir isso hoje.'],
  [null,'Dia difícil não é o fim da história. É só um capítulo cinza. {n} continuou andando, sozinho, mas em movimento.']]},
 preso:{num:'FINAL 4',title:'PRESO NOS PRÓPRIOS PENSAMENTOS',bd:'#8a5ab0',sub:'Às vezes, quando acreditamos demais nos nossos pensamentos, eles parecem a única verdade.',beats:[
  [null,'As palavras ainda estavam ali: "Talvez seja inútil..." Soavam tão seguras que {n} nem pensou em discordar.'],
  [null,'O mundo continuava de pé: a floresta, a cidade, o jardim. Mas, vistos através daquela voz, tudo parecia um pouco mais cinza.'],
  ['@F'],
  ['A SOMBRA','Viu? Eu só digo o que você já pensa.'],
  [null,'É assim que acontece: um pensamento repetido tantas vezes começa a soar como fato. Ele não precisa ser verdade. Só precisa ser o único que se ouve.'],
  ['{n}','Acho que não consigo ouvir nada além de você agora.'],
  [null,'Mas, lá no fundo, uma frase ainda tremia: "EU CONSI..." Quebrada, mas ainda ali. Falar com alguém de confiança pode trazer outras vozes. Talvez amanhã.']]},
 passo:{num:'FINAL 5',title:'O PRIMEIRO PASSO',bd:'#ffe28a',sub:'Eu ainda não sei para onde estou indo. Mas desta vez, vou continuar andando.',beats:[
  [null,'{n} acordou no quarto. O mesmo quarto, o mesmo computador, as mesmas mensagens sem resposta.'],
  [null,'Mas, por dentro, alguma coisa tinha se movido um centímetro. Não bastava para resolver tudo. Bastava para tentar.'],
  ['@F'],
  ['{n}','Eu ainda não sei para onde estou indo.'],
  [null,'A porta do armário estava entreaberta, e uma linha de luz cortava o chão. {n} segurou a maçaneta por alguns segundos. Depois abriu.'],
  ['{n}','Mas desta vez, vou continuar andando.']]},
 secreto:{num:'FINAL SECRETO',title:'TODAS AS PARTES DE MIM',bd:'#c8a8ff',sub:'Você também faz parte de mim.',beats:[
  [null,'{n} olhou para a Sombra e, pela primeira vez, não viu um monstro. Viu quem tinha carregado o que {n} não conseguia carregar.'],
  ['{n}','Você também faz parte de mim.'],
  ['A SOMBRA','Então não precisa mais fugir.'],
  [null,'A Sombra se desfez em luz violeta, e três brilhos subiram dela: os fragmentos que {n} tinha reunido.'],
  ['CORAGEM','Ter medo e dar o passo mesmo assim.'],
  ['ESPERANÇA','Não saber como termina e, ainda assim, acreditar.'],
  ['CALMA','Respirar fundo no meio da tempestade.'],
  ['{n}','Coragem não é não sentir medo. Calma não é nunca ficar ansioso. Esperança não é achar que tudo será perfeito. Todas cabem em mim ao mesmo tempo.'],
  [null,'Floresta, cidade, jardim e noite se encontraram num só céu. Nada foi apagado. Tudo foi acolhido.']]}
};
function pickEnding(){const fr=Object.keys(S.colls).length,F=S.flags,help=(F.p1?1:0)+(F.p2?1:0)+(F.p3?1:0),sc=F.shadowChoice||2,eq=S.eq;
 F.helpedResidents=help;F.fragmentsComplete=fr===3?1:0;F.gardenComplete=(S.expl.mus&&S.expl.cam&&S.expl.des)?1:0;
 if(fr===3&&help===3&&sc===1&&eq>=90&&F.gardenComplete&&F.bossDefeated)return'secreto';
 if(fr===3&&help>=2&&sc===1&&eq>=75)return'reencontro';
 if(help>=2&&eq>=55&&sc!==3)return'apoio';
 if(sc===1&&fr<=1)return'passo';
 if(sc!==1&&(eq<40||(sc===3&&fr<2&&help<2)))return'preso';
 return'agridoce'}
function startEnding(id){const d=ENDINGS[id],nm=s=>s.split('{n}').join(playerName);
 const beats=d.beats.map(b=>b[0]==='@F'?[null,nm(fragNarr())]:[b[0]?nm(b[0]):null,nm(b[1])]);
 S.end={id,b:0,f:0,bf:0,sh:0,w:0,done:0,df:0,beats};S.endId=id;S.mode='end';
 if(id==='preso')tone(150,90,1.2,.04,'sine');else if(id==='agridoce')sfx('scene');else if(id==='passo')sfx('ok');else sfx(id==='apoio'?'collect':'win')}
function nextBeat(){const E=S.end;if(E.b<E.beats.length-1){E.b++;E.sh=0;E.w=0;E.bf=0;if(E.id==='preso')tone(190,150,.3,.025,'sine');else tone(660,660,.15,.02,'triangle')}else{E.done=1;E.df=0}}
function endStep(){const E=S.end;if(!E)return;if(E.done){E.df++;return}E.f++;E.bf++;const L=E.beats[E.b][1].length;if(E.sh<L)E.sh+=.75;else{E.w++;if(E.w>160)nextBeat()}}
function endPress(){const E=S.end;if(!E||(E.done&&E.df>30)){S.mode='credits';S.t=0;S.creditStage=0;S.creditPage=0;return}if(E.done)return;const L=E.beats[E.b][1].length;if(E.sh<L){E.sh=L;return}if(E.bf>25)nextBeat()}
/* --- visuais --- */
const EV={};
const eBg=(a,b)=>{const q=g.createLinearGradient(0,0,0,180);q.addColorStop(0,a);q.addColorStop(1,b);g.fillStyle=q;g.fillRect(0,0,320,180)};
const eMo=(n,c,t,up,sp)=>{for(let i=0;i<n;i++){const k=(H(i+9)*200+t*sp*(.4+H(i+3)))%200,y=up?190-k:k-10,x=(H(i)*320+Math.sin(t/40+i)*8+320)%320;R(c,x,y,2,2)}};
const big=(x,y,d,st,t,pal)=>{g.save();g.translate(x,y);g.scale(2,2);person(0,0,d,(t/4|0)%8,st,t,pal);g.restore()};
const lit=fn=>{g.globalCompositeOperation='lighter';fn();g.globalCompositeOperation='source-over'};
function shFig(x,y,k,fill,eye,t,a){const f=Math.sin(t/20)*2*k;g.save();g.globalAlpha=a==null?1:a;g.fillStyle=fill;g.beginPath();g.moveTo(x-16*k,y);g.lineTo(x-12*k,y-30*k+f);g.lineTo(x-6*k,y-50*k+f);g.lineTo(x,y-56*k+f);g.lineTo(x+6*k,y-50*k+f);g.lineTo(x+12*k,y-30*k+f);g.lineTo(x+16*k,y);for(let i=0;i<5;i++)g.lineTo(x+(14-i*7)*k,y+(4+(i%2)*4)*k);g.fill();R(eye,x-6*k,y-46*k+f,4*k,3*k);R(eye,x+3*k,y-46*k+f,4*k,3*k);g.restore()}
function eMem(x,y,w,h,kind,a){g.save();g.globalAlpha=a;R('#f4ecd8',x-2,y-2,w+4,h+4);g.beginPath();g.rect(x,y,w,h);g.clip();
 if(kind==='f'){R('#0e2a1e',x,y,w,h);R('#1c4a30',x,y+h*.6,w,h*.4);for(let i=0;i<4;i++){R('#3a2418',x+9+i*20,y+h*.5,3,12);ell(x+10+i*20,y+h*.45,8,10,'#0a3a22')}for(let i=0;i<5;i++)R('#ffee80',x+6+H(i)*w*.9,y+8+H(i+4)*h*.5,1,1)}
 else if(kind==='c'){R('#3a3e66',x,y,w,h);for(let i=0;i<5;i++){const bh=18+H(i+2)*24;R('#262a48',x+i*16,y+h-bh,13,bh);for(let j=0;j<3;j++)R(H(i*3+j)>.4?'#ffd88a':'#14162a',x+i*16+3,y+h-bh+4+j*8,3,4)}}
 else{R('#9ad8f0',x,y,w,h*.5);R('#62c470',x,y+h*.5,w,h*.5);ell(x+w*.7,y+h*.72,10,5,'#5ac0e0');for(let i=0;i<8;i++)R(['#ffd24a','#ff8ad0','#fff','#c08aff'][i%4],x+4+i*9,y+h*.58+H(i)*h*.2,3,3)}
 g.restore()}
EV.reencontro=(E,t)=>{const m=clamp(E.f/900,0,1);eBg(mixc('#241a48','#a8c8ff',m),mixc('#3a2a5a','#ffd8a8',m));R(mixc('#1c2a2a','#5a9a5a',m),0,86,320,94);
 lit(()=>{glow(160,40,140,'rgba(255,230,170,ALPHA)',.12+m*.2);for(let i=0;i<4;i++){g.fillStyle='rgba(255,240,190,'+(.03+m*.04)+')';g.beginPath();g.moveTo(130+i*20,0);g.lineTo(150+i*20,0);g.lineTo(60+i*70,110);g.lineTo(20+i*70,110);g.fill()}});
 eMo(18,'rgba(255,236,160,.8)',t,1,.3);
 [['f',20],['c',116],['g',212]].forEach((a,i)=>{if(E.b>=2+i)eMem(a[1],8,88,52,a[0],(E.b>2+i?1:Math.min(1,E.bf/40))*.95)});
 const sm=clamp((E.b-4)/2,0,1);shd(130,98,30,4,.3);shd(210,98,30,4,.3);
 shFig(210,98,.9,mixc('#0a0614','#7a5ac0',sm),mixc('#ff4a6a','#ffe8b0',sm),t,.9);lit(()=>glow(210,64,50,'rgba(255,220,160,ALPHA)',sm*.3));
 big(130,98,'r',E.b>=5?'idle':'sad',t)};
EV.apoio=(E,t)=>{eBg('#4a3468','#f0a878');R('#6a5a7a',0,90,320,90);
 for(let i=0;i<9;i++){const h=36+H(i+3)*30,x=i*38-6;R('#3a2c52',x,90-h,32,h);for(let j=0;j<Math.floor(h/10);j++)for(let k=0;k<2;k++)R(H(i*7+j+k)>.35?'#ffd88a':'#2a2040',x+6+k*14,90-h+5+j*10,6,6)}
 [40,280].forEach(x=>{R('#2a2a3a',x,56,2,36);R('#ffe9a0',x-2,54,6,3)});
 lit(()=>{glow(41,55,40,'rgba(255,220,140,ALPHA)',.3);glow(281,55,40,'rgba(255,220,140,ALPHA)',.3);glow(160,70,110,'rgba(255,200,150,ALPHA)',.08+Math.min(E.b,4)*.03)});
 const sp=E.b>=1&&E.b<=3?E.b-1:-1,P=[[60,'r'],[110,'r'],[230,'l']];
 ['n1','n2','n3'].forEach((id,i)=>{if(E.b>=i+1){big(P[i][0],98,P[i][1],'idle',t,NPALS[id]);if(sp===i)lit(()=>glow(P[i][0],66,18,'rgba(255,230,160,ALPHA)',.4))}});
 big(168,98,'d',E.b>=4?'idle':'sad',t);eMo(14,'rgba(255,210,230,.8)',t,1,.35)};
EV.agridoce=(E,t)=>{const m=clamp(E.f/1500,0,1);eBg(mixc('#10162e','#78b0e0',m),mixc('#2a1e3e','#ffb878',m));
 const sy=96-m*36;lit(()=>glow(230,sy,70,'rgba(255,200,130,ALPHA)',.3+m*.2));ell(230,sy,14,14,'#ffe4a8');
 for(let i=0;i<3;i++)ell(60+i*130,104,90,22+i*4,mixc('#14122a','#6a5a7a',m*.6));
 R(mixc('#16142a','#4a4458',m),0,100,320,80);R(mixc('#0e0c1a','#2e2a3c',m),0,104,320,16);for(let x=-20;x<340;x+=20)R('rgba(255,255,255,.12)',x+((-E.f*.2)%20),111,10,1);
 const px=30+Math.min(E.f*.12,210);R('rgba(0,0,0,.28)',px-40,104,34,2);shd(px,105,30,3,.35);
 g.save();g.translate(px,104);g.scale(2,2);person(0,0,'r',(E.f/3.5|0)%8,'walk',t);g.restore();eMo(8,'rgba(255,230,190,.5)',t,1,.12)};
EV.preso=(E,t)=>{eBg('#04020a','#150a1e');R('#0c0614',0,92,320,88);
 shFig(238,102,2.2,'#000','#ff4a6a',t,.95);lit(()=>glow(238,40,90,'rgba(120,40,160,ALPHA)',.12));
 for(let i=0;i<6;i++){const x=20+H(i+5)*280,y=14+H(i+8)*60;if((t+i*50)%260<200){const h=((t+i*30)%200<8)?1:4;R('rgba(255,70,110,.8)',x,y,3,h);R('rgba(255,70,110,.8)',x+7,y,3,h)}}
 eMo(22,'rgba(30,16,50,.9)',t,0,.5);big(90,102,'r','sad',t);
 for(let i=0;i<3;i++){const q=MOTIVATIONAL_QUOTES[(i*3+(E.f/200|0))%10];let s='';for(let c=0;c<q.length;c++)s+=(H(c*3+i+(E.f/10|0))>.6)?'_':q[c];if(H((E.f/7|0)+i*11)>.45)txt(s,14+i*98,22+i*16+Math.round(Math.sin(t/9+i)),'rgba(200,190,255,.55)',8)}
 if(E.b>=E.beats.length-1){const k=Math.min(1,E.bf/200);lit(()=>glow(308,100,10+k*22,'rgba(255,226,138,ALPHA)',.2+k*.4));R('#ffe28a',306,86,2,Math.round(8+22*k))}
 const v=g.createRadialGradient(160,90,50,160,90,200);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.6)');g.fillStyle=v;g.fillRect(0,0,320,180)};
EV.passo=(E,t)=>{drawRoom();const k=clamp((E.b-3)/2,0,1),open=E.b>=4;g.fillStyle='rgba(8,6,28,'+(.42-k*.32)+')';g.fillRect(0,0,320,180);
 if(open){drawDoor();lit(()=>{glow(282,50,70,'rgba(255,230,160,ALPHA)',.5);g.fillStyle='rgba(255,230,160,.12)';g.beginPath();g.moveTo(266,60);g.lineTo(300,60);g.lineTo(230,150);g.lineTo(60,150);g.fill()})}
 const w=E.b<4?0:clamp(((E.b-4)*400+E.bf)/700,0,1),px=lerp(150,282,w),py=lerp(108,80,w);
 person(px,py,w>0?'r':'d',(E.f/3.5|0)%8,(w>0&&w<1)?'walk':(E.b<3?'sad':'idle'),t);
 if(E.b>=5){g.fillStyle='rgba(255,246,214,'+clamp(E.bf/260,0,.92)+')';g.fillRect(0,0,320,180)}};
EV.secreto=(E,t)=>{const q=g.createLinearGradient(0,0,320,0);q.addColorStop(0,'#10382a');q.addColorStop(.35,'#2a3a6e');q.addColorStop(.7,'#6a3a74');q.addColorStop(1,'#1a1030');g.fillStyle=q;g.fillRect(0,0,320,180);
 g.fillStyle='rgba(255,236,190,'+clamp(E.b/6,0,1)*.15+')';g.fillRect(0,0,320,180);
 for(let i=0;i<3;i++){R('#0a2a1c',18+i*28,60,4,26);ell(20+i*28,56,13,12,'#0e3a26')}
 for(let i=0;i<4;i++){const h=30+H(i+1)*24;R('#1c2048',110+i*20,90-h,16,h);for(let j=0;j<3;j++)R('#ffd88a',114+i*20,90-h+4+j*9,3,4)}
 for(let i=0;i<10;i++)R(['#ffd24a','#ff8ad0','#fff','#c08aff'][i%4],200+i*10+Math.sin(t/20+i),84-H(i)*10,3,3);
 R('#241a3a',0,90,320,90);eMo(26,'rgba(255,240,200,.8)',t,1,.3);
 const tr=E.b>=3,last=E.b>=E.beats.length-2;
 shFig(215,98,.9,tr?'rgba(230,210,255,.85)':'#000',tr?'#fff8e0':'#a070ff',t,1);
 lit(()=>glow(215,60,60,tr?'rgba(255,230,200,ALPHA)':'rgba(150,90,255,ALPHA)',.25));big(125,98,'r','idle',t);
 if(tr)['#6ff3ff','#ffb347','#ff8ad0'].forEach((c,i)=>{const a=t/50+i*2.094,k=last?clamp(E.bf/200,0,1):0,fx=lerp(168+Math.cos(a)*34,125,k),fy=lerp(40+Math.sin(a)*14,66,k);lit(()=>glow(fx,fy,18,'rgba('+rgbOf(c)+',ALPHA)',.5));if(i===0)dia(fx,fy,3,6,c);else ell(fx,fy,i===1?5:4,i===1?5:6,c);R('#fff',fx-1,fy-2,2,2)})};
function ctr(s,y,c,sz){g.font='bold '+sz+'px Arial, Helvetica, sans-serif';const w=g.measureText(s).width;txt(s,Math.round(160-w/2),y,c,sz)}
function drawEnding(){const E=S.end,t=S.t;if(!E){g.fillStyle='#0b081a';g.fillRect(0,0,320,180);return}
 EV[E.id](E,t);const d=ENDINGS[E.id];
 if(!E.done){const bt=E.beats[E.b],who=bt[0],L=bt[1];g.font='9px monospace';const lines=wrap(L.slice(0,Math.floor(E.sh)),292);
  R('rgba(4,3,14,.86)',8,112,304,64);g.strokeStyle=d.bd;g.strokeRect(8.5,112.5,303,63);
  if(who){const nw=who.length*6+14;R(d.bd,14,103,nw,13);R('#14102a',15,104,nw-2,11);txt(who,20,106,'#ffe28a',8)}
  lines.forEach((s,i)=>txt(s,15,118+i*11,who?'#ffffff':'#d8dcff',9));
  if(E.sh>=L.length&&t%50<32)txt('E ▸',292,164,'#ffe28a',8)}
 else{const a=Math.min(1,E.df/40);g.fillStyle='rgba(0,0,0,'+a*.62+')';g.fillRect(0,0,320,180);g.globalAlpha=a;
  ctr(d.num,34,'#c8beff',8);ctr(d.title,48,d.bd,13);g.font='9px monospace';wrap(d.sub,250).forEach((s,i)=>ctr(s,84+i*12,'#e8e4ff',9));
  if(E.df>50&&t%60<40)ctr('Pressione E para ver os créditos',150,'#8fffa0',8);g.globalAlpha=1}
 if(E.f<45){g.fillStyle='rgba(0,0,0,'+(1-E.f/45)+')';g.fillRect(0,0,320,180)}}


function draw(){
  g.clearRect(0,0,320,180);
  const m=S.mode;
  if(m==='title'){ drawTitle(); return; }
  if(m==='credits'){ drawCredits(); return; }
  if(m==='gameover'){ drawGameOver(); return; }
  if(m==='end'){ drawEnding(); return; }
  const sc=S.scene,p=S.p,t=S.t;
  // atmosfera dinâmica da floresta (proximidade do Medo / cura)
  if(sc==='forest'){
    let dk=0;if(S.boss&&S.boss.active)dk=clamp(1-hyp(p.x-S.boss.x,p.y-S.boss.y)/200,0,1);
    S.dk=lerp(S.dk||0,dk,.05);
    S.heal=S.flags.bossDefeated?Math.min(1,(S.heal||0)+.006):0;
  }
  const cam=Math.round(S.cam),shx=S.shake>.2?(Math.random()-.5)*S.shake*2:0,shy=S.shake>.2?(Math.random()-.5)*S.shake*2:0,z=S.zoom||1;
  g.save();g.translate(160,90);g.scale(z,z);g.translate(-160,-90);g.translate(-cam+shx,shy);
  if(sc==='room'){ drawRoom(); if(S.flags.door) drawDoor(); roomFx(); }
  else if(sc==='forest'){ drawForest(); drawTrees(false); }
  else if(sc==='city') drawCity();
  else if(sc==='garden') drawGarden();
  else if(sc==='shadow') drawShadow();

  if(sc==='forest'){
    S.objs.forEach(o=>{if(o.frag&&(!o.vis||o.vis()))drawFrag(o)});
    S.duvs.forEach(d=>duvida(d.x,d.y,t,false,d));
    if(S.boss&&S.boss.active)duvida(S.boss.x,S.boss.y,t,true,{hit:S.boss.hit,atk:S.boss.wu>0||hyp(p.x-S.boss.x,p.y-S.boss.y)<30});
    if(S.boss&&S.boss.hit>0)S.boss.hit--;
    S.duvs.forEach(d=>{if(d.hit>0)d.hit--});
  }

  // personagem: sombra, rastro do dash, animações
  const st=p.ht>0?'hurt':(p.it>0||p.atkCd>100)?'interact':p.mov?'walk':S.eq<25?'sad':'idle';
  const bob=0;
  if(p.dash>0)for(let i=1;i<3;i++){g.globalAlpha=.25/i;person(p.x-p.dx*i*1.6,p.y-p.dy*i*1.6,p.d,p.f,'walk',t);g.globalAlpha=1}
  person(p.x,p.y+bob,p.d,p.f,st,t);
  if(sc==='forest')drawTrees(true);

  const nObj=near();S.pa=lerp(S.pa||0,(nObj&&S.mode==='play')?1:0,.25);
  if(nObj&&S.mode==='play'){S.pl=nObj.npc?'CONVERSAR':nObj.frag?'COLETAR':(nObj.door||nObj.bridge)?'ENTRAR':'INTERAGIR';S.px=nObj.x+nObj.w/2;S.py=nObj.y}
  if(S.pa>.02){g.save();g.translate(Math.round(S.px),Math.round(S.py-12+Math.sin(t/8)*2+(1-S.pa)*6));g.scale(S.pa,S.pa);g.globalAlpha=S.pa;
    g.font='bold 7px monospace';const w=Math.round(g.measureText('[E] '+S.pl).width+10);
    glow(0,0,w/2+6,'rgba(255,226,138,ALPHA)',.3);R('#120f28',-w/2-1,-8,w+2,15);R('#ffe28a',-w/2,-7,w,13);R('#fff3b0',-w/2,-7,w,2);
    g.fillStyle='#120f28';g.textAlign='center';g.textBaseline='middle';g.fillText('[E] '+S.pl,0,0);g.restore()}
  if(p.dash>0){g.fillStyle='rgba(220,240,255,.45)';for(let i=0;i<5;i++){const o=6+i*4,j=(i%2?-5:5)+(i*3%7)-3;if(p.dx)g.fillRect(Math.round(p.x-Math.sign(p.dx)*o-(p.dx>0?10:0)),Math.round(p.y-8+j),10,1);else g.fillRect(Math.round(p.x+j),Math.round(p.y-8-Math.sign(p.dy)*o-(p.dy>0?10:0)),1,10)}}
  const B=S.boss;
  if(sc==='forest'&&B&&B.active){
    if(B.wu>0){const k=1-B.wu/38;ell(B.x,B.y+4,38,19,'rgba(255,40,80,'+(.1+.22*k)+')');g.strokeStyle='rgba(255,130,150,.85)';g.beginPath();g.ellipse(B.x,B.y+4,38,19,0,0,6.283);g.stroke();txt('!',B.x-1,B.y-58,'#ff4a6a',10)}
    if(B.ring>0){B.ring--;g.strokeStyle='rgba(255,200,220,'+B.ring/14+')';g.beginPath();g.ellipse(B.x,B.y+4,38+(14-B.ring)*3,19+(14-B.ring)*1.5,0,0,6.283);g.stroke()}
    R('#000',B.x-17,B.y-51,34,6);R('#3a1030',B.x-16,B.y-50,32,4);R('#ff4a6a',B.x-16,B.y-50,Math.round(32*B.hp/B.maxHp),4);R('rgba(255,255,255,.4)',B.x-16,B.y-50,Math.round(32*B.hp/B.maxHp),1)}
  drawAttacks();
  if(sc==='forest')forestFx();else if(sc==='garden')gardenFx();else if(sc==='shadow')shadowFx();
  parts.forEach(q=>{g.fillStyle=q.c;g.fillRect(Math.round(q.x),Math.round(q.y),2,2)});
  g.restore();

  // iluminação: escurecimento por cena (espaço de tela)
  let dr=0,dc='8,6,28';
  if(sc==='room'){dr=.3}
  else if(sc==='forest'){dr=.32*(1-(S.heal||0))+(S.dk||0)*.4;dc='2,6,14'}
  else if(sc==='city'){dr=.2;dc='10,12,36'}
  else if(sc==='shadow'){dr=.25;dc='0,0,6'}
  if(dr>0){g.fillStyle='rgba('+dc+','+dr+')';g.fillRect(0,0,320,180)}
  // vinheta
  const vg=g.createRadialGradient(160,90,70,160,90,200);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,10,'+(sc==='shadow'?.7:sc==='garden'?.18:.4+(S.dk||0)*.3)+')');g.fillStyle=vg;g.fillRect(0,0,320,180);
  // luzes (aditivas, em coordenadas de mundo)
  g.save();g.translate(160,90);g.scale(z,z);g.translate(-160,-90);g.translate(-cam+shx,shy);
  if(sc==='room')roomLights();else if(sc==='forest')forestLights();else if(sc==='city')cityLights();else if(sc==='garden')gardenLights();else if(sc==='shadow')shadowLights();
  g.globalCompositeOperation='lighter';glow(p.x,p.y-10,sc==='shadow'?34:26,'rgba(255,230,170,ALPHA)',sc==='shadow'?.2:.1);g.globalCompositeOperation='source-over';
  pops.forEach(q=>txt(q.t,q.x,q.y,q.c,8));
  g.restore();

  {const lo=clamp((45-S.eq)/45,0,1),hi=clamp((S.eq-65)/35,0,1);
  if(lo>0){g.fillStyle='rgba(6,4,20,'+lo*.14+')';g.fillRect(0,0,320,180)}
  if(hi>0){g.fillStyle='rgba(255,230,160,'+hi*.05+')';g.fillRect(0,0,320,180)}
  if(S.hurtF>0){const hv=g.createRadialGradient(160,90,60,160,90,190);hv.addColorStop(0,'rgba(255,0,40,0)');hv.addColorStop(1,'rgba(255,20,50,'+S.hurtF/28+')');g.fillStyle=hv;g.fillRect(0,0,320,180)}}
  hud();
  g.save();g.textAlign='center';
  if(S.area&&S.area.l>0&&m!=='menu'){const l=S.area.l;g.globalAlpha=Math.min(1,l/30,(150-l)/20);R('rgba(0,0,0,.4)',170,4,140,16);txt(S.area.t,240,9,'#ffe28a',8)}
  if(S.banner&&S.banner.l>0){const l=S.banner.l,v=S.banner.v;g.globalAlpha=Math.min(1,l/15,(70-l)/6);const y=44+Math.min(0,(l-60))*0;R('#000',96,y-1,128,v?30:20);R('#14183a',97,y,126,v?28:18);g.strokeStyle='#b8aaff';g.strokeRect(97.5,y+.5,125,v?27:17);txt('ESCOLHA FEITA',160,y+4,'#fff',8);if(v)txt((v>0?'+':'')+v+' EQUILÍBRIO',160,y+16,v>0?'#8fffa0':'#ff8a8a',8)}
  g.restore();
  if(S.flash>0){g.fillStyle='rgba(255,255,255,'+S.flash/16+')';g.fillRect(0,0,320,180);S.flash--}
  if(m==='dialog'&&D)dialogBox();else if(D&&D.a>0&&D.l&&m!=='menu')dialogBox(true);
  if(m==='menu')drawMenu();
  if(S.fade>0){
    const FC={room:'0,0,0',forest:'255,244,200',city:'40,50,80',garden:'245,255,235',shadow:'0,0,0'};
    g.fillStyle='rgba('+(FC[S.fto]||'7,9,18')+','+S.fade+')';g.fillRect(0,0,320,180);
  }
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

init();
requestAnimationFrame(loop);
