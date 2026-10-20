# Fractus — Plataforma 2D com espaço para sua sprite

## Colocar seu bonequinho (sprite)
1. Coloque seu arquivo na pasta `assets/sprites/personagens/`.
2. Renomeie para `jogador.png` (ou mude o caminho em `SPRITE_CONFIG`).
3. Abra `js/game.js` e procure `SPRITE_CONFIG` no começo do arquivo.
4. Escolha o modo:
   - **PNG de um personagem só:** `sheet: false`
   - **Sprite sheet horizontal com quadros lado a lado:** `sheet: true`, configure `frameWidth`, `frameHeight` e `frames`.
5. Ajuste `drawWidth` e `drawHeight` para o tamanho que quiser no jogo.

Exemplo de configuração:
```js
const SPRITE_CONFIG = {
  src: "assets/sprites/personagens/jogador.png",
  sheet: true,
  frameWidth: 64,
  frameHeight: 64,
  frames: 6,
  frameSpeed: 8,
  drawWidth: 52,
  drawHeight: 58
};
```

**Atenção:** o modo `sheet: true` espera os quadros em uma única linha horizontal e todos do mesmo tamanho. Se sua sprite sheet tiver quadros em várias linhas, será necessário adaptar o recorte. Para sprites com fundo transparente, use PNG.

Se o arquivo não for encontrado, o jogo mostra o personagem provisório e continua funcionando.

## Colocar sprites de prêmios
Coloque imagens em `assets/sprites/premios/`, por exemplo `moeda.png`, `gema.png` e `bau.png`. A pasta está preparada; o desenho das moedas ainda é provisório no JavaScript.

## Executar
Abra `index.html` no navegador ou use Live Server no VS Code.
Controles: setas ou A/D para mover; Espaço, W ou seta para cima para pular.
