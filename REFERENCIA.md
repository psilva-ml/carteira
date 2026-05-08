# Referência de implementação

Este arquivo registra as referências salvas no workspace e as decisões usadas para transformar as páginas em um PWA offline simples.

## Páginas analisadas

- `FESN _ Carteirinha Estudantil.html`: referência da tela inicial de busca/login.
- `FESN _ Carteirinha Estudantil - pag 2.html`: referência da tela da carteirinha.

## Assets copiados

- `assets/logo-fesn-short.svg`: logo FESN usada no login, credencial e ícone.
- `assets/logo-dne-color.png`: logo DNE usada na credencial.
- `assets/student-photo.jpg`: foto do estudante.
- `assets/qr-code.png`: QR Code de autenticidade.
- `assets/app-icon.svg`: ícone simples do PWA.

## Plano aplicado

1. Criar uma página única em `index.html` com duas seções: login e credencial.
2. Usar `style.css` para recriar o visual mobile-first das páginas salvas.
3. Usar `app.js` para validar campos preenchidos, simular sessão com `localStorage`, navegar entre telas e fazer logout.
4. Criar `manifest.json` para instalação como PWA.
5. Criar `service-worker.js` para cachear HTML, CSS, JS e imagens.
6. Documentar execução local, testes offline, GitHub, Cloudflare Pages e instalação no iPhone no `README.md`.

## Observações

- O login é apenas uma simulação: qualquer CPF/código e senha preenchidos são aceitos.
- Não há backend, banco de dados, frameworks ou bibliotecas externas.
- O app usa caminhos relativos para funcionar no Cloudflare Pages.
- A credencial usa UFJF, Engenharia Elétrica e Doutorado.
- A validade é calculada automaticamente como `31/03/ano atual + 1`.
- O ano grande da credencial é calculado automaticamente com o ano atual.
- O QR Code é gerado no navegador e aponta para `CIE.html` no mesmo domínio publicado.
