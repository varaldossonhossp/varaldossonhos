// ============================================================
// 💌 VARAL DOS SONHOS — cartinhas.js (versão final revisada 2025)
// ============================================================

document.addEventListener("DOMContentLoaded", carregarCartinhas);

async function carregarCartinhas() {
  const container = document.querySelector(".cartinhas-lista") || document.querySelector(".varal-cartinhas");
  if (!container) return;

  try {
    const baseURL = window.location.hostname.includes("vercel.app")
      ? ""
      : "https://varaldossonhos-sp.vercel.app";

    const resposta = await fetch(`${baseURL}/api/cartinhas`);
    if (!resposta.ok) throw new Error("Falha ao carregar cartinhas");

    const cartinhas = await resposta.json();
    container.innerHTML = "";

    // 🔹 Exibe apenas as cartinhas com status "disponível"
    const disponiveis = cartinhas.filter(c => c.status?.toLowerCase() === "disponível");

    if (disponiveis.length === 0) {
      container.innerHTML = "<p>Nenhuma cartinha disponível no momento 💌</p>";
      return;
    }

    disponiveis.forEach((carta) => {
      const nome = (carta.nome || "").split(" ")[0];
      const idade = carta.idade ? `${carta.idade} anos` : "";
      const sonho = carta.sonho || "Sonho não informado 💭";
      const imagem = carta.imagem || "imagens/cartinha-padrao.png";

      const card = document.createElement("div");
      card.className = "card-cartinha";
      card.innerHTML = `
        <img class="prendedor" src="imagens/prendedor.png" alt="Prendedor">
        <img class="carta" src="${imagem}" alt="Cartinha de ${nome}" loading="lazy"
             onclick="abrirModal('${imagem}', '${nome}', '${sonho}')">
        <div class="cartinha-info">
          <h3>${nome}</h3>
          ${idade ? `<p><strong>Idade:</strong> ${idade}</p>` : ""}
          <p><strong>Sonho:</strong> ${sonho}</p>
          <button class="btn-adotar" data-id="${carta.id}" data-nome="${nome}" data-sonho="${sonho}"
            data-imagem="${imagem}">💙 Adotar</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (erro) {
    console.error("❌ Erro ao carregar cartinhas:", erro);
    container.innerHTML = `<p class="erro">Erro ao carregar as cartinhas. Tente novamente mais tarde.</p>`;
  }
}

// ============================================================
// 🛒 Adicionar cartinha ao carrinho
// ============================================================
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-adotar")) {
    const btn = e.target;
    const id = btn.dataset.id;
    const nome = btn.dataset.nome;
    const sonho = btn.dataset.sonho;
    const imagem = btn.dataset.imagem;

    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario) {
      alert("⚠️ Faça login antes de adotar uma cartinha!");
      window.location.href = "login.html";
      return;
    }

    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    const jaExiste = carrinho.some((c) => c.id === id);
    if (jaExiste) {
      alert(`⚠️ A cartinha de ${nome} já está no seu carrinho!`);
      return;
    }

    carrinho.push({ id, nome, sonho, imagem });
    localStorage.setItem("carrinho", JSON.stringify(carrinho));

    btn.textContent = "💙 No Carrinho!";
    btn.disabled = true;
    btn.style.background = "#9cd3ff";

    alert(`💙 A cartinha de ${nome} foi adicionada ao seu carrinho com sucesso!`);
  }
});

// ============================================================
// 🌈 Modal para zoom da cartinha
// ============================================================
function abrirModal(imagem, nome, sonho) {
  const modal = document.createElement("div");
  modal.className = "zoom-modal is-open";
  modal.innerHTML = `
    <div class="zoom-backdrop" onclick="this.parentElement.remove()"></div>
    <figure class="zoom-figure">
      <button class="zoom-close" onclick="this.parentElement.parentElement.remove()">×</button>
      <img src="${imagem}" alt="Cartinha de ${nome}">
      <figcaption>${nome} — ${sonho}</figcaption>
    </figure>
  `;
  document.body.appendChild(modal);
}
