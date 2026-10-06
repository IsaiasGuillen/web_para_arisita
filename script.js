'use strict';
const $ = id => document.getElementById(id);
const screens = ['welcome','game','letter','complete'];
const messages = ['El primero ya te está esperando.','Vas bien 👀','Todavía faltan algunos…','Ya casi descubres por qué hice esto','Solo falta uno 🤍','Mensaje desbloqueado'];
let state = 'welcome', count = 0, locked = false, transitionTimer;
const audio = $('audio');
let musicReady = false, musicFailed = false;
audio.volume = 0.45;
function show(next) {
  state = next;
  document.body.dataset.state = next;
  screens.forEach(id => $(id).hidden = id !== next);
  window.scrollTo({top:0,behavior:'instant'});
  const heading = $(next).querySelector('h1,h2');
  heading.tabIndex = -1;
  heading.focus({preventScroll:true});
}
// Use measured dimensions so the entire touch target stays inside the arena.
function placeHeart() {
  if (state !== 'game' || locked) return;
  const area = $('arena'), heart = $('heart');
  const padding = 14;
  const maxX = Math.max(0, area.clientWidth - heart.offsetWidth - padding * 2);
  const maxY = Math.max(0, area.clientHeight - heart.offsetHeight - padding * 2 - 24);
  heart.style.left = `${padding + Math.random() * maxX}px`;
  heart.style.top = `${padding + Math.random() * maxY}px`;
  heart.setAttribute('aria-label', `Atrapar corazón ${count + 1} de 5`);
  heart.getAnimations().forEach(animation => animation.cancel());
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) heart.animate([{transform:'scale(.7)',opacity:0},{transform:'scale(1)',opacity:1}],{duration:250});
}
function burst(x,y,total=10) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i=0;i<total;i++) {
    const p = document.createElement('span');
    p.className = 'particle'; p.textContent = i%3 ? '·' : '♡'; p.setAttribute('aria-hidden','true');
    p.style.left = `${x}px`; p.style.top = `${y}px`;
    const angle = Math.random()*Math.PI*2, distance=35+Math.random()*100;
    p.style.setProperty('--dx',`${Math.cos(angle)*distance}px`);
    p.style.setProperty('--dy',`${Math.sin(angle)*distance}px`);
    document.body.append(p);
    p.addEventListener('animationend',()=>p.remove(),{once:true});
  }
}
function updateCount(){ $('counter').textContent=`Corazones encontrados: ${count} / 5`; $('steps').textContent=Array.from({length:5},(_,i)=>i<count?'♥':'♡').join(' '); $('hint').textContent=messages[count]; }
$('start').addEventListener('click',()=>{
  count=0; locked=false; updateCount(); $('gather').hidden=true; $('heart').hidden=false;
  show('game'); placeHeart();
});
$('heart').addEventListener('click',()=>{
  if(state!=='game'||locked)return;
  const rect=$('heart').getBoundingClientRect(); burst(rect.left+rect.width/2,rect.top+rect.height/2);
  count++; updateCount();
  if(count===5){
    locked=true; $('heart').hidden=true; $('gather').hidden=false;
    transitionTimer=setTimeout(()=>show('letter'),1000);
  }else placeHeart();
});
$('accept').addEventListener('click',()=>{if(state!=='letter')return;show('complete');burst(innerWidth/2,innerHeight/3,30);});
$('restart').addEventListener('click',()=>{
  clearTimeout(transitionTimer); count=0; locked=false;
  document.querySelectorAll('.particle').forEach(p=>p.remove());
  $('gather').hidden=true; $('heart').hidden=false; updateCount();show('welcome');
});
new ResizeObserver(()=>placeHeart()).observe($('arena'));
function updatePlayer(){ $('play').textContent=audio.paused?'▶':'Ⅱ';$('play').setAttribute('aria-label',audio.paused?'Reproducir música':'Pausar música'); }
function failMusic(){ musicFailed=true; $('music-label').textContent='Sin canción todavía'; $('play').disabled=true; $('seek').disabled=true; updatePlayer(); }
async function playMusic(){
  if(musicFailed)return;
  if(!musicReady){audio.src='assets/music/song.mp3';musicReady=true;}
  try{await audio.play();$('music-label').textContent='Un poco de música';}catch(error){if(error.name==='NotSupportedError')failMusic();else $('music-label').textContent='Toca ▶ para escuchar';}
  updatePlayer();
}
$('play').addEventListener('click',()=>audio.paused?playMusic():audio.pause());
$('volume').addEventListener('input',e=>audio.volume=Number(e.target.value));
$('seek').addEventListener('input',e=>{if(Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=audio.duration*Number(e.target.value)/100;});
audio.addEventListener('loadedmetadata',()=>{$('seek').disabled=!Number.isFinite(audio.duration);});
audio.addEventListener('timeupdate',()=>{if(Number.isFinite(audio.duration)&&audio.duration>0)$('seek').value=audio.currentTime/audio.duration*100;});
audio.addEventListener('error',failMusic);
['play','pause','ended'].forEach(event=>audio.addEventListener(event,updatePlayer));

document.getElementById("youtube-player").addEventListener("toggle",()=>{const panel=document.getElementById("youtube-player"),video=document.getElementById("song-video");if(panel.open&&!video.getAttribute("src"))video.src="https://www.youtube-nocookie.com/embed/lPeJMoms_Ag?autoplay=1&playsinline=1";});


