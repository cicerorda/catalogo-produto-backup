let produtos = [];
let paginaAtual = 1;
const itensPorPagina = 27;
let categoriasSelecionadas = new Set();
let termoBusca = "";
let grupoAtual = 1;
const botoesPorGrupo = 10;
let totalPaginas = 0;
let categoriasMap = new Map();
const CATEGORIA_COMPONENTES = "COMPONENTES";

let listaImagens = [];
let mapaImagemPorNomeLimpo = new Map(); // 🆕 mapa rápido nome → url

const BASE_IMAGEKIT_URL = "https://ik.imagekit.io/t7590uzhp/imagens/";
const URL_SEM_IMAGEM = "https://ik.imagekit.io/t7590uzhp/imagens/sem-imagem_Ga_BH1QVQo.jpg";

// Cache de variantes e de imagem por referência
const cacheVariantes = new Map();
const cacheImagemPorRef = new Map(); // 🆕 cache ref → url

// Listas auxiliares para paginação com deduplicação por imagem
let listaFiltradaAtual = [];         // tudo filtrado
let listaFiltradaSemDuplicatas = []; // filtrado + 1 por imagem


console.log("✅ script.js foi carregado!");

function gerarVariantesComCache(ref) {
  if (cacheVariantes.has(ref)) return cacheVariantes.get(ref);
  const variantes = gerarVariantes(ref);
  cacheVariantes.set(ref, variantes);
  return variantes;
}

function limparTexto(texto) {
  return (texto || "").toLowerCase().replace(/[.\s\-_]/g, "");
}

function removerSufixoDeVariacao(ref) {
  return (ref ?? "").toString().split(/[-_]/)[0];
}

function baseDoisBlocos(ref) {
  const s = (ref ?? "").toString().toLowerCase().trim();
  const partes = s.split(".");
  if (partes.length >= 2) return `${partes[0]}.${partes[1]}`;
  return s;
}

function removerZerosEsquerdaPrimeiroBloco(refDoisBlocos) {
  const [a, b] = refDoisBlocos.split(".");
  const aSemZero = (a || "").replace(/^0+/, "") || "0";
  return `${aSemZero}.${b}`;
}

function gerarVariantes(ref) {
  const variantes = new Set();
  const crua = limparTexto(ref);
  variantes.add(crua);

  const doisBlocos = baseDoisBlocos(ref);
  variantes.add(limparTexto(doisBlocos));

  const doisBlocosSemZeros = removerZerosEsquerdaPrimeiroBloco(doisBlocos);
  variantes.add(limparTexto(doisBlocosSemZeros));

  let tmp = (ref ?? "").toString();
  while (/\.(?:0{1,3})$/.test(tmp)) {
    tmp = tmp.replace(/\.(?:0{1,3})$/, "");
    variantes.add(limparTexto(tmp));
    const db = baseDoisBlocos(tmp);
    variantes.add(limparTexto(db));
  }

  const semSufixo = limparTexto(removerSufixoDeVariacao(ref));
  variantes.add(semSufixo);

  if (semSufixo.endsWith("00") && semSufixo.length > 6) {
    variantes.add(semSufixo.slice(0, -2));
  }

  // 🔧 CASO ESPECIAL: e.20530.15 para E020530.15.000
  if (/^e0?\d{5}\.\d{2}\.000$/i.test(ref)) {
    const vMatch = ref.match(/^e0?(\d{5})\.(\d{2})\.000$/i);
    if (vMatch) {
      const vCustom = `e.${parseInt(vMatch[1], 10)}.${vMatch[2]}`;
      variantes.add(limparTexto(vCustom));
    }
  }

  // 🔧 NOVO CASO: tratar E0xxxxx.xx → gerar variantes sem o zero depois do E
  const m = ref.match(/^E0(\d{5})\.(\d{2})/i);
  if (m) {
    const bloco1 = m[1]; // ex: 23241
    const bloco2 = m[2]; // ex: 27

    variantes.add(`e${bloco1}${bloco2}`);
    variantes.add(limparTexto(`e.${bloco1}.${bloco2}`));
    variantes.add(`e.${bloco1}.${bloco2}`);
  }

  return Array.from(variantes);
}

function encontrarImagem(ref) {
  if (!ref) return URL_SEM_IMAGEM;

  // Cache: mesma referência → mesma URL
  if (cacheImagemPorRef.has(ref)) {
    return cacheImagemPorRef.get(ref);
  }

  const variantes = gerarVariantesComCache(ref);
  let urlEncontrada = URL_SEM_IMAGEM;

  for (const v of variantes) {
    const url = mapaImagemPorNomeLimpo.get(v); // consulta no Map
    if (url) {
      urlEncontrada = url;
      break;
    }
  }

  cacheImagemPorRef.set(ref, urlEncontrada);
  return urlEncontrada;
}

let imagensCarregadas = false;
let produtosCarregados = false;

fetch("imagens.json")
  .then(res => res.json())
  .then(imagensData => {
    listaImagens = imagensData.map(img => ({
      ...img,
      nome_limpo: processarNomeImagem(img.nome)
    }));

    // 🆕 monta mapa nome_limpo → url para busca O(1)
    mapaImagemPorNomeLimpo = new Map();
    listaImagens.forEach(img => {
      if (img.nome_limpo) {
        mapaImagemPorNomeLimpo.set(img.nome_limpo, img.url);
      }
    });

    console.log("🔍 Imagens carregadas:", listaImagens);
    imagensCarregadas = true;

    if (produtosCarregados) {
      atualizarProdutos();
    }
  })
  .catch(err => console.error("❌ Erro ao carregar imagens.json:", err));

function processarCategoria(categoriaRaw) {
  if (!categoriaRaw) return null;

  // quebra possíveis múltiplas categorias
  const primeira = categoriaRaw.split(",")[0].trim();
  const partes = primeira.split("_");

  return {
    codigo: partes.slice(0, 3).join("_"), // 30_50_030
    nome: partes.slice(3).join("_")       // PASSADORES
  };
}


fetch("produtos.json")
  .then(res => res.json())
  .then(produtosData => {
    produtos = produtosData;

    categoriasMap.clear(); // usa o global

    produtos.forEach(produto => {
      if (!produto.Categoria) return;

      const cat = processarCategoria(produto.Categoria);

      produto.CategoriaNome = cat.nome;
      produto.CategoriaCodigo = cat.codigo;

      if (!categoriasMap.has(cat.nome)) {
        categoriasMap.set(cat.nome, new Set());
      }

      categoriasMap.get(cat.nome).add(cat.codigo);
    });

    criarListaDeCategorias();
    produtosCarregados = true;

    if (imagensCarregadas) {
      atualizarProdutos();
    }
  })
  .catch(err => console.error("❌ Erro ao carregar produtos.json:", err));


function processarNomeImagem(nome) {
    const nomeOriginal = nome.toLowerCase();
    const partes = nomeOriginal.split("_");

    let nomeBase = partes[0];

    // Se for tipo ctc_005800 → mantém inteiro
    if (partes.length > 1 && /^[a-z]+$/.test(partes[0])) {
        nomeBase = partes[0] + partes[1];
    }

    const nomeLimpo = nomeBase.replace(/[\.\s\-_]/g, "");
    return nomeLimpo;
}

function criarListaDeCategorias() {
  const listaCategorias = document.getElementById("category-list");
  listaCategorias.innerHTML = "";

  categoriasMap.forEach((codigos, nome) => {
    const liCategoria = document.createElement("li");
    liCategoria.classList.add("categoria");

    const titulo = document.createElement("div");
    titulo.classList.add("categoria-nome");
    titulo.textContent = nome;

    titulo.addEventListener("click", () => {
      const checkboxes = liCategoria.querySelectorAll(".categoria-checkbox");

      const todasMarcadas = [...checkboxes].every(cb => cb.checked);

      checkboxes.forEach(cb => {
        cb.checked = !todasMarcadas;
      });

      paginaAtual = 1;
      grupoAtual = 1;
      atualizarProdutos();
      atualizarEstadoCategorias();
    });

    const ulSub = document.createElement("ul");

    codigos.forEach(codigo => {
      const liSub = document.createElement("li");
      liSub.classList.add("item-categoria", "subcategoria-item");

      liSub.innerHTML = `
        <label>
          <input
            type="checkbox"
            class="categoria-checkbox"
            value="${codigo}"
            onchange="atualizarProdutos(); atualizarEstadoCategorias();"
          >
          <span class="codigo-categoria">${codigo}</span>
        </label>
      `;

      ulSub.appendChild(liSub);
    });

    const liComponentes = document.createElement("li");
    liComponentes.classList.add("subcategoria-item");

    liComponentes.innerHTML = `
      <label>
        <input
          type="checkbox"
          class="categoria-checkbox"
          data-tipo="componentes"
          value="COMPONENTES"
          onchange="atualizarProdutos(); atualizarEstadoCategorias();"
        >
        COMPONENTES
      </label>
    `;

    ulSub.appendChild(liComponentes);

    liCategoria.appendChild(titulo);
    liCategoria.appendChild(ulSub);
    listaCategorias.appendChild(liCategoria);
  });
}

function atualizarEstadoCategorias() {
  document.querySelectorAll(".categoria").forEach(cat => {
    const nome = cat.querySelector(".categoria-nome");
    const subs = cat.querySelectorAll(".subcategoria-item");
    const checkboxes = cat.querySelectorAll(".categoria-checkbox");

    const marcadas = [...checkboxes].filter(cb => cb.checked);

    // Nome só fica amarelo se TODAS subcategorias estiverem marcadas
    nome.classList.toggle(
      "ativa",
      marcadas.length === checkboxes.length && checkboxes.length > 0
    );

    // Cada subcategoria controla seu próprio destaque
    subs.forEach(li => {
      const cb = li.querySelector("input");
      li.classList.toggle("ativa", cb.checked);
    });
  });
}

function selecionarCategoriaCompleta(nomeCategoria) {
  const subcategorias = categoriasMap.get(nomeCategoria);
  if (!subcategorias) return;

  const checkboxes = [...document.querySelectorAll(".categoria-checkbox")];

  const todasMarcadas = checkboxes
    .filter(cb => subcategorias.has(cb.value))
    .every(cb => cb.checked);

  checkboxes.forEach(cb => {
    if (subcategorias.has(cb.value)) {
      cb.checked = !todasMarcadas;
    }
  });

  paginaAtual = 1;
  grupoAtual = 1;
  atualizarProdutos();
}

function obterProdutosFiltrados() {
  const filtrarComponentes = categoriasSelecionadas.has("COMPONENTES");

  return produtos.filter(produto => {

    // 🔹 REGRA COMPONENTES (invertida)
    const ehComponente = produto.Descricao?.toUpperCase().includes("COMP.");

    if (!filtrarComponentes && ehComponente) {
      return false; // remove componentes quando NÃO marcado
    }

    // 🔹 REGRA CATEGORIA (normal)
    const passaCategoria =
      categoriasSelecionadas.size === 0 ||
      categoriasSelecionadas.has(produto.CategoriaCodigo);

    // 🔹 REGRA BUSCA
    const passaBusca =
      !termoBusca ||
      limparTexto(produto.Referencia).includes(limparTexto(termoBusca)) ||
      limparTexto(produto.Descricao).includes(limparTexto(termoBusca));

    return passaCategoria && passaBusca;
  });
}


function atualizarProdutos() {
  categoriasSelecionadas.clear();

  document
    .querySelectorAll(".categoria-checkbox:checked")
    .forEach(cb => categoriasSelecionadas.add(cb.value));

  paginaAtual = 1;

  listaFiltradaAtual = obterProdutosFiltrados();

  const urlsVistas = new Set();
  listaFiltradaSemDuplicatas = listaFiltradaAtual.filter(p => {
    const url = encontrarImagem(p.Referencia);
    if (urlsVistas.has(url)) return false;
    urlsVistas.add(url);
    return true;
  });

  exibirProdutos(listaFiltradaSemDuplicatas);
  criarPaginacao(listaFiltradaSemDuplicatas);

  document.querySelectorAll(".categoria-checkbox").forEach(cb => {
    const liSub = cb.closest("li");
    if (!liSub) return;
    liSub.classList.toggle("ativa", cb.checked);
  });

  document.querySelectorAll(".categoria").forEach(li => {
    const checkboxes = li.querySelectorAll(".categoria-checkbox");
    const titulo = li.querySelector(".categoria-nome");

    if (!checkboxes.length || !titulo) return;

    const todasMarcadas = [...checkboxes].every(cb => cb.checked);
    titulo.classList.toggle("ativa", todasMarcadas);
  });

}

// 🔹 Buscar categorias
function filtrarCategorias() {
  const termo = document
    .getElementById("search-category")
    .value
    .toLowerCase();

  const lista = document.getElementById("category-list");
  const itens = lista.querySelectorAll("li.categoria");

  itens.forEach(li => {
    const nomeCategoria = li
      .querySelector(".categoria-nome")
      .textContent
      .toLowerCase();

    li.style.display = nomeCategoria.includes(termo)
      ? ""
      : "none";
  });
}


// 🔹 Criar botões de paginação
function criarPaginacao(lista) {
    totalPaginas = Math.ceil(lista.length / itensPorPagina);
    const paginacaoContainer = document.getElementById("pagination");
    paginacaoContainer.innerHTML = "";

    const inicioGrupo = (grupoAtual - 1) * botoesPorGrupo + 1;
    const fimGrupo = Math.min(inicioGrupo + botoesPorGrupo - 1, totalPaginas);

    if (grupoAtual > 1) {
        paginacaoContainer.appendChild(criarBotao("⟨", () => mudarGrupo(grupoAtual - 1)));
    }

    for (let i = inicioGrupo; i <= fimGrupo; i++) {
        const btn = criarBotao(i, () => mudarPagina(i));
        if (i === paginaAtual) btn.classList.add("active");
        paginacaoContainer.appendChild(btn);
    }

    if (fimGrupo < totalPaginas) {
        paginacaoContainer.appendChild(criarBotao("⟩", () => mudarGrupo(grupoAtual + 1)));
    }
}

// 🔹 Criar botão reutilizável
function criarBotao(texto, funcao) {
    const btn = document.createElement("button");
    btn.textContent = texto;
    btn.classList.add("pagina-btn");
    btn.addEventListener("click", funcao);
    return btn;
}

// 🔹 Mudar grupo de páginas
function mudarGrupo(novoGrupo) {
  grupoAtual = novoGrupo;
  criarPaginacao(listaFiltradaSemDuplicatas);
}

function mudarPagina(pagina) {
  paginaAtual = pagina;
  exibirProdutos(listaFiltradaSemDuplicatas);
  criarPaginacao(listaFiltradaSemDuplicatas);
}

// 🔹 Toggle da lista de categorias
document.querySelector(".filter-header").addEventListener("click", () => {
    const filterContent = document.getElementById("category-filter");
    filterContent.classList.toggle("active");
});

// ✅ Exibir produtos na tela (sem repetir mesma imagem na página)
function exibirProdutos(lista) {
  const container = document.getElementById("products");
  container.innerHTML = "";

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const produtosPagina = lista.slice(inicio, inicio + itensPorPagina);

  if (!produtosPagina.length) {
    container.innerHTML = `<p class="mensagem-nenhum-produto">Nenhum produto encontrado.</p>`;
    return;
  }

  produtosPagina.forEach(produto => {
    const card = document.createElement("div");
    card.classList.add("card");

    const caminhoImagem = encontrarImagem(produto.Referencia);

    card.innerHTML = `
      <div class="image-container">
        <img src="${caminhoImagem}" alt="Imagem do produto"
          onerror="console.error('❌ Imagem não encontrada:', this.src); this.src='${URL_SEM_IMAGEM}?updatedAt=1745112243066'">
      </div>
      <div class="container">
        <h5>${produto.Referencia || "Sem Referência"}</h5>
        <p>${produto.Descricao || "Sem Descrição"}</p>
        <h6>Categoria: ${produto.Categoria || "Sem Categoria"}</h6>
      </div>
    `;

    container.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(() => {
        const btnDownload = document.getElementById("download-pdf");

        if (btnDownload) {
            console.log("✅ Botão 'Baixar Pesquisa' encontrado!");

            btnDownload.addEventListener("click", function () {
                console.log("🎯 Botão clicado!");
                baixarPesquisaEmPDF();
            });

        } else {
            console.error("❌ Erro: Botão 'Baixar Pesquisa' NÃO encontrado no HTML.");
        }
        // 🔽 Ativa o campo de busca principal
        function debounce(func, delay) {
            let timeout;
            return function (...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), delay);
            };
        }

        const inputBusca = document.getElementById("search-input");
        if (inputBusca) {
            inputBusca.addEventListener("input", debounce((event) => {
                termoBusca = event.target.value.trim();
                console.log("🔎 termoBusca atualizado:", termoBusca);
                paginaAtual = 1;
                atualizarProdutos();
            }, 300)); // você pode ajustar esse tempo se quiser
        }
    }, 1000); // Espera 1 segundo para garantir que o DOM foi carregado
});

function baixarPesquisaEmPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // 🟡 Base para o PDF:
    // se já temos a lista sem duplicatas (tela atual), reaproveita
    // se não, cai para obterProdutosFiltrados() como fallback
    let baseLista = (Array.isArray(listaFiltradaSemDuplicatas) && listaFiltradaSemDuplicatas.length)
        ? listaFiltradaSemDuplicatas
        : obterProdutosFiltrados();

    if (!baseLista.length) {
        alert("Nenhum item encontrado.");
        return;
    }

    // 🟢 Remove duplicados por imagem também no PDF
    const urlsVistas = new Set();
    const listaSemDuplicatas = [];

    for (const produto of baseLista) {
        const urlImg = encontrarImagem(produto.Referencia);

        if (!urlsVistas.has(urlImg)) {
            urlsVistas.add(urlImg);
            listaSemDuplicatas.push(produto);
        }
    }

    if (!listaSemDuplicatas.length) {
        alert("Nenhum item encontrado.");
        return;
    }

    // 📝 Cabeçalho
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Catálogo de Produtos", 10, 15);

    let x = 10, y = 25;
    const larguraCard = 62;
    const alturaCard = 62;
    const imgMaxLargura = 50;
    const imgMaxAltura = 30;
    const espacamentoX = 3;
    const espacamentoY = 3;
    const colunas = 3;

    // 🔄 Carrega imagens de todos os produtos (sem duplicatas)
    const promessas = listaSemDuplicatas.map(produto => {
        return new Promise(resolve => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve({ produto, img });
            img.onerror = () => resolve({ produto, img: null });
            img.src = encontrarImagem(produto.Referencia);
        });
    });

    Promise.all(promessas).then(resultados => {
        resultados.forEach(({ produto, img }, index) => {
            // Card de fundo
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(x, y, larguraCard, alturaCard, 3, 3, "FD");

            // Imagem (se carregou)
            if (img) {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                const base64 = canvas.toDataURL("image/jpeg");

                const escala = Math.min(
                    imgMaxLargura / img.width,
                    imgMaxAltura / img.height
                );
                const imgLarguraAjustada = img.width * escala;
                const imgAlturaAjustada = img.height * escala;

                doc.addImage(
                    base64,
                    "JPEG",
                    x + (larguraCard - imgLarguraAjustada) / 2,
                    y + 5,
                    imgLarguraAjustada,
                    imgAlturaAjustada
                );
            }

            const textoY = y + imgMaxAltura + 12;
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");
            doc.text((produto.Referencia || "Sem Referência").toString(), x + 5, textoY);

            doc.setFont("helvetica", "normal");
            const desc = doc.splitTextToSize(
                (produto.Descricao || "Sem Descrição").toString(),
                larguraCard - 10
            );
            doc.text(desc, x + 5, textoY + 5);

            doc.setFont("helvetica", "italic");
            doc.setFontSize(8);
            doc.setTextColor(100);
            //doc.text(`Cat: ${produto.CategoriaNome} (${produto.CategoriaCodigo})`, x + 5, textoY + 15);

            // Próximo card (3 colunas)
            if ((index + 1) % colunas === 0) {
                x = 10;
                y += alturaCard + espacamentoY;
            } else {
                x += larguraCard + espacamentoX;
            }

            // Próxima página se precisar
            if (y + alturaCard > 295) {
                doc.addPage();
                y = 25;
                x = 10;
            }

            doc.setTextColor(0, 0, 0);
        });

        doc.save("catalogo_produtos.pdf");
    });
}

console.log("Verificando jsPDF:", window.jspdf);

function gerarRelatorioSemImagem() {
    const semImagem = produtos.filter(p => encontrarImagem(p.Referencia).includes("sem-imagem.jpg"));

    console.warn(`🔍 Total de produtos sem imagem: ${semImagem.length}`);
    console.table(semImagem.map(p => ({
        Referencia: p.Referencia,
        Descricao: p.Descricao,
        Categoria: p.Categoria
    })));
}

// Chamar após carregar tudo
setTimeout(() => {
    if (produtos.length > 0 && listaImagens.length > 0) {
        gerarRelatorioSemImagem();
    } else {
        console.warn("⚠️ Produtos ou imagens ainda não carregados para gerar o relatório.");
    }
}, 2000);