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
- `assets/play_store_512.png`: ícone do PWA.
- `telas/tela1.jpeg`, `telas/tela2.jpeg`, `telas/tela3.jpeg`: telas fullscreen exibidas antes do login.

## Plano aplicado

1. Criar uma página única em `index.html` com introdução, login, cadastro local, credencial e certificado interno.
2. Usar `style.css` para recriar o visual mobile-first das páginas salvas.
3. Usar `app.js` para validar campos preenchidos, salvar cadastros no `localStorage`, simular sessão, navegar entre telas e fazer logout.
4. Criar `manifest.json` para instalação como PWA.
5. Criar `service-worker.js` para cachear HTML, CSS, JS e imagens.
6. Documentar execução local, testes offline, GitHub, Cloudflare Pages e instalação no iPhone no `README.md`.

## Observações

- O login é apenas uma simulação local: aceita o CPF/código do cadastro salvo ou o cadastro padrão já existente.
- A área `Consulta Rápida` abre o cadastro de apresentação.
- O cadastro salva nome, CPF, nascimento, instituição, curso, tipo de curso, Nº da CIE e foto no `localStorage` do navegador.
- A credencial e o certificado interno renderizam os dados de acordo com o CPF/código usado no login.
- O texto discreto `Validation preview` fica integrado no cadastro, no rodapé da credencial e no cabeçalho do certificado interno.
- Não há backend, banco de dados, frameworks ou bibliotecas externas.
- O app usa caminhos relativos para funcionar no Cloudflare Pages.
- A credencial usa UFJF, Engenharia Elétrica e Doutorado.
- A validade é calculada automaticamente como `31/03/ano atual + 1`.
- O ano grande da credencial é calculado automaticamente com o ano atual.
- O QR Code voltou a usar a imagem original salva em `assets/qr-code.png`.
- O botão `Certificado` abre uma tela interna no próprio `index.html`, sem depender de rota externa.
- Antes do login, o app mostra `tela1.jpeg` por 3 segundos, depois avança por clique para `tela2.jpeg`, `tela3.jpeg` e login.
