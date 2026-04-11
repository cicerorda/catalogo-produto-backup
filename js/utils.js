export function limparTexto(texto) {
  return (texto || "").toLowerCase().replace(/[.\s\-_]/g, "");
}

export function removerSufixoDeVariacao(ref) {
  return (ref ?? "").toString().split(/[-_]/)[0];
}

export function baseDoisBlocos(ref) {
  const s = (ref ?? "").toString().toLowerCase().trim();
  const partes = s.split(".");
  if (partes.length >= 2) return `${partes[0]}.${partes[1]}`;
  return s;
}