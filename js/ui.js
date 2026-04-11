import { encontrarImagem } from "./imagens.js";

export function exibirProdutos(lista) {
  const container = document.getElementById("products");
  container.innerHTML = "";

  lista.forEach(produto => {
    const card = document.createElement("div");
    card.classList.add("card");

    const img = encontrarImagem(produto.Referencia);

    card.innerHTML = `
      <img src="${img}" />
      <h5>${produto.Referencia}</h5>
      <p>${produto.Descricao}</p>
    `;

    container.appendChild(card);
  });
}