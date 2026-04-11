import { paginaAtual, itensPorPagina } from "./state.js";

export function paginar(lista) {
  const inicio = (paginaAtual - 1) * itensPorPagina;
  return lista.slice(inicio, inicio + itensPorPagina);
}