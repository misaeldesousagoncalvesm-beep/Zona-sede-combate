# ZONA DE COMBATE — OPERAÇÃO APOCALIPSE

Jogo de ação 2D de tiro lateral feito com HTML5, CSS e JavaScript (Canvas 2D e Web Audio). Não usa bibliotecas externas nem arquivos de imagem ou som: todos os gráficos são desenhados por código e todo o áudio é sintetizado no navegador.

## Estrutura

```
index.html      página principal (ponto de entrada)
css/style.css   estilos (interface e controles de toque)
js/game.js      lógica completa do jogo
.nojekyll       desativa o processamento Jekyll no GitHub Pages
README.md       este arquivo
```

## Publicar no GitHub Pages

1. Crie um repositório no GitHub (por exemplo `zona-de-combate`).
2. Envie todos os arquivos desta pasta para a raiz do repositório (inclusive `.nojekyll`).
3. No repositório, vá em **Settings → Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**, selecione a branch `main` e a pasta `/ (root)`, depois clique em **Save**.
5. Aguarde alguns minutos. O jogo ficará disponível em `https://SEU-USUARIO.github.io/zona-de-combate/`.

Todos os caminhos são relativos (`css/style.css`, `js/game.js`), então o jogo funciona tanto na raiz de um domínio quanto em uma subpasta de projeto.

## Testar localmente

Basta abrir `index.html` no navegador. Para testar sem restrições do navegador, você também pode servir a pasta com qualquer servidor estático.

## Controles

- **PC:** setas ou A/D para mover, Espaço para pular, tecla de tiro e teclas de arma/habilidade conforme o menu de controles.
- **Celular:** botões na tela (◀ ▶ PULAR MIRA FOGO ARMA HAB). A posição dos botões pode ser trocada nas Configurações.

## Progresso

O progresso (XP, moedas, desbloqueios, recordes e conquistas) é salvo automaticamente no `localStorage` do navegador, na chave `zc_save_v2`. O progresso fica no navegador de cada pessoa e não é compartilhado entre dispositivos.
