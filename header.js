function renderHeader({ mostrarBusca = false, mostrarUser = true }) {
  const usuario = localStorage.getItem("usuario");

  const navbar = document.createElement("div");
  navbar.className = "navbar";

  navbar.innerHTML = `
    <div class="navbar-content">
      <img src="logo.jpeg" class="logo">

      ${mostrarBusca ? `
        <input type="search" id="search-input" placeholder="Buscar produto...">
      ` : ""}

      <div style="display:flex; align-items:center; gap:10px;">

        ${usuario === "custo" ? `
          <button onclick="irParaEasy()" class="btn-easy">Easy</button>
        ` : ""}

        ${mostrarUser ? `
          <div class="user-info">
            <span id="usuario-logado"></span>
            <button onclick="logout()">Sair</button>
          </div>
        ` : ""}
      </div>
    </div>
  `;

  document.body.prepend(navbar);

  // 👤 usuário
  if (mostrarUser) {
    const el = document.getElementById("usuario-logado");
    if (el && usuario) {
      el.innerHTML = `👤 <strong>${usuario}</strong>`;
    }
  }
}

function irParaEasy() {
  window.location.href = "easy.html";
}