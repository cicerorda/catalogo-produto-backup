import { cacheVariantes, cacheImagemPorRef, mapaImagemPorNomeLimpo, URL_SEM_IMAGEM } from "./state.js";
import { limparTexto } from "./utils.js";

export function gerarVariantes(ref) {
  if (cacheVariantes.has(ref)) return cacheVariantes.get(ref);

  const variantes = new Set();
  const crua = limparTexto(ref);
  variantes.add(crua);

  const partes = ref.split(".");
  if (partes.length >= 2) {
    variantes.add(limparTexto(`${partes[0]}.${partes[1]}`));
  }

  const resultado = Array.from(variantes);
  cacheVariantes.set(ref, resultado);
  return resultado;
}

export function encontrarImagem(ref) {
  if (!ref) return URL_SEM_IMAGEM;

  if (cacheImagemPorRef.has(ref)) {
    return cacheImagemPorRef.get(ref);
  }

  const variantes = gerarVariantes(ref);

  for (const v of variantes) {
    const url = mapaImagemPorNomeLimpo.get(v);
    if (url) {
      cacheImagemPorRef.set(ref, url);
      return url;
    }
  }

  cacheImagemPorRef.set(ref, URL_SEM_IMAGEM);
  return URL_SEM_IMAGEM;
}