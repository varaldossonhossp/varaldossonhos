// ============================================================
// 💌 cartinhas.js — carrega lista de cartinhas do Airtable
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

    const resp = await fetch(`${baseURL}/api/cartinhas`, { cache: "no-store" });

    if (!resp.ok) {
      // Lê corpo do erro para ver o motivo real
      let erro;
      try {
        erro = await resp.json();
      } catch {
        erro = { erro: await resp.text() };
      }
      console.error("❌ Falha /api/cartinhas:", erro);
      throw new Error(erro?.erro || "Erro ao carregar cartinhas");
    }

    const cartinhas = await resp.json();
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
          <h3>${c.nome}${c.idade ? `, ${c.idade}` : ""}</h3>
          <p>${c.carta || ""}</p>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (e) {
    console.error("Erro ao carregar cartinhas:", e);
    container.innerHTML = `<p>Erro ao carregar as cartinhas.<br>Tente novamente mais tarde.</p>`;
  }
}
