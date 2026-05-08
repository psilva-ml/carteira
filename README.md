# FESN | Carteirinha Estudantil PWA

App estático em HTML, CSS e JavaScript puro, com login simulado, tela de credencial e cache offline via Service Worker.
O QR Code da credencial aponta para a página local `CIE.html`, que também é salva no cache offline junto com a pasta `CIE_files`.

## Como rodar localmente

Na pasta do projeto, rode:

```bash
npx serve .
```

Depois abra a URL exibida no terminal, normalmente `http://localhost:3000`.

## Como testar no navegador

1. Abra o app pelo endereço local.
2. Preencha CPF/código e senha com qualquer valor.
3. Clique em **Entrar**.
4. A tela da credencial deve aparecer.
5. Clique em **Buscar outra carteirinha** para limpar a sessão e voltar ao login.

## Como testar offline

1. Abra o app uma vez com internet para o Service Worker salvar o cache.
2. No Chrome ou Edge, abra DevTools.
3. Vá em **Application** → **Service Workers** e confirme que o service worker está ativo.
4. Marque **Offline** na aba **Network**.
5. Recarregue a página.
6. O app deve continuar abrindo com login, credencial, imagens e QR Code.

## Como enviar para GitHub

Crie um repositório vazio no GitHub e rode os comandos Git no final deste README, trocando a URL pelo endereço do seu repositório.

## Como publicar no Cloudflare Pages

1. Entre em `https://dash.cloudflare.com`.
2. Acesse **Workers & Pages** → **Create** → **Pages**.
3. Conecte sua conta do GitHub.
4. Selecione o repositório deste projeto.
5. Em **Framework preset**, escolha **None**.
6. Deixe **Build command** vazio.
7. Em **Build output directory**, use `.`.
8. Publique o projeto.

## Como instalar no iPhone

1. Abra a URL publicada no Safari.
2. Toque em **Compartilhar**.
3. Toque em **Adicionar à Tela de Início**.
4. Confirme em **Adicionar**.
5. Abra o app pelo ícone criado na Tela de Início.

## Comandos Git

```bash
git init
git add .
git commit -m "Cria PWA offline da carteirinha"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```
