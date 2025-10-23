// ============================================================
// 💌 VARAL DOS SONHOS — cartinhas.js
// ------------------------------------------------------------
// Lista e exibe as cartinhas cadastradas no Airtable.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  carregarCartinhas();
});

async function carregarCartinhas() {
  const container = document.getElementById("cartinhasContainer");
  if (!container) return;

  try {
    const baseURL = window.location.hostname.includes("vercel.app")
      ? ""
      : "https://varaldossonhos.vercel.app";

    const resposta = await fetch(`${baseURL}/api/cartinhas`);
    if (!resposta.ok) throw new Error("Erro ao carregar cartinhas");

    const cartinhas = await resposta.json();
    container.innerHTML = "";

    if (!cartinhas || cartinhas.length === 0) {
      container.innerHTML = `<p>Nenhuma cartinha disponível no momento 💌</p>`;
      return;
    }

    cartinhas.forEach((c) => {
      const card = document.createElement("div");
      card.className = "cartinha-card";
      card.innerHTML = `
        <img src="${c.imagem}" alt="Cartinha de ${c.nome}" onerror="this.src='imagens/cartinha-padrao.png'">
        <div class="cartinha-info">
          <h3>${c.nome}, ${c.idade}</h3>
          <p>${c.carta}</p>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (erro) {
    console.error("Erro ao carregar cartinhas:", erro);
    container.innerHTML = `<p>Erro ao carregar as cartinhas.<br>Tente novamente mais tarde.</p>`;
  }
}
