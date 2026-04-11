(function () {
  const usuario = localStorage.getItem("usuario");

  if (usuario !== "custo") {
    window.location.href = "index.html";
  }
})();

let itens = JSON.parse(localStorage.getItem("easy_itens") || "[]");

function salvar() {
  localStorage.setItem("easy_itens", JSON.stringify(itens));
}

function renderizar() {
  const lista = document.getElementById("lista-itens");
  lista.innerHTML = "";

  itens.forEach(item => {
    lista.innerHTML += `
      <div class="easy-item">
        <div>
          <strong>${item.referencia}</strong><br>
          ${item.banho}
        </div>
        <span>R$ ${item.valor}</span>
      </div>
    `;
  });
}

function adicionarItem() {
  const referencia = document.getElementById("referencia").value;
  const banho = document.getElementById("banho").value;
  const valor = document.getElementById("valor").value;

  if (!referencia || !banho || !valor) {
    alert("Preencha todos os campos");
    return;
  }

  itens.push({ referencia, banho, valor });

  salvar();
  renderizar();

  document.getElementById("referencia").value = "";
  document.getElementById("banho").value = "";
  document.getElementById("valor").value = "";
}

function baixarCSV() {
  let csv = "referencia;banho;valor\n";

  itens.forEach(item => {
    csv += `${item.referencia};${item.banho};${item.valor}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "itens_easy.csv";
  a.click();
}

renderizar();