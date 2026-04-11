import { carregarProdutos } from "./produtos.js";
import { exibirProdutos } from "./ui.js";

async function init() {
  const produtos = await carregarProdutos(); // 👈 recebe aqui

  exibirProdutos(produtos);
}

init();