export async function carregarProdutos() {
  const index = await fetch("produtos_index.json").then(r => r.json());

  const listas = await Promise.all(
    index.arquivos.map(nome =>
      fetch("produtos/" + nome).then(r => r.json())
    )
  );

  return listas.flat(); // 👈 só retorna
}