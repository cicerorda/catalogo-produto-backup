export let produtos = [];
export let paginaAtual = 1;
export const itensPorPagina = 25;
export let categoriasSelecionadas = new Set();
export let termoBusca = "";
export let grupoAtual = 1;
export const botoesPorGrupo = 10;
export let totalPaginas = 0;
export let categoriasMap = new Map();

export let listaImagens = [];
export let mapaImagemPorNomeLimpo = new Map();

export const cacheVariantes = new Map();
export const cacheImagemPorRef = new Map();

export let listaFiltradaAtual = [];
export let listaFiltradaSemDuplicatas = [];

export const URL_SEM_IMAGEM = "https://ik.imagekit.io/t7590uzhp/imagens/sem-imagem_Ga_BH1QVQo.jpg";
