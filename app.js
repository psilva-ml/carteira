// Chave usada para simular uma sessão local, sem backend.
const SESSION_KEY = "carteirinha_fesn_sessao";
const CIE_PATH = "./CIE.html";

// Opcional: depois de publicar, você pode colocar aqui a URL final do Cloudflare.
// Se ficar vazio, o app monta automaticamente a URL usando o domínio aberto.
const CIE_URL_PUBLICA = "";

const telas = {
  login: document.querySelector("#loginView"),
  credencial: document.querySelector("#credentialView"),
};

const formulario = document.querySelector("#loginForm");
const campoDocumento = document.querySelector("#documento");
const campoSenha = document.querySelector("#senha");
const mensagemErro = document.querySelector("#loginError");
const botaoLogout = document.querySelector("#logoutButton");
const validadeValor = document.querySelector("#validadeValor");
const anoAtual = document.querySelector("#anoAtual");
const qrCanvas = document.querySelector("#qrCanvas");
const qrLink = document.querySelector("#qrLink");
const certificateLink = document.querySelector("#certificateLink");

document.addEventListener("DOMContentLoaded", iniciarApp);

function iniciarApp() {
  registrarServiceWorker();
  configurarEventos();
  atualizarDadosDinamicos();
  gerarQrCodeCie();

  if (temSessaoAtiva()) {
    mostrarCredencial();
    return;
  }

  mostrarLogin();
}

function configurarEventos() {
  formulario.addEventListener("submit", entrar);
  botaoLogout.addEventListener("click", sair);
  window.addEventListener("hashchange", sincronizarRota);
}

function entrar(evento) {
  evento.preventDefault();

  const documento = campoDocumento.value.trim();
  const senha = campoSenha.value.trim();

  limparErro();

  if (!documento || !senha) {
    mostrarErro("Preencha o CPF ou código de uso e a senha para entrar.");
    return;
  }

  const sessao = {
    autenticado: true,
    documento,
    criadoEm: new Date().toISOString(),
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(sessao));
  formulario.reset();
  mostrarCredencial();
}

function sair() {
  localStorage.removeItem(SESSION_KEY);
  mostrarLogin();
}

function temSessaoAtiva() {
  try {
    const sessao = JSON.parse(localStorage.getItem(SESSION_KEY));
    return Boolean(sessao && sessao.autenticado);
  } catch (erro) {
    localStorage.removeItem(SESSION_KEY);
    return false;
  }
}

function sincronizarRota() {
  if (window.location.hash === "#credencial" && temSessaoAtiva()) {
    alternarTela("credencial", false);
    return;
  }

  if (!temSessaoAtiva()) {
    alternarTela("login", false);
  }
}

function mostrarLogin() {
  alternarTela("login", true);
  campoDocumento.focus();
}

function mostrarCredencial() {
  alternarTela("credencial", true);
}

function alternarTela(nomeTela, atualizarHash) {
  const abrirCredencial = nomeTela === "credencial";

  telas.login.classList.toggle("hidden", abrirCredencial);
  telas.credencial.classList.toggle("hidden", !abrirCredencial);

  document.title = abrirCredencial
    ? "Minha Carteirinha | FESN"
    : "FESN | Carteirinha Estudantil";

  if (atualizarHash) {
    const hash = abrirCredencial ? "#credencial" : "#login";
    history.replaceState(null, "", hash);
  }
}

function mostrarErro(texto) {
  mensagemErro.textContent = texto;
  campoDocumento.setAttribute("aria-invalid", String(!campoDocumento.value.trim()));
  campoSenha.setAttribute("aria-invalid", String(!campoSenha.value.trim()));
}

function limparErro() {
  mensagemErro.textContent = "";
  campoDocumento.removeAttribute("aria-invalid");
  campoSenha.removeAttribute("aria-invalid");
}

function atualizarDadosDinamicos() {
  const ano = new Date().getFullYear();

  validadeValor.textContent = `31/03/${ano + 1}`;
  anoAtual.textContent = String(ano);
}

function gerarQrCodeCie() {
  const destino = obterUrlPublicaCie();

  qrLink.href = destino;
  qrLink.title = destino;
  certificateLink.href = destino;
  certificateLink.title = destino;
  desenharQrCode(qrCanvas, destino);
}

function obterUrlPublicaCie() {
  if (CIE_URL_PUBLICA.trim()) {
    return CIE_URL_PUBLICA.trim();
  }

  return new URL(CIE_PATH, window.location.href).href;
}

function desenharQrCode(canvas, texto) {
  const matriz = criarQrCode(texto);
  const contexto = canvas.getContext("2d");
  const margem = 4;
  const modulos = matriz.length + margem * 2;
  const escala = Math.floor(canvas.width / modulos);
  const deslocamento = Math.floor((canvas.width - modulos * escala) / 2);

  contexto.fillStyle = "#ffffff";
  contexto.fillRect(0, 0, canvas.width, canvas.height);
  contexto.fillStyle = "#000000";

  matriz.forEach((linha, y) => {
    linha.forEach((ativo, x) => {
      if (!ativo) {
        return;
      }

      contexto.fillRect(
        deslocamento + (x + margem) * escala,
        deslocamento + (y + margem) * escala,
        escala,
        escala
      );
    });
  });
}

function criarQrCode(texto) {
  const versao = 5;
  const tamanho = 21 + (versao - 1) * 4;
  const codewordsDados = criarDadosQr(texto, 108);
  const codewordsErro = criarCorrecaoErro(codewordsDados, 26);
  const codewords = codewordsDados.concat(codewordsErro);
  const modulos = criarMatriz(tamanho, false);
  const reservado = criarMatriz(tamanho, false);

  function definir(row, col, ativo, ehFuncao) {
    if (row < 0 || row >= tamanho || col < 0 || col >= tamanho) {
      return;
    }

    modulos[row][col] = ativo;

    if (ehFuncao) {
      reservado[row][col] = true;
    }
  }

  desenharPadraoLocalizacao(3, 3, definir);
  desenharPadraoLocalizacao(3, tamanho - 4, definir);
  desenharPadraoLocalizacao(tamanho - 4, 3, definir);
  desenharPadraoAlinhamento(30, 30, definir);
  desenharSincronismo(tamanho, definir);
  desenharFormato(tamanho, 0, definir);
  preencherDados(codewords, modulos, reservado, 0);

  return modulos;
}

function criarDadosQr(texto, capacidadeBytes) {
  const bytes = Array.from(new TextEncoder().encode(texto));
  const bits = [];

  if (bytes.length > capacidadeBytes) {
    throw new Error("Texto grande demais para o QR Code local.");
  }

  adicionarBits(bits, 0b0100, 4);
  adicionarBits(bits, bytes.length, 8);
  bytes.forEach((byte) => adicionarBits(bits, byte, 8));

  const capacidadeBits = capacidadeBytes * 8;
  adicionarBits(bits, 0, Math.min(4, capacidadeBits - bits.length));

  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const dados = [];

  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;

    for (let j = 0; j < 8; j += 1) {
      byte = (byte << 1) | bits[i + j];
    }

    dados.push(byte);
  }

  for (let pad = 0; dados.length < capacidadeBytes; pad += 1) {
    dados.push(pad % 2 === 0 ? 0xec : 0x11);
  }

  return dados;
}

function adicionarBits(destino, valor, quantidade) {
  for (let i = quantidade - 1; i >= 0; i -= 1) {
    destino.push((valor >>> i) & 1);
  }
}

function criarMatriz(tamanho, valorInicial) {
  return Array.from({ length: tamanho }, () => Array(tamanho).fill(valorInicial));
}

function desenharPadraoLocalizacao(rowCentro, colCentro, definir) {
  for (let row = -4; row <= 4; row += 1) {
    for (let col = -4; col <= 4; col += 1) {
      const distancia = Math.max(Math.abs(row), Math.abs(col));
      const ativo = distancia !== 2 && distancia !== 4;

      definir(rowCentro + row, colCentro + col, ativo, true);
    }
  }
}

function desenharPadraoAlinhamento(rowCentro, colCentro, definir) {
  for (let row = -2; row <= 2; row += 1) {
    for (let col = -2; col <= 2; col += 1) {
      const distancia = Math.max(Math.abs(row), Math.abs(col));

      definir(rowCentro + row, colCentro + col, distancia !== 1, true);
    }
  }
}

function desenharSincronismo(tamanho, definir) {
  for (let i = 8; i < tamanho - 8; i += 1) {
    const ativo = i % 2 === 0;

    definir(6, i, ativo, true);
    definir(i, 6, ativo, true);
  }
}

function desenharFormato(tamanho, mascara, definir) {
  const bits = calcularBitsFormato(1, mascara);

  for (let i = 0; i <= 5; i += 1) {
    definir(i, 8, lerBit(bits, i), true);
  }

  definir(7, 8, lerBit(bits, 6), true);
  definir(8, 8, lerBit(bits, 7), true);
  definir(8, 7, lerBit(bits, 8), true);

  for (let i = 9; i < 15; i += 1) {
    definir(8, 14 - i, lerBit(bits, i), true);
  }

  for (let i = 0; i < 8; i += 1) {
    definir(tamanho - 1 - i, 8, lerBit(bits, i), true);
  }

  for (let i = 8; i < 15; i += 1) {
    definir(8, tamanho - 15 + i, lerBit(bits, i), true);
  }

  definir(tamanho - 8, 8, true, true);
}

function preencherDados(codewords, modulos, reservado, mascara) {
  const tamanho = modulos.length;
  let indiceBit = 0;
  let subindo = true;

  for (let colDireita = tamanho - 1; colDireita >= 1; colDireita -= 2) {
    if (colDireita === 6) {
      colDireita -= 1;
    }

    for (let vertical = 0; vertical < tamanho; vertical += 1) {
      const row = subindo ? tamanho - 1 - vertical : vertical;

      for (let deslocamento = 0; deslocamento < 2; deslocamento += 1) {
        const col = colDireita - deslocamento;

        if (reservado[row][col]) {
          continue;
        }

        let ativo = false;

        if (indiceBit < codewords.length * 8) {
          ativo = ((codewords[indiceBit >>> 3] >>> (7 - (indiceBit & 7))) & 1) === 1;
          indiceBit += 1;
        }

        if (aplicarMascara(mascara, row, col)) {
          ativo = !ativo;
        }

        modulos[row][col] = ativo;
      }
    }

    subindo = !subindo;
  }
}

function aplicarMascara(mascara, row, col) {
  if (mascara === 0) {
    return (row + col) % 2 === 0;
  }

  return false;
}

function calcularBitsFormato(nivelErro, mascara) {
  let dados = (nivelErro << 3) | mascara;
  let resto = dados;

  for (let i = 0; i < 10; i += 1) {
    resto = (resto << 1) ^ ((resto >>> 9) * 0x537);
  }

  return ((dados << 10) | resto) ^ 0x5412;
}

function lerBit(valor, indice) {
  return ((valor >>> indice) & 1) === 1;
}

function criarCorrecaoErro(dados, quantidade) {
  const gerador = criarPolinomioGerador(quantidade);
  const resultado = Array(quantidade).fill(0);

  dados.forEach((byte) => {
    const fator = byte ^ resultado.shift();
    resultado.push(0);

    gerador.slice(1).forEach((coeficiente, indice) => {
      resultado[indice] ^= multiplicarGalois(coeficiente, fator);
    });
  });

  return resultado;
}

function criarPolinomioGerador(grau) {
  let polinomio = [1];

  for (let i = 0; i < grau; i += 1) {
    polinomio = multiplicarPolinomios(polinomio, [1, potenciaGalois(i)]);
  }

  return polinomio;
}

function multiplicarPolinomios(a, b) {
  const resultado = Array(a.length + b.length - 1).fill(0);

  a.forEach((valorA, i) => {
    b.forEach((valorB, j) => {
      resultado[i + j] ^= multiplicarGalois(valorA, valorB);
    });
  });

  return resultado;
}

function multiplicarGalois(a, b) {
  if (a === 0 || b === 0) {
    return 0;
  }

  return QR_EXP[QR_LOG[a] + QR_LOG[b]];
}

function potenciaGalois(expoente) {
  return QR_EXP[expoente];
}

function criarTabelasGalois() {
  const exp = Array(512).fill(0);
  const log = Array(256).fill(0);
  let valor = 1;

  for (let i = 0; i < 255; i += 1) {
    exp[i] = valor;
    log[valor] = i;
    valor <<= 1;

    if (valor & 0x100) {
      valor ^= 0x11d;
    }
  }

  for (let i = 255; i < 512; i += 1) {
    exp[i] = exp[i - 255];
  }

  return { exp, log };
}

const QR_TABELAS = criarTabelasGalois();
const QR_EXP = QR_TABELAS.exp;
const QR_LOG = QR_TABELAS.log;

function registrarServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((erro) => {
      console.warn("Service worker não registrado:", erro);
    });
  });
}
