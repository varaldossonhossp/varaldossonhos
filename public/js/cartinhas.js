// ============================================================
// 💌 VARAL DOS SONHOS — cartinhas.js (versão corrigida 2025)
// ------------------------------------------------------------
// Exibe as cartinhas do Airtable com visual de "varal" e modal zoom
// ============================================================

document.addEventListener("DOMContentLoaded", carregarCartinhas);

async function carregarCartinhas() {
  // 🔧 Seletor atualizado — compatível com o novo CSS
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

    if (cartinhas.length === 0) {
      container.innerHTML = "<p>Nenhuma cartinha disponível no momento 💌</p>";
      return;
    }

    cartinhas.forEach((carta) => {
      const nome = (carta.nome || "").split(" ")[0];
      const idade = carta.idade ? `${carta.idade} anos` : "";
      const sonho = carta.sonho || "Sonho não informado 💭";
      const imagem = carta.imagem || "imagens/cartinha-padrao.png";

      const card = document.createElement("div");
      card.className = "card-cartinha";
      card.innerHTML = `
        <img class="prendedor" src="imagens/prendedor.png" alt="Prendedor">
        <img class="carta" src="${imagem}" alt="Cartinha de ${nome}" loading="lazy" onclick="abrirModal('${imagem}', '${nome}', '${sonho}')">
        <div class="cartinha-info">
          <h3>${nome}</h3>
          ${idade ? `<p><strong>Idade:</strong> ${idade}</p>` : ""}
          <p><strong>Sonho:</strong> ${sonho}</p>
          <button class="btn-adotar">💙 Adotar</button>
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
