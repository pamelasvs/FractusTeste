// FRACTUS — jogo de plataforma 2D em Canvas, sem bibliotecas externas.
// CONTROLES: setas ou A/D para mover; Espaço, W ou seta para cima para pular.
// ESPAÇO DAS SPRITES: veja os comentários no final deste arquivo.

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;
const $ = (id) => document.getElementById(id);

let keys = {};
let running = false, pausedForQuestion = false, finished = false;
let cameraX = 0, score = 0, coins = 0, lives = 3, challengeCount = 0;
let soundOn = true;
const worldWidth = 2600;
const gravity = 0.58;

const SPRITE_CONFIG = {
  src: "assets/sprites/personagens/adventurer.png",
  frameWidth: 96,
  frameHeight: 96,
  frameRow: 0,
  frames: 5,
  frameSpeed: 8,
  drawWidth: 54,
  drawHeight: 58
};
const playerSprite = new Image();
let spriteLoaded = false;
playerSprite.onload = () => { spriteLoaded = true; };
playerSprite.onerror = () => { spriteLoaded = false; };
playerSprite.src = SPRITE_CONFIG.src;
let spriteTick = 0;

const mummySprite = new Image();
let mummySpriteLoaded = false;
mummySprite.onload = () => { mummySpriteLoaded = true; };
mummySprite.src = "assets/sprites/inimigos/mummy.png";

const player = { x: 70, y: 330, w: 34, h: 44, vx: 0, vy: 0, speed: 3.6, jump: -11.5, grounded: false, invincible: 0, facing: 1 };
const platforms = [
  {x:0,y:455,w:440,h:100},{x:490,y:420,w:210,h:135},{x:750,y:380,w:180,h:175},
  {x:980,y:435,w:230,h:120},{x:1260,y:390,w:190,h:165},{x:1510,y:440,w:250,h:115},
  {x:1810,y:395,w:190,h:160},{x:2050,y:445,w:550,h:110},
  {x:260,y:350,w:90,h:18},{x:570,y:310,w:100,h:18},{x:820,y:270,w:90,h:18},
  {x:1050,y:335,w:90,h:18},{x:1330,y:285,w:100,h:18},{x:1600,y:335,w:100,h:18},
  {x:1870,y:290,w:90,h:18},{x:2160,y:340,w:100,h:18}
];
const coinItems = [
  ...[180,220,260,300].map((x,i)=>({x,y:395-(i%2)*12,taken:false})),
  ...[575,615,655].map(x=>({x,y:265,taken:false})),
  ...[825,865,905].map(x=>({x,y:225,taken:false})),
  ...[1080,1120,1160].map(x=>({x,y:390,taken:false})),
  ...[1350,1390].map(x=>({x,y:240,taken:false})),
  ...[1630,1670,1710].map(x=>({x,y:300,taken:false})),
  ...[1885,1925].map(x=>({x,y:245,taken:false})),
  ...[2190,2230,2270].map(x=>({x,y:295,taken:false}))
];
const gates = [
  {x:680, opened:false, question:0}, {x:1445,opened:false,question:1}, {x:1995,opened:false,question:2}
];
const mummies = [
  { x: 315, y: 415, minX: 265, maxX: 390, direction: 1, defeated: false, tick: 0 },
  { x: 555, y: 380, minX: 505, maxX: 650, direction: 1, defeated: false, tick: 0 },
  { x: 845, y: 340, minX: 765, maxX: 885, direction: 1, defeated: false, tick: 0 },
  { x: 1085, y: 395, minX: 995, maxX: 1160, direction: 1, defeated: false, tick: 0 },
  { x: 1365, y: 350, minX: 1275, maxX: 1410, direction: 1, defeated: false, tick: 0 },
  { x: 1645, y: 400, minX: 1525, maxX: 1720, direction: 1, defeated: false, tick: 0 },
  { x: 1885, y: 355, minX: 1820, maxX: 1945, direction: 1, defeated: false, tick: 0 },
  { x: 2225, y: 405, minX: 2070, maxX: 2480, direction: 1, defeated: false, tick: 0 }
];
const questions = [
  {title:"Qual fração representa a parte colorida?",hint:"O artefato foi dividido em 4 partes iguais.",total:4,filled:1,options:["1/4","2/4","3/4","4/4"],answer:"1/4",explain:"Correto! Uma de quatro partes é 1/4."},
  {title:"Qual fração é equivalente a 1/2?",hint:"Pense em duas partes coloridas de quatro partes iguais.",total:4,filled:2,options:["1/4","2/4","3/4","4/4"],answer:"2/4",explain:"Isso! 1/2 e 2/4 representam a mesma quantidade."},
  {title:"Você tem 3/4 de um mapa e encontra mais 1/4. Quanto tem?",hint:"Os denominadores são iguais: some os numeradores.",total:4,filled:4,options:["2/4","3/4","4/4","4/8"],answer:"4/4",explain:"Muito bem! 3/4 + 1/4 = 4/4, ou um inteiro."}
];

function roundedRect(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function drawBackground(){
  const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,"#73d8f5");grad.addColorStop(1,"#c8f4e5");ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  // Sol e nuvens em parallax
  ctx.fillStyle="#ffe16b";ctx.beginPath();ctx.arc(800-cameraX*.08,85,39,0,Math.PI*2);ctx.fill();
  for(let i=0;i<7;i++){let x=((i*190-cameraX*.18)%(W+160)+W+160)%(W+160)-60;drawCloud(x,65+(i%3)*45);}
  // Montanhas distantes
  ctx.fillStyle="#8dd8b4";for(let i=0;i<7;i++){let x=i*190-cameraX*.25;ctx.beginPath();ctx.moveTo(x-30,455);ctx.lineTo(x+80,250+(i%3)*25);ctx.lineTo(x+200,455);ctx.fill();}
  // Pirâmides
  for(let i=0;i<4;i++){let x=i*410+100-cameraX*.45;ctx.fillStyle="#d9ad67";ctx.beginPath();ctx.moveTo(x,455);ctx.lineTo(x+110,265);ctx.lineTo(x+220,455);ctx.fill();ctx.fillStyle="#f0cb81";ctx.beginPath();ctx.moveTo(x+110,265);ctx.lineTo(x+110,455);ctx.lineTo(x+220,455);ctx.fill();}
  // Dunas
  ctx.fillStyle="#f7d58b";ctx.beginPath();ctx.moveTo(0,430);for(let x=0;x<=W+20;x+=20)ctx.lineTo(x,425+Math.sin((x+cameraX*.4)*.014)*14);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
}
function drawCloud(x,y){ctx.fillStyle="rgba(255,255,255,.82)";ctx.beginPath();ctx.arc(x,y,17,0,Math.PI*2);ctx.arc(x+20,y-9,23,0,Math.PI*2);ctx.arc(x+44,y,17,0,Math.PI*2);ctx.fill();}
function drawPlatform(p){
  let x=p.x-cameraX;if(x+p.w<0||x>W)return;
  ctx.fillStyle="#9c633f";ctx.fillRect(x,p.y,p.w,p.h);
  ctx.fillStyle="#58ba68";ctx.fillRect(x,p.y,p.w,9);
  ctx.fillStyle="#8ce078";ctx.fillRect(x,p.y,p.w,3);
  for(let bx=x+10;bx<x+p.w;bx+=34){ctx.strokeStyle="rgba(91,52,47,.3)";ctx.lineWidth=2;ctx.strokeRect(bx,p.y+17,24,18);}
}
function drawCoin(c){
  if(c.taken)return;let x=c.x-cameraX;if(x<-20||x>W+20)return;
  ctx.fillStyle="#d88722";ctx.beginPath();ctx.ellipse(x,c.y,11,14,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#ffdf55";ctx.beginPath();ctx.ellipse(x,c.y-2,8,11,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#c9821d";ctx.font="bold 13px Fredoka";ctx.textAlign="center";ctx.fillText("½",x,c.y+4);
}
function drawPlayer(){
  const x = player.x-cameraX, y = player.y;
  if(player.invincible>0 && Math.floor(player.invincible/5)%2===0)return;

  // Usa a sprite sheet do aventureiro e mantém o boneco de reserva como fallback.
  if (spriteLoaded) {
    const dw = SPRITE_CONFIG.drawWidth, dh = SPRITE_CONFIG.drawHeight;
    const dx = x + player.w/2 - dw/2;
    const dy = y + player.h - dh;
    ctx.save();
    const moving = Math.abs(player.vx) > 0.4;
    const frame = moving ? Math.floor(spriteTick / SPRITE_CONFIG.frameSpeed) % SPRITE_CONFIG.frames : 0;
    const sx = frame * SPRITE_CONFIG.frameWidth;
    const sy = SPRITE_CONFIG.frameRow * SPRITE_CONFIG.frameHeight;
    ctx.translate(dx + dw/2, 0);
    if (player.facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(playerSprite, sx, sy, SPRITE_CONFIG.frameWidth, SPRITE_CONFIG.frameHeight,
                  -dw/2, dy, dw, dh);
    ctx.restore();
    spriteTick++;
    return;
  }

  ctx.save();ctx.translate(x+player.w/2,y+player.h/2);ctx.scale(player.facing,1);
  roundedRect(-19,-3,12,23,4,"#8a552e");
  roundedRect(-10,12,9,17,3,"#6c442e");roundedRect(2,12,9,17,3,"#6c442e");
  roundedRect(-12,27,13,6,2,"#4c3150");roundedRect(1,27,13,6,2,"#4c3150");
  roundedRect(-12,-8,25,24,6,"#45a96d");
  ctx.fillStyle="#f4bd83";ctx.beginPath();ctx.arc(0,-15,13,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#573727";ctx.beginPath();ctx.arc(0,-20,13,Math.PI,Math.PI*2);ctx.fill();
  ctx.fillStyle="#8b542f";ctx.fillRect(-16,-22,32,5);ctx.fillRect(-9,-30,18,10);
  ctx.fillStyle="#33294c";ctx.fillRect(4,-17,3,4);
  ctx.fillStyle="#f5c64c";ctx.fillRect(-10,-4,20,4);
  ctx.restore();
}
function drawMummy(mummy) {
  if (mummy.defeated) return;
  const x = mummy.x - cameraX;
  if (x < -60 || x > W + 60) return;

  if (mummySpriteLoaded) {
    const frame = Math.floor(mummy.tick / 10) % 8;
    ctx.save();
    if (mummy.direction < 0) {
      ctx.translate(x + 24, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(mummySprite, frame * 96, 0, 96, 96, -24, mummy.y - 10, 48, 48);
    } else {
      ctx.drawImage(mummySprite, frame * 96, 0, 96, 96, x - 7, mummy.y - 10, 48, 48);
    }
    ctx.restore();
    return;
  }

  roundedRect(x, mummy.y + 5, 30, 34, 8, "#d7c796");
  ctx.fillStyle = "#4b3c36";
  ctx.fillRect(x + 6, mummy.y + 13, 5, 4);
  ctx.fillRect(x + 19, mummy.y + 13, 5, 4);
  ctx.fillStyle = "#ece1b9";
  ctx.fillRect(x - 2, mummy.y + 10, 34, 4);
  ctx.fillRect(x + 2, mummy.y + 25, 27, 4);
}
function drawGate(g){
  if(g.opened)return;const x=g.x-cameraX;if(x<-50||x>W+50)return;
  ctx.fillStyle="#8c58cc";ctx.fillRect(x-8,320,10,135);ctx.fillRect(x+36,320,10,135);ctx.fillRect(x-8,314,54,13);
  ctx.fillStyle="#f8d15a";ctx.fillRect(x,328,30,119);ctx.fillStyle="#6b46b4";ctx.fillRect(x+6,335,18,104);
  ctx.fillStyle="#fff0a6";ctx.font="bold 19px Fredoka";ctx.textAlign="center";ctx.fillText("?",x+15,385);
}
function drawPortal(){
 const x=worldWidth-100-cameraX;
 ctx.fillStyle="#eab83d";ctx.beginPath();ctx.ellipse(x,400,31,54,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#9a6be8";ctx.beginPath();ctx.ellipse(x,400,22,45,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#d9fbff";ctx.beginPath();ctx.ellipse(x,400,13,35,0,0,Math.PI*2);ctx.fill();
}
function draw() {
  drawBackground();
  platforms.forEach(drawPlatform);
  coinItems.forEach(drawCoin);
  mummies.forEach(drawMummy);
  gates.forEach(drawGate);
  drawPortal();
  drawPlayer();

  ctx.fillStyle = "#2d3b63";
  ctx.font = "bold 13px Fredoka";
  ctx.textAlign = "left";
  ctx.fillText("TEMPLO DAS FRAÇÕES", 20, 28);
  ctx.fillStyle = "#fff";
  ctx.fillRect(20, 38, 120, 6);
  ctx.fillStyle = "#8053df";
  ctx.fillRect(20, 38, 120 * (player.x / worldWidth), 6);
}

function update() {
  if (!running || pausedForQuestion || finished) return;

  mummies.forEach((mummy) => {
    if (mummy.defeated) return;
    mummy.x += mummy.direction * 0.55;
    mummy.tick++;
    if (mummy.x <= mummy.minX || mummy.x >= mummy.maxX) {
      mummy.direction *= -1;
    }
  });

  if (keys.ArrowRight || keys.d || keys.D) {
    player.vx = player.speed;
    player.facing = 1;
  } else if (keys.ArrowLeft || keys.a || keys.A) {
    player.vx = -player.speed;
    player.facing = -1;
  } else {
    player.vx *= 0.75;
  }

  if ((keys[" "] || keys.ArrowUp || keys.w || keys.W) && player.grounded) {
    player.vy = player.jump;
    player.grounded = false;
  }

  player.x += player.vx;
  player.x = Math.max(0, Math.min(worldWidth - player.w, player.x));

  const oldY = player.y;
  player.vy += gravity;
  player.y += player.vy;
  player.grounded = false;

  platforms.forEach((platform) => {
    const overlapsPlatform =
      player.x + player.w > platform.x && player.x < platform.x + platform.w;
    const landsOnPlatform =
      oldY + player.h <= platform.y + 5 &&
      player.y + player.h >= platform.y &&
      player.vy >= 0;

    if (overlapsPlatform && landsOnPlatform) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.grounded = true;
    }
  });

  mummies.forEach((mummy) => {
    if (mummy.defeated) return;
    const overlapsMummy =
      player.x + player.w > mummy.x + 3 &&
      player.x < mummy.x + 27 &&
      player.y + player.h > mummy.y + 8 &&
      player.y < mummy.y + 38;

    if (!overlapsMummy) return;

    const stompedMummy = oldY + player.h <= mummy.y + 14 && player.vy > 0;
    if (stompedMummy) {
      mummy.defeated = true;
      player.y = mummy.y - player.h;
      player.vy = player.jump * 0.65;
      player.grounded = false;
      score += 100;
      updateHud();
    } else if (player.invincible === 0) {
      loseLife();
    }
  });

  if (player.y > H + 80) loseLife();
  if (player.invincible > 0) player.invincible--;

  coinItems.forEach((coin) => {
    const touchesCoin =
      Math.abs(player.x + player.w / 2 - coin.x) < 22 &&
      Math.abs(player.y + player.h / 2 - coin.y) < 30;

    if (!coin.taken && touchesCoin) {
      coin.taken = true;
      coins++;
      score += 50;
      updateHud();
    }
  });

  gates.forEach((gate, index) => {
    const touchesGate =
      player.x + player.w > gate.x - 12 &&
      player.x < gate.x + 40 &&
      player.y + player.h > 310;

    if (!gate.opened && touchesGate) openQuestion(index);
  });

  cameraX = Math.max(0, Math.min(worldWidth - W, player.x - W * 0.32));
  if (player.x > worldWidth - 145) finishGame();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function updateHud() {
  $("coins").textContent = String(coins).padStart(3, "0");
  $("score").textContent = String(score).padStart(4, "0");
  $("lives").textContent = lives;
  $("checkpointText").textContent = `◆ ${challengeCount}/3 desafios`;
}

function openQuestion(index) {
  if (gates[index].opened || pausedForQuestion) return;

  pausedForQuestion = true;
  const question = questions[index];
  $("questionTitle").textContent = question.title;
  $("questionHint").textContent = question.hint;

  const visual = $("fractionVisual");
  visual.innerHTML = "";
  for (let part = 0; part < question.total; part++) {
    const piece = document.createElement("div");
    piece.className = "fraction-piece" + (part < question.filled ? " filled" : "");
    visual.appendChild(piece);
  }

  const buttons = $("answerButtons");
  buttons.innerHTML = "";
  $("questionFeedback").textContent = "Escolha a resposta correta para abrir o caminho!";

  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.textContent = option;
    button.onclick = () => {
      [...buttons.children].forEach((answer) => {
        answer.disabled = true;
      });

      if (option === question.answer) {
        button.style.background = "#d9f7df";
        button.style.borderColor = "#45b96d";
        $("questionFeedback").textContent = `✓ ${question.explain} +200 pontos!`;
        score += 200;
        challengeCount++;
        gates[index].opened = true;
        updateHud();
        setTimeout(() => {
          $("questionOverlay").classList.add("hidden");
          pausedForQuestion = false;
        }, 1100);
        return;
      }

      button.style.background = "#ffe1dc";
      button.style.borderColor = "#dc6b5b";
      $("questionFeedback").textContent = `Tente novamente! Dica: ${question.hint}`;
      setTimeout(() => {
        [...buttons.children].forEach((answer) => {
          answer.disabled = false;
          answer.style.background = "";
          answer.style.borderColor = "";
        });
        $("questionFeedback").textContent = "Escolha a resposta correta para abrir o caminho.";
      }, 900);
    };
    buttons.appendChild(button);
  });

  $("questionOverlay").classList.remove("hidden");
}

function loseLife() {
  lives--;
  updateHud();
  player.x = Math.max(20, player.x - 100);
  player.y = 300;
  player.vy = 0;
  player.invincible = 90;

  if (lives <= 0) {
    finished = true;
    running = false;
    $("endTitle").textContent = "FIM DE JOGO";
    $("endText").textContent = "Não desista! Tente novamente e conquiste o templo.";
    $("endOverlay").classList.remove("hidden");
  }
}

function finishGame() {
  if (finished) return;
  finished = true;
  running = false;
  $("endTitle").textContent = "TESOURO CONQUISTADO!";
  $("endText").textContent =
    `Você terminou com ${score} pontos, ${coins} moedas e ${challengeCount}/3 desafios resolvidos.`;
  $("endOverlay").classList.remove("hidden");
}

function startGame() {
  resetGame();
  running = true;
  $("startOverlay").classList.add("hidden");
  $("endOverlay").classList.add("hidden");
}

function resetGame() {
  player.x = 70;
  player.y = 330;
  player.vx = 0;
  player.vy = 0;
  player.invincible = 0;
  cameraX = 0;
  score = 0;
  coins = 0;
  lives = 3;
  challengeCount = 0;
  finished = false;
  pausedForQuestion = false;
  coinItems.forEach((coin) => {
    coin.taken = false;
  });
  mummies.forEach((mummy) => {
    mummy.defeated = false;
    mummy.tick = 0;
    mummy.direction = 1;
  });
  gates.forEach((gate) => {
    gate.opened = false;
  });
  updateHud();
  draw();
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", " "].includes(event.key)) {
    event.preventDefault();
  }
  keys[event.key] = true;
});

window.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

$("playBtn").addEventListener("click", startGame);
$("restartBtn").addEventListener("click", startGame);
$("soundBtn").addEventListener("click", () => {
  soundOn = !soundOn;
  $("soundBtn").textContent = soundOn ? "♫" : "♪";
});

draw();
loop();
