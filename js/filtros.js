import { produtos, termoBusca } from "./state.js";
import { limparTexto } from "./utils.js";

export function obterProdutosFiltrados() {
  return produtos.filter(produto => {
    return (
      !termoBusca ||
      limparTexto(produto.Referencia).includes(limparTexto(termoBusca)) ||
      limparTexto(produto.Descricao).includes(limparTexto(termoBusca))
    );
  });
}